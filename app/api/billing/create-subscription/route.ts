import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isRazorpayConfigured, createSubscription } from '@/lib/razorpay';
import { getPlan } from '@/lib/plans';
import { getUserFromRequest, ensureProfile } from '@/lib/auth-server';

const schema = z.object({ planId: z.enum(['pro', 'studio']) });

/** Create a Razorpay subscription for a monthly plan. */
export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Billing is not configured yet. Add Razorpay keys to enable subscriptions.' },
      { status: 503 }
    );
  }

  // Bill to the signed-in account — userId is taken from the token, never the body.
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Sign in to upgrade.', code: 'signin' }, { status: 401 });
  }
  await ensureProfile(user);
  const userId = user.id;

  let planId: 'pro' | 'studio';
  try {
    ({ planId } = schema.parse(await request.json()));
  } catch {
    return NextResponse.json({ success: false, error: 'planId required' }, { status: 400 });
  }

  const plan = getPlan(planId);
  const razorpayPlanId = plan.razorpayPlanEnv ? process.env[plan.razorpayPlanEnv] : undefined;
  if (!razorpayPlanId) {
    return NextResponse.json(
      { success: false, error: `Razorpay plan id not set (${plan.razorpayPlanEnv}).` },
      { status: 503 }
    );
  }

  try {
    const subscription = await createSubscription(razorpayPlanId, {
      type: 'subscription',
      planId: plan.id,
      credits: String(plan.monthlyCredits),
      userId: userId || '',
    });
    return NextResponse.json({
      success: true,
      subscription,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 });
  }
}
