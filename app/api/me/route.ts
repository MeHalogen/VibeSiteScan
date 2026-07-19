import { NextResponse } from 'next/server';
import { getUserFromRequest, ensureProfile } from '@/lib/auth-server';
import { getBalance } from '@/lib/credits';
import { supabaseAdmin } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/persistence';
import { getPlan } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/** Account snapshot for the dashboard: plan, credit balance, email. */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ authed: false, configured: isSupabaseConfigured() });
  }

  await ensureProfile(user);

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, credits_balance')
    .eq('id', user.id)
    .maybeSingle();

  const planId = profile?.plan || 'free';
  const balance = (await getBalance(user.id)) ?? profile?.credits_balance ?? 0;

  return NextResponse.json({
    authed: true,
    configured: true,
    email: user.email,
    plan: getPlan(planId),
    balance,
  });
}
