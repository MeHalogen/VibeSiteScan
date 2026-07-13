/**
 * Cooperative stop registry for in-flight scans.
 *
 * A scan streams over one-way NDJSON, so the client can't tell the running
 * scan to stop through that channel. Instead the stream assigns a scanId,
 * sends it as the first `scan_started` event, and the client hits POST
 * /api/demo-scan/stop with that id. The running scan polls `isStopRequested`
 * at its network-loop boundaries and finalizes a partial result at that point.
 *
 * Per-server-instance in-memory state (same model as the demo store). Entries
 * self-expire so a crashed/abandoned scan can't leak.
 */

interface ControlRecord {
  stop: boolean;
  createdAt: number;
}

const TTL_MS = 1000 * 60 * 10; // 10 minutes — longer than any scan

const globalForControl = globalThis as unknown as {
  __vibesitescanScanControl?: Map<string, ControlRecord>;
};
const registry: Map<string, ControlRecord> =
  globalForControl.__vibesitescanScanControl ??
  (globalForControl.__vibesitescanScanControl = new Map());

function sweep() {
  const now = Date.now();
  for (const [k, v] of Array.from(registry.entries())) {
    if (now - v.createdAt > TTL_MS) registry.delete(k);
  }
}

/** Register a scan as running. Call once at stream start. */
export function registerScan(scanId: string): void {
  sweep();
  registry.set(scanId, { stop: false, createdAt: Date.now() });
}

/** Request that a running scan stop at its next checkpoint. */
export function requestStop(scanId: string): boolean {
  const rec = registry.get(scanId);
  if (!rec) return false;
  rec.stop = true;
  return true;
}

/** Polled by the scanner at loop boundaries. */
export function isStopRequested(scanId: string): boolean {
  return registry.get(scanId)?.stop ?? false;
}

/** Remove a scan from the registry once it has finished. */
export function clearScan(scanId: string): void {
  registry.delete(scanId);
}
