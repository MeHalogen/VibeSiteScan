# Pipeline Reliability & Trust — Design

**Date:** 2026-07-12
**Goal:** Make the scan pipeline UI truthful and reliable. Every stage the UI shows must reflect what the scanner actually did; every failure must surface its real cause; nothing may spin forever or claim "ok" when it isn't.

## Problem

The scan pipeline has a broken contract between three layers — scanner (`lib/scanner/index.ts`), NDJSON stream (`app/api/demo-scan/stream/route.ts`), and UI orchestrator (`lib/scan-pipeline/orchestrator.ts` + `app/components/scan/*`). Verified defects:

### Contract mismatches
- **D1** Scanner emits `exposure`, `ai_leftovers`, `keys`, `form_analysis` stage events that don't exist in `PIPELINE_STAGES` — they are silently dropped. The product's security differentiator (exposed keys, AI leftovers, risky routes) is invisible in the pipeline.
- **D2** UI stage order ≠ execution order (`score` runs 2nd, `browser` before `seo`), so the "running" highlight jumps around the list.
- **D3** Links stage always ends `completed` with badge "✓ ok" — broken-link counts are computed *after* `stage_end` and never emitted.
- **D4** `seo`/`social`/`forms` stages always end `completed` regardless of issues found.
- **D5** `score` (Indexing) stage ends `completed` even when robots.txt/sitemap.xml are missing.
- **D6** When Playwright is unavailable, browser stage shows a red ✗ "failed" on every scan — indistinguishable from a real browser failure.

### Stream / error robustness
- **D7** No `error` event type. Server sends errors as a `log` line then closes; client throws generic "Scan stream ended unexpectedly", losing the real cause.
- **D8** Invalid request body returns a 200 stream, not a 400.
- **D9** On failure, pending stages stay `pending` forever; `isRunning` stays true → header claims "System active" on a dead scan.
- **D10** No timeout/abort — a hung server spins the UI forever; no cancel control.
- **D11** Retry doesn't reset stages/logs — stale statuses from the failed run linger.
- **D12** If the result fetch fails post-scan, the summary renders fake zeros / "Unknown" decision instead of admitting the report is unavailable.
- **D13** Client disconnect makes `controller.enqueue` throw unhandled in the route.

### UI truthfulness
- **D14** Every stage's evidence panel gets *all* logs, then filters by fragile keyword hints ("checking" → links). Logs appear under wrong stages.
- **D15** `skipped` maps to `idle` visuals; on quick scans discover/crawl look "queued" forever and progress caps at ~70% because skipped weight never counts.
- **D16** Elapsed clock keeps ticking after completion.
- **D17** Displayed scan ID (`scan_<ts>`) is not the real report ID (`demo-<ts>`).
- **D18** `calculateProgress` denominator comes from a static weight map, so any stage-list change breaks the math.
- **D19** Dead code: `orchestrator.mapResultToStages`, unused components (`PipelineStageNode`, `PipelineConnector`, `StageInspector`, `EvidenceStream`, `ScanCompleteSummary-old`), duplicate stage_end logging.

## Design

Single principle: **the stage registry is the contract**. Scanner stage IDs, UI stages, and progress weights must be one synchronized set, in execution order. Errors are first-class events. Every terminal state (completed / warning / failed / skipped) is visually distinct and carries its reason.

### 1. Event contract — `lib/scan-events.ts`
Add `{ type: "error"; message: string; stageId?: string }`. Scanner's inline emitter type is replaced by this shared type.

### 2. Stage registry — `lib/scan-pipeline/types.ts`
Reorder to true execution order and add the missing stages:
`init → score (Indexing) → fetch → discover → crawl → links → browser → seo → social → forms → exposure (Route Exposure) → ai_leftovers (AI Leftovers) → keys (Secret Scan) → form_analysis (Form Safety) → report`.
`PipelineStage` gains `statusMessage?: string` (reason for skip/failure). `ScanLog` gains `stageId?: string`.

### 3. Progress — `lib/design-system.ts`
Weights for new stages; `calculateProgress` derives its denominator from the stages actually passed in and counts `skipped` as resolved.

### 4. Orchestrator — `lib/scan-pipeline/orchestrator.ts`
- Tag logs with `stageId`; log once per stage_end (message folded into `completeStage`).
- Handle `error` events: mark running → failed, pending → skipped ("not reached"), throw with the server's message.
- Stream end without `result` → same finalization + throw.
- Unknown stage IDs log a visible warning instead of vanishing.
- Delete `mapResultToStages` (dead).

### 5. Stream route — `app/api/demo-scan/stream/route.ts`
- Validate body *before* opening the stream; 400 JSON on invalid input.
- Guard sends behind a `closed` flag; catch enqueue errors (client disconnect).
- On scan failure emit `{type:"error", message}` before closing.

### 6. Scanner — `lib/scanner/index.ts` (surgical edits only)
- Links: compute broken counts inside the stage; end `warning` with counts when > 0.
- seo/social/forms: count issues by `category` from `generateEnhancedIssues`; end `warning` with counts when > 0.
- score: end `warning` when robots or sitemap missing.
- browser: Playwright-unavailable → `skipped` with reason; genuine run failure → `failed` with reason.

### 7. Client — `app/components/scan/*`
- **ScanInitializer**: reset state on start; double-start guard; `AbortController` + 90s idle watchdog; read 400 error bodies; adopt server scan ID; result-fetch failure sets `report_unavailable` instead of fake data; cancel support; pass `phase`/`completedAt` down.
- **PipelineView / PipelineVerticalView / PipelineStageRow**: `skipped` as first-class visual (dimmed dash + "skipped" chip); `isRunning` from phase, not stage statuses; elapsed clock stops at `completedAt`; badges for security stages; weight-based time estimate shown only while running; cancel button while running.
- **PipelineDetailPanel**: filter evidence by `log.stageId` (global untagged logs shown everywhere — they're few milestones); checks/output rows for the 4 new stages; show `statusMessage` for skipped/failed stages.
- **ScanCompleteSummary**: honest "report unavailable" state; error screen gains VIEW PIPELINE to inspect where it died.

### 8. Cleanup
Delete unused: `PipelineStageNode.tsx`, `PipelineConnector.tsx`, `StageInspector.tsx`, `EvidenceStream.tsx`, `ScanCompleteSummary-old.tsx` (verified: zero imports).

## Out of scope
Config panel redesign, report page, Supabase persistence path (`/api/scans/*`), scanner check depth/new detections, deep scan mode.

## Error handling summary
| Failure | Before | After |
|---|---|---|
| Invalid URL | 200 stream, generic error | 400 + exact message |
| Private/local URL | "stream ended unexpectedly" | error event → "Private and local URLs are not allowed…" at failed stage |
| Server death mid-scan | UI spins forever | watchdog aborts after 90s idle, honest error state |
| Playwright missing | red "failed" | "skipped — browser engine unavailable" |
| Report retrieval fails | fake zeros summary | "report unavailable" state with retry |

## Verification
1. `npx tsc --noEmit` and `npm run build` pass.
2. Live run (dev server + browser): scan a real site; confirm stages light up in listed order, security stages appear with counts, links/metadata stages show warning when issues exist, elapsed clock freezes on completion, scan ID matches report link.
3. Error paths: scan `http://localhost:9` (private → error event surfaces exact message), invalid URL (400 message), cancel mid-scan.
