"use client";

import { useRef, useState } from "react";
import { ScanConfig, ScanState, PIPELINE_STAGES } from "@/lib/scan-pipeline/types";
import { PipelineOrchestrator, ScanStreamError } from "@/lib/scan-pipeline/orchestrator";
import type { ScanEvent } from "@/lib/scan-events";
import { ScanConfigPanel } from "./ScanConfigPanel";
import { PipelineView } from "./PipelineView";
import { ScanCompleteSummary } from "./ScanCompleteSummary";

/** Abort the scan if the stream goes silent for this long (server hang/death). */
const STREAM_IDLE_TIMEOUT_MS = 90_000;

function freshState(): ScanState {
  return {
    phase: "config",
    config: null,
    stages: PIPELINE_STAGES.map(s => ({ ...s, status: "pending" as const })),
    selectedStageId: null,
    logs: [],
  };
}

export function ScanInitializer() {
  const [scanState, setScanState] = useState<ScanState>(freshState());
  const [showPipeline, setShowPipeline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scanRunningRef = useRef(false);
  // scanId the server assigned for THIS run — used to request a graceful stop.
  const runningScanIdRef = useRef<string | null>(null);

  const handleStartScan = async (config: ScanConfig) => {
    if (scanRunningRef.current) return;
    scanRunningRef.current = true;

    // Reset stage/log state so a retry never shows leftovers from the last run
    setScanState({
      ...freshState(),
      phase: "running",
      config,
      startedAt: new Date(),
    });
    setShowPipeline(false);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const orchestrator = new PipelineOrchestrator();

      const response = await fetch("/api/demo-scan/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          url: config.targetUrl,
          depth: config.scanMode === "quick" ? "quick" : "standard",
        }),
      });
      if (!response.ok) {
        let message = `Scan request failed (HTTP ${response.status})`;
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {
          // non-JSON error body
        }
        throw new Error(message);
      }
      if (!response.body) throw new Error("Scan stream could not be opened");

      // Watchdog: a stream that stops producing events means the server hung
      // or died. Without this the pipeline would show "running" forever.
      let idleTimer: ReturnType<typeof setTimeout> | undefined;
      const armWatchdog = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          abort.abort(
            new Error("The scan stopped responding. The server may be overloaded — try again.")
          );
        }, STREAM_IDLE_TIMEOUT_MS);
      };

      const ndjsonEvents = async function* (
        body: ReadableStream<Uint8Array>
      ): AsyncGenerator<ScanEvent> {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        armWatchdog();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            armWatchdog();
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                yield JSON.parse(trimmed);
              } catch {
                // ignore malformed line
              }
            }
          }
          if (buffer.trim()) {
            try {
              yield JSON.parse(buffer.trim());
            } catch {
              // ignore
            }
          }
        } finally {
          if (idleTimer) clearTimeout(idleTimer);
        }
      };

      const result = await orchestrator.runPipelineWithEvents(
        (stages, logs) => {
          setScanState(prev => ({
            ...prev,
            stages,
            logs,
          }));
        },
        ndjsonEvents(response.body),
        (scanId) => {
          runningScanIdRef.current = scanId;
          setScanState(prev => ({ ...prev, scanId }));
        }
      );

      // Fetch the full report by the server-issued scan id
      let fullResult: any = result;
      if (result?.id) {
        try {
          const resultResponse = await fetch(`/api/demo-scan/result/${result.id}`);
          if (!resultResponse.ok) throw new Error(`HTTP ${resultResponse.status}`);
          const data = await resultResponse.json();
          fullResult = data.scan || data.result || result;
        } catch (err) {
          console.error("Failed to fetch full result:", err);
          // Keep this honest: the scan finished but the report is gone.
          // Never render a summary built from made-up zeros.
          fullResult = { id: result.id, report_unavailable: true };
        }
      }

      setScanState(prev => ({
        ...prev,
        phase: "complete",
        scanId: result?.id ?? prev.scanId,
        result: fullResult,
        completedAt: new Date(),
      }));
    } catch (error: any) {
      // Surface the abort reason (watchdog/cancel) instead of the generic AbortError
      const abortReason = abort.signal.aborted ? (abort.signal.reason as Error | undefined) : undefined;
      const message = abortReason?.message || error?.message || "Scan failed";
      const failedStage = error instanceof ScanStreamError ? error.stageId : undefined;
      setScanState(prev => ({
        ...prev,
        phase: "error",
        completedAt: new Date(),
        error: {
          message,
          failedStage: failedStage ?? prev.stages.find(s => s.status === "running" || s.status === "failed")?.id,
        },
      }));
    } finally {
      scanRunningRef.current = false;
      abortRef.current = null;
      runningScanIdRef.current = null;
    }
  };

  // Stop = graceful partial. Ask the server to finalize a partial report at the
  // current point; the stream then completes normally and we land on a partial
  // summary. Only if we never got a scanId (very early) do we hard-abort.
  const handleCancel = async () => {
    const scanId = runningScanIdRef.current;
    if (scanId) {
      try {
        await fetch("/api/demo-scan/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId }),
        });
        return; // scan will finalize partial and the stream will complete
      } catch {
        // fall through to hard abort
      }
    }
    abortRef.current?.abort(new Error("Scan cancelled"));
  };

  const handleRetry = () => {
    if (scanState.config) {
      handleStartScan(scanState.config);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort(new Error("Scan cancelled"));
    setShowPipeline(false);
    setScanState(freshState());
  };

  const shellClass =
    scanState.phase === "config"
      ? "launch-gate min-h-screen relative overflow-hidden"
      : "launch-console min-h-screen relative overflow-hidden scan-sweep scanline-overlay";

  // Phase screens swap by conditional rendering, NOT AnimatePresence.
  // mode="wait" gated the swap on the exit animation finishing; browsers
  // throttle rAF in background tabs, so a user who started a scan and
  // switched tabs could get stuck on the config screen while the scan ran
  // invisibly. A status surface must never depend on animation to update.
  return (
    <div className={shellClass}>
      <>
        {scanState.phase === "config" && (
          <ScanConfigPanel
            key="config"
            onStartScan={handleStartScan}
          />
        )}

        {scanState.phase === "running" && (
          <PipelineView
            key="running"
            phase={scanState.phase}
            config={scanState.config!}
            stages={scanState.stages}
            logs={scanState.logs}
            scanId={scanState.scanId}
            startedAt={scanState.startedAt}
            onCancel={handleCancel}
          />
        )}

        {(scanState.phase === "complete" || scanState.phase === "error") && !showPipeline && (
          <ScanCompleteSummary
            key="complete"
            result={scanState.result}
            error={scanState.error}
            stages={scanState.stages}
            config={scanState.config!}
            startedAt={scanState.startedAt}
            completedAt={scanState.completedAt}
            onRetry={handleRetry}
            onReset={handleReset}
            onViewPipeline={() => setShowPipeline(true)}
          />
        )}

        {(scanState.phase === "complete" || scanState.phase === "error") && showPipeline && (
          <PipelineView
            key="pipeline-complete"
            phase={scanState.phase}
            config={scanState.config!}
            stages={scanState.stages}
            logs={scanState.logs}
            scanId={scanState.scanId}
            startedAt={scanState.startedAt}
            completedAt={scanState.completedAt}
            onViewSummary={() => setShowPipeline(false)}
          />
        )}
      </>
    </div>
  );
}
