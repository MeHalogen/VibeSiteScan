/**
 * Razorpay integration helpers (REST API, no SDK dependency).
 *
 * Keys live in the user's environment — the assistant never handles them:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 *   RAZORPAY_PLAN_STARTER, RAZORPAY_PLAN_AGENCY  (subscription plan ids)
 *
 * Until real keys are set, isRazorpayConfigured() is false and the billing
 * routes return a clear "not configured" response instead of pretending.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID || '';
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function rzp(path: string, body: Record<string, any>): Promise<any> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || `Razorpay error (${res.status})`);
  }
  return data;
}

/** Create a one-time order (credit top-up pack). Amount in paise. */
export async function createOrder(amountInr: number, notes: Record<string, string>) {
  return rzp('/orders', {
    amount: amountInr * 100, // paise
    currency: 'INR',
    notes,
  });
}

/** Create a subscription against a Razorpay plan id. */
export async function createSubscription(planId: string, notes: Record<string, string>) {
  return rzp('/subscriptions', {
    plan_id: planId,
    total_count: 12, // 12 monthly cycles; Razorpay auto-renews per plan config
    customer_notify: 1,
    notes,
  });
}

/**
 * Verify a Razorpay webhook signature (HMAC-SHA256 of the raw body with the
 * webhook secret). Constant-time compare.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
