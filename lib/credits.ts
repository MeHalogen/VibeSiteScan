/**
 * Credit accounting + quota enforcement.
 *
 * Two realities, handled explicitly:
 *  - Supabase configured (production): real per-user balances, atomic spend via
 *    the consume_credits RPC, lazy monthly reset, append-only ledger.
 *  - Not configured (local/dev, placeholder keys): there is no user system, so
 *    scans are allowed and this module is a no-op. We never block a dev scan
 *    because billing isn't wired — but we also never pretend a charge happened.
 *
 * Anonymous visitors (no account) get a small free-quick-check trial, tracked
 * per device+IP in memory (per server instance) — enough to gate the funnel.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/persistence';
import {
  ScanDepth,
  creditCost,
  planAllowsDepth,
  getPlan,
  FREE_RESCAN_WINDOW_MS,
  ANON_FREE_QUICK_CHECKS,
} from '@/lib/plans';

export interface QuotaCheck {
  ok: boolean;
  reason?: string;
  /** 'upgrade' → needs a paid plan for this depth; 'credits' → out of credits; 'signin' → anon limit reached. */
  code?: 'upgrade' | 'credits' | 'signin';
  balance?: number;
  cost: number;
  freeRescan: boolean;
}

export function creditsEnabled(): boolean {
  return isSupabaseConfigured();
}

// ── Anonymous trial (per-instance memory) ────────────────────────────────────

const globalForAnon = globalThis as unknown as { __vssAnon?: Map<string, number> };
const anonUsage: Map<string, number> =
  globalForAnon.__vssAnon ?? (globalForAnon.__vssAnon = new Map());

export function anonKey(deviceId: string, ip: string): string {
  return `${deviceId || 'nodev'}|${ip || 'noip'}`;
}

// ── Free re-scan tracking (per-instance memory) ──────────────────────────────

const globalForRescan = globalThis as unknown as { __vssRescan?: Map<string, number> };
const recentScans: Map<string, number> =
  globalForRescan.__vssRescan ?? (globalForRescan.__vssRescan = new Map());

function rescanKey(subject: string, url: string): string {
  return `${subject}|${url}`;
}

function isFreeRescan(subject: string, url: string): boolean {
  const last = recentScans.get(rescanKey(subject, url));
  return last != null && Date.now() - last < FREE_RESCAN_WINDOW_MS;
}

function markScanned(subject: string, url: string) {
  recentScans.set(rescanKey(subject, url), Date.now());
}

// ── Monthly reset (lazy) ─────────────────────────────────────────────────────

async function ensureMonthlyReset(userId: string, profile: any): Promise<any> {
  const periodStart = profile.period_start ? new Date(profile.period_start).getTime() : 0;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - periodStart < THIRTY_DAYS) return profile;

  const plan = getPlan(profile.plan);
  await supabaseAdmin.rpc('grant_credits', {
    p_user: userId,
    p_amount: plan.monthlyCredits,
    p_reason: 'monthly_reset',
    p_meta: { plan: plan.id },
  });
  await supabaseAdmin
    .from('profiles')
    .update({ period_start: new Date().toISOString() })
    .eq('id', userId);
  return { ...profile, period_start: new Date().toISOString() };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Decide whether a scan may run. Does NOT consume — call consumeForScan after
 * the check passes and the scan actually starts.
 */
export async function checkQuota(params: {
  userId: string | null;
  deviceId: string;
  ip: string;
  depth: ScanDepth;
  url: string;
}): Promise<QuotaCheck> {
  const { userId, deviceId, ip, depth, url } = params;
  const cost = creditCost(depth);

  // Dev / no billing configured → allow everything.
  if (!creditsEnabled()) {
    return { ok: true, cost, freeRescan: false };
  }

  // Anonymous: only quick checks, limited count, no credits system.
  if (!userId) {
    if (depth !== 'quick') {
      return { ok: false, code: 'signin', reason: 'Sign in to run deeper scans.', cost, freeRescan: false };
    }
    const key = anonKey(deviceId, ip);
    const used = anonUsage.get(key) ?? 0;
    if (used >= ANON_FREE_QUICK_CHECKS) {
      return {
        ok: false,
        code: 'signin',
        reason: `You've used your ${ANON_FREE_QUICK_CHECKS} free checks. Sign in to keep scanning.`,
        cost,
        freeRescan: false,
      };
    }
    return { ok: true, cost, freeRescan: false };
  }

  // Authenticated: plan + balance.
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  if (!profile) {
    return { ok: false, code: 'signin', reason: 'Account not found.', cost, freeRescan: false };
  }
  if (!planAllowsDepth(profile.plan, depth)) {
    return {
      ok: false,
      code: 'upgrade',
      reason: `${getPlan(profile.plan).name} doesn't include ${depth} scans. Upgrade to unlock them.`,
      cost,
      freeRescan: false,
    };
  }

  const fresh = await ensureMonthlyReset(userId, profile);
  const freeRescan = isFreeRescan(userId, url);
  const effectiveCost = freeRescan ? 0 : cost;

  if ((fresh.credits_balance ?? 0) < effectiveCost) {
    return {
      ok: false,
      code: 'credits',
      reason: 'Out of credits. Top up or upgrade to keep scanning.',
      balance: fresh.credits_balance ?? 0,
      cost: effectiveCost,
      freeRescan,
    };
  }

  return { ok: true, balance: fresh.credits_balance ?? 0, cost: effectiveCost, freeRescan };
}

/**
 * Consume credits for a scan that is actually starting. Idempotent-ish: relies
 * on the atomic RPC. Returns the new balance (or null in dev / free-rescan).
 */
export async function consumeForScan(params: {
  userId: string | null;
  deviceId: string;
  ip: string;
  depth: ScanDepth;
  url: string;
  scanId: string;
}): Promise<{ charged: number; balance: number | null; freeRescan: boolean }> {
  const { userId, deviceId, ip, depth, url, scanId } = params;

  if (!creditsEnabled()) {
    markScanned(userId || anonKey(deviceId, ip), url);
    return { charged: 0, balance: null, freeRescan: false };
  }

  if (!userId) {
    // Anonymous quick check — increment trial counter, no credits.
    const key = anonKey(deviceId, ip);
    anonUsage.set(key, (anonUsage.get(key) ?? 0) + 1);
    markScanned(key, url);
    return { charged: 0, balance: null, freeRescan: false };
  }

  const freeRescan = isFreeRescan(userId, url);
  markScanned(userId, url);
  if (freeRescan) {
    return { charged: 0, balance: null, freeRescan: true };
  }

  const cost = creditCost(depth);
  const { data: newBalance } = await supabaseAdmin.rpc('consume_credits', {
    p_user: userId,
    p_amount: cost,
    p_reason: 'scan',
    p_meta: { url, depth, scan_id: scanId },
  });

  return { charged: cost, balance: typeof newBalance === 'number' ? newBalance : null, freeRescan: false };
}

export async function getBalance(userId: string): Promise<number | null> {
  if (!creditsEnabled()) return null;
  const { data } = await supabaseAdmin.from('profiles').select('credits_balance').eq('id', userId).single();
  return data?.credits_balance ?? null;
}
