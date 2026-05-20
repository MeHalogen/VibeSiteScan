export type ScanEvent =
  | { type: "log"; message: string; severity?: "info" | "success" | "warning" | "error" }
  | { type: "stage_start"; stageId: string; message?: string; metrics?: Record<string, any> }
  | { type: "stage_progress"; stageId: string; message?: string; metrics?: Record<string, any> }
  | { type: "stage_end"; stageId: string; status?: "completed" | "warning" | "failed" | "skipped"; message?: string; metrics?: Record<string, any> }
  | { type: "result"; scanId: string };

