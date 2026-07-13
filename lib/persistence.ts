/**
 * Scan persistence — the durable record behind a public certificate.
 *
 * Design goal: be REAL, never fake. A certificate URL must resolve to the exact
 * scan that produced it. Two backends, chosen automatically:
 *
 *   1. Supabase (when real credentials are configured) — durable across
 *      restarts and deploys. This is production.
 *   2. In-memory token store (fallback) — durable within a running server
 *      instance. This is dev/demo, and it resets on restart. We say so; we
 *      never pretend an in-memory certificate is permanent.
 *
 * Persistence never throws into the scan path: a storage failure degrades to
 * the in-memory record and is reported, it does not break the scan.
 */

import { supabaseAdmin } from '@/lib/supabase';

export type PersistBackend = 'supabase' | 'memory';

export interface PersistInput {
  scanId: string;
  shareToken: string;
  targetUrl: string;
  scan: any; // flat scan row (already assembled by the caller)
  result: any; // full ScanResult incl. issues + certification
}

export interface PersistedCertificate {
  shareToken: string;
  scanId: string;
  targetUrl: string;
  scannedAt: string;
  certification: any; // lib/certification Certification
  launchReadiness: any;
  issues: any[];
  backend: PersistBackend;
  /** True when the record lives only in memory (resets on restart). */
  ephemeral: boolean;
}

// ── Backend detection ────────────────────────────────────────────────────────

/**
 * Supabase is "configured" only when the URL is a real project (not the
 * placeholder in the checked-in .env) and both keys are present.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return false;
  if (url.includes('placeholder') || url.includes('example')) return false;
  try {
    const host = new URL(url).host;
    return host.endsWith('.supabase.co') || host.endsWith('.supabase.in');
  } catch {
    return false;
  }
}

// ── In-memory token store (fallback + fast cache) ────────────────────────────

interface TokenRecord {
  data: PersistedCertificate;
  createdAt: number;
}

const CERT_TTL_MS = 1000 * 60 * 60 * 24; // 24h for certificate tokens

const globalForCerts = globalThis as unknown as {
  __vibesitescanCerts?: Map<string, TokenRecord>;
};
const certStore: Map<string, TokenRecord> =
  globalForCerts.__vibesitescanCerts ?? (globalForCerts.__vibesitescanCerts = new Map());

function cleanup() {
  const now = Date.now();
  for (const [k, v] of Array.from(certStore.entries())) {
    if (now - v.createdAt > CERT_TTL_MS) certStore.delete(k);
  }
}

function toCertificateRecord(input: PersistInput, backend: PersistBackend, ephemeral: boolean): PersistedCertificate {
  return {
    shareToken: input.shareToken,
    scanId: input.scanId,
    targetUrl: input.targetUrl,
    scannedAt: input.result?.certification?.scannedAt || new Date().toISOString(),
    certification: input.result?.certification ?? null,
    launchReadiness: input.result?.launchReadiness ?? null,
    issues: input.result?.issues ?? [],
    backend,
    ephemeral,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Persist a completed scan and return how/where it was stored. Always writes
 * the in-memory record (fast path); additionally writes Supabase when
 * configured. Never throws.
 */
export async function persistScanResult(input: PersistInput): Promise<{
  backend: PersistBackend;
  ephemeral: boolean;
}> {
  cleanup();

  let backend: PersistBackend = 'memory';
  let ephemeral = true;

  if (isSupabaseConfigured()) {
    try {
      await writeToSupabase(input);
      backend = 'supabase';
      ephemeral = false;
    } catch (err) {
      // Degrade to memory but keep going — the scan already succeeded.
      console.error('[persistence] Supabase write failed, using in-memory record:', err);
      backend = 'memory';
      ephemeral = true;
    }
  }

  // Always keep an in-memory copy so the certificate resolves immediately even
  // while Supabase replication settles, and so dev works with no DB.
  certStore.set(input.shareToken, {
    data: toCertificateRecord(input, backend, ephemeral),
    createdAt: Date.now(),
  });

  return { backend, ephemeral };
}

/**
 * Resolve a certificate by its public share token. Supabase first (durable),
 * then the in-memory store. Returns null when unknown/expired.
 */
export async function getScanByToken(token: string): Promise<PersistedCertificate | null> {
  cleanup();

  if (isSupabaseConfigured()) {
    try {
      const fromDb = await readFromSupabase(token);
      if (fromDb) return fromDb;
    } catch (err) {
      console.error('[persistence] Supabase read failed, trying memory:', err);
    }
  }

  return certStore.get(token)?.data ?? null;
}

// ── Supabase implementation ──────────────────────────────────────────────────

async function writeToSupabase(input: PersistInput): Promise<void> {
  const { scan, result, shareToken, targetUrl } = input;
  const cert = result?.certification;
  const lr = result?.launchReadiness;

  const { data: inserted, error } = await supabaseAdmin
    .from('scans')
    .insert({
      target_url: targetUrl,
      normalized_url: result?.rootUrl || targetUrl,
      scan_depth: scan?.scan_depth || 'quick',
      status: 'completed',
      launch_score: scan?.launch_score ?? null,
      critical_count: scan?.critical_issues_count ?? 0,
      warning_count: scan?.warning_issues_count ?? 0,
      pages_scanned: scan?.pages_count ?? 0,
      duration_ms: scan?.duration_ms ?? null,
      started_at: scan?.started_at ?? new Date().toISOString(),
      completed_at: scan?.completed_at ?? new Date().toISOString(),
      share_token: shareToken,
      // Certification columns (migration 002). If the migration is not applied
      // this insert fails and the caller degrades to memory.
      certification_gate: cert?.gate ?? null,
      overall_grade: cert?.overallGrade ?? null,
      scan_coverage: lr?.scanCoverage ?? null,
      result_confidence: lr?.resultConfidence ?? null,
      certification_json: cert ?? null,
      report_json: {
        launchReadiness: lr ?? null,
        rootUrl: result?.rootUrl ?? targetUrl,
      },
    })
    .select('id')
    .single();

  if (error) throw error;

  const scanRowId = inserted.id;
  const issues = (result?.issues || []) as any[];
  if (issues.length > 0) {
    const rows = issues.slice(0, 500).map((i) => ({
      scan_id: scanRowId,
      severity: i.severity || 'info',
      category: i.category || 'general',
      title: i.title || i.issueCode || 'Issue',
      description: i.whatFound || i.description || '',
      fix_suggestion: i.developerFix || '',
      evidence: typeof i.evidence === 'string' ? i.evidence : JSON.stringify(i.evidenceJson || {}),
    }));
    const { error: issuesError } = await supabaseAdmin.from('scan_issues').insert(rows);
    if (issuesError) throw issuesError;
  }
}

async function readFromSupabase(token: string): Promise<PersistedCertificate | null> {
  const { data: scan, error } = await supabaseAdmin
    .from('scans')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error || !scan) return null;

  const { data: issues } = await supabaseAdmin
    .from('scan_issues')
    .select('*')
    .eq('scan_id', scan.id);

  return {
    shareToken: token,
    scanId: scan.id,
    targetUrl: scan.target_url,
    scannedAt: scan.certification_json?.scannedAt || scan.completed_at || scan.created_at,
    certification: scan.certification_json ?? null,
    launchReadiness: scan.report_json?.launchReadiness ?? null,
    issues: (issues || []).map((i: any) => ({
      severity: i.severity,
      category: i.category,
      title: i.title,
      whatFound: i.description,
      developerFix: i.fix_suggestion,
    })),
    backend: 'supabase',
    ephemeral: false,
  };
}
