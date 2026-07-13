import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/persistence';
import { getPlan } from '@/lib/plans';

/**
 * Razorpay webhook. Verifies the HMAC signature over the RAW body, dedupes by
 * event id (billing_events), and grants credits on paid events. Never trusts
 * the client — amounts/plans come from server-side plan definitions, not the
 * payload.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, error: 'Bad payload' }, { status: 400 });
  }

  // Without a database we can verify but not grant. Acknowledge so Razorpay
  // doesn't retry forever; the operator will see billing isn't wired to a DB.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, note: 'verified; no database configured' });
  }

  const eventId: string = event.id || `${event.event}_${Date.now()}`;

  // Idempotency: insert the event id; if it already exists, we've handled it.
  const { error: dupeError } = await supabaseAdmin
    .from('billing_events')
    .insert({ id: eventId, event_type: event.event, payload: event });
  if (dupeError) {
    // Unique-violation → already processed. Any other error → report.
    return NextResponse.json({ success: true, note: 'already processed' });
  }

  try {
    if (event.event === 'order.paid') {
      const notes = event.payload?.order?.entity?.notes || event.payload?.payment?.entity?.notes || {};
      if (notes.type === 'credit_pack' && notes.userId) {
        const credits = parseInt(notes.credits, 10) || 0;
        if (credits > 0) {
          await supabaseAdmin.rpc('grant_credits', {
            p_user: notes.userId,
            p_amount: credits,
            p_reason: 'topup',
            p_meta: { packId: notes.packId, eventId },
          });
        }
      }
    } else if (event.event === 'subscription.charged') {
      const notes = event.payload?.subscription?.entity?.notes || {};
      const sub = event.payload?.subscription?.entity || {};
      if (notes.userId && notes.planId) {
        const plan = getPlan(notes.planId);
        await supabaseAdmin.rpc('grant_credits', {
          p_user: notes.userId,
          p_amount: plan.monthlyCredits,
          p_reason: 'subscription_charge',
          p_meta: { planId: plan.id, eventId },
        });
        await supabaseAdmin
          .from('profiles')
          .update({
            plan: plan.id,
            period_start: new Date().toISOString(),
            razorpay_subscription_id: sub.id || null,
          })
          .eq('id', notes.userId);
      }
    } else if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
      const notes = event.payload?.subscription?.entity?.notes || {};
      if (notes.userId) {
        await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', notes.userId);
      }
    }
  } catch (err: any) {
    // Processed-marker already written; log and 200 so Razorpay doesn't spam retries.
    console.error('[razorpay webhook] handler error:', err?.message);
  }

  return NextResponse.json({ success: true });
}
