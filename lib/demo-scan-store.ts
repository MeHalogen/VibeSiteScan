type StoredDemoScan = {
  scan: any;
  result: any;
  createdAt: number;
};

const TTL_MS = 1000 * 60 * 20; // 20 minutes

function cleanup(map: Map<string, StoredDemoScan>) {
  const now = Date.now();
  for (const [key, value] of map.entries()) {
    if (now - value.createdAt > TTL_MS) map.delete(key);
  }
}

/**
 * In-memory store for demo scans (dev / demo mode).
 * This avoids trying to transfer huge results through window/sessionStorage.
 *
 * NOTE: This is per-server-instance and resets on restart. For production,
 * persist scans in Supabase and fetch by id.
 */
const globalForDemo = globalThis as unknown as { __vibesitescanDemoScans?: Map<string, StoredDemoScan> };

export const demoScanStore: Map<string, StoredDemoScan> =
  globalForDemo.__vibesitescanDemoScans ?? (globalForDemo.__vibesitescanDemoScans = new Map());

export function demoStorePut(scanId: string, scan: any, result: any) {
  cleanup(demoScanStore);
  demoScanStore.set(scanId, { scan, result, createdAt: Date.now() });
}

export function demoStoreGet(scanId: string) {
  cleanup(demoScanStore);
  return demoScanStore.get(scanId) ?? null;
}

