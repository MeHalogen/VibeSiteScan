import { NextResponse } from 'next/server';
import { isRazorpayConfigured, cancelSubscription } from '@/lib/razorpay';
import { getUserFromRequest } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Cancel the signed-in user's subscription at the end of the current cycle.
 * The subscription.cancelled/halted webhook flips them back to the free plan;
 * we don't downgrade optimistically so they keep paid access until the cycle ends.
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Sign in first.', code: 'signin' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('razorpay_subscription_id, plan')
    .eq('id', user.id)
    .maybeSingle();

  const subId = profile?.razorpay_subscription_id;
  if (!subId) {
    return NextResponse.json(
      { success: false, error: 'No active subscription to cancel.' },
      { status: 400 }
    );
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Billing is not configured.' },
      { status: 503 }
    );
  }

  try {
    await cancelSubscription(subId, true);
    return NextResponse.json({
      success: true,
      message: 'Your plan will end at the close of the current billing cycle.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 });
  }
}
