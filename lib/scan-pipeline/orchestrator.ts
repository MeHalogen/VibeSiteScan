/**
 * Pipeline orchestration - maps scan execution to visual stages.
 *
 * Consumes the ScanEvent stream (lib/scan-events.ts) and maintains the
 * stage/log state the pipeline UI renders. Every event either updates a
 * registered stage or produces a visible log entry — nothing is silently
 * dropped, and a failed or truncated stream always leaves the stages in a
 * terminal state (no stage stuck on "running" or "pending").
 */

import type { ScanEvent } from "@/lib/scan-events";
import { PipelineStage, ScanLog, StageStatus, PIPELINE_STAGES } from "./types";

export class ScanStreamError extends Error {
  readonly stageId?: string;

  constructor(message: string, stageId?: string) {
    super(message);
    this.name = "ScanStreamError";
    this.stageId = stageId;
  }
}

export class PipelineOrchestrator {
  private stages: PipelineStage[];
  private logs: ScanLog[];

  constructor() {
    this.stages = PIPELINE_STAGES.map(stage => ({
      ...stage,
      status: "pending" as StageStatus,
    }));
    this.logs = [];
  }

  getStages(): PipelineStage[] {
    return this.stages;
  }

  getLogs(): ScanLog[] {
    return this.logs;
  }

  addLog(
    message: string,
    severity: "info" | "warning" | "error" | "success" = "info",
    stageId?: string
  ) {
    this.logs.push({
      timestamp: new Date(),
      message,
      severity,
      stageId,
    });
  }

  private findStage(stageId: string, eventType: string): PipelineStage | undefined {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage) {
      // A stageId outside the registry means scanner and UI drifted apart.
      // Surface it instead of dropping the event.
      this.addLog(`Received ${eventType} for unknown stage "${stageId}"`, "warning");
    }
    return stage;
  }

  startStage(stageId: string, message?: string) {
    const stage = this.findStage(stageId, "stage_start");
    if (!stage) return;
    stage.status = "running";
    stage.startedAt = new Date();
    stage.statusMessage = undefined;
    this.addLog(message || `${stage.label} started`, "info", stageId);
  }

  progressStage(stageId: string, metrics?: Record<string, any>, message?: string) {
    const stage = this.findStage(stageId, "stage_progress");
    if (!stage) return;
    if (metrics) {
      stage.metrics = { ...(stage.metrics || {}), ...metrics };
    }
    if (message) this.addLog(message, "info", stageId);
  }

  completeStage(
    stageId: string,
    status: StageStatus = "completed",
    metrics?: Record<string, any>,
    message?: string
  ) {
    const stage = this.findStage(stageId, "stage_end");
    if (!stage) return;
    stage.status = status;
    stage.completedAt = new Date();
    if (metrics) {
      stage.metrics = { ...(stage.metrics || {}), ...metrics };
    }
    if (message) {
      stage.statusMessage = message;
    }

    if (status === "completed") {
      this.addLog(message || `${stage.label} completed`, "success", stageId);
    } else if (status === "warning") {
      this.addLog(message || `${stage.label} completed with warnings`, "warning", stageId);
    } else if (status === "failed") {
      this.addLog(message || `${stage.label} failed`, "error", stageId);
    } else if (status === "skipped") {
      this.addLog(message || `${stage.label} skipped`, "info", stageId);
    }
  }

  /**
   * Move every non-terminal stage to a terminal state after a failure so the
   * UI never shows a dead scan as still running.
   */
  private finalizeAfterFailure(reason: string) {
    for (const stage of this.stages) {
      if (stage.status === "running") {
        stage.status = "failed";
        stage.completedAt = new Date();
        stage.statusMessage = reason;
      } else if (stage.status === "pending") {
        stage.status = "skipped";
        stage.statusMessage = "Not reached — scan stopped earlier";
      }
    }
  }

  /**
   * Consume the scan event stream and mirror it into stage state.
   * Resolves with the scan id from the terminal `result` event; throws a
   * ScanStreamError carrying the real failure cause otherwise.
   */
  async runPipelineWithEvents(
    onStageUpdate: (stages: PipelineStage[], logs: ScanLog[]) => void,
    eventStream: AsyncIterable<ScanEvent>,
    onScanStarted?: (scanId: string) => void
  ): Promise<{ id: string }> {
    const publish = () => onStageUpdate([...this.stages], [...this.logs]);

    try {
      for await (const evt of eventStream) {
        if (!evt || typeof evt !== "object") continue;

        switch (evt.type) {
          case "scan_started":
            onScanStarted?.(evt.scanId);
            break;
          case "log":
            this.addLog(evt.message || "", evt.severity || "info", evt.stageId);
            break;
          case "stage_start":
            this.startStage(evt.stageId, evt.message);
            break;
          case "stage_progress":
            this.progressStage(evt.stageId, evt.metrics, evt.message);
            break;
          case "stage_end":
            this.completeStage(evt.stageId, evt.status || "completed", evt.metrics, evt.message);
            break;
          case "error":
            throw new ScanStreamError(
              evt.message || "Scan failed",
              evt.stageId || this.stages.find(s => s.status === "running")?.id
            );
          case "result":
            publish();
            return { id: evt.scanId };
          default:
            break;
        }
        publish();
      }

      throw new ScanStreamError(
        "The scan stream ended before a result was produced. The server may have restarted — try again.",
        this.stages.find(s => s.status === "running")?.id
      );
    } catch (error: any) {
      const message = error?.message || "Scan failed";
      const stageId =
        error instanceof ScanStreamError
          ? error.stageId
          : this.stages.find(s => s.status === "running")?.id;
      this.finalizeAfterFailure(message);
      this.addLog(`Scan failed: ${message}`, "error", stageId);
      publish();
      throw error instanceof ScanStreamError ? error : new ScanStreamError(message, stageId);
    }
  }
}
