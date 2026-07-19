/**
 * Canonical scan progress event contract.
 *
 * This is the single source of truth for events flowing
 * scanner → NDJSON stream → pipeline orchestrator → UI.
 * Stage IDs must match `PIPELINE_STAGES` in lib/scan-pipeline/types.ts.
 */

export type ScanStageEndStatus = "completed" | "warning" | "failed" | "skipped";

export type ScanLogSeverity = "info" | "success" | "warning" | "error";

export type ScanEvent =
  | { type: "scan_started"; scanId: string }
  | { type: "log"; message: string; severity?: ScanLogSeverity; stageId?: string }
  | { type: "stage_start"; stageId: string; message?: string; metrics?: Record<string, any> }
  | { type: "stage_progress"; stageId: string; message?: string; metrics?: Record<string, any> }
  | { type: "stage_end"; stageId: string; status?: ScanStageEndStatus; message?: string; metrics?: Record<string, any> }
  | { type: "error"; message: string; stageId?: string }
  | { type: "result"; scanId: string };

/** Emitter signature accepted by runScan's onProgress option. */
export type ScanProgressEvent = Exclude<ScanEvent, { type: "error" } | { type: "result" }>;
export type ScanProgressEmitter = (event: ScanProgressEvent) => void;
