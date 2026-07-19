/**
 * Server-side auth: turn an incoming Bearer token into a user id, and make sure
 * that user has a profile row (plan + credits) the billing/credits code expects.
 *
 * The token is a Supabase access JWT sent by the browser client. We validate it
 * with the service-role admin client. No cookies, no middleware — just a header.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/persistence';
import { PLANS } from '@/lib/plans';

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Read + validate the Bearer token from a request. Null when signed out. */
export async function getUserFromRequest(request: Request): Promise<AuthedUser | null> {
  if (!isSupabaseConfigured()) return null;
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

/**
 * Ensure a profile row exists for a freshly-signed-in user, seeded with the
 * free plan's monthly credits. Idempotent — only inserts when missing.
 */
export async function ensureProfile(user: AuthedUser): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (existing) return;

    await supabaseAdmin.from('profiles').insert({
      id: user.id,
      plan: 'free',
      credits_balance: PLANS.free.monthlyCredits,
      period_start: new Date().toISOString(),
    });
  } catch {
    // A race (row created concurrently) is fine — the unique PK protects us.
  }
}
