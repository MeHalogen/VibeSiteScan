'use client';

/**
 * Client-side Razorpay Checkout. Loads the official checkout.js on demand,
 * asks our API to create the subscription/order (billed to the signed-in user
 * via the Bearer token), then opens the payment modal. Credits are granted by
 * the server webhook after payment — never trusted from the client.
 */

import { getAccessToken } from '@/lib/supabase-browser';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let scriptPromise: Promise<boolean> | null = null;

function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export interface CheckoutResult {
  ok: boolean;
  error?: string;
  code?: string;
}

async function authedPost(path: string, body: Record<string, unknown>) {
  const token = await getAccessToken();
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/** Start a subscription checkout for a monthly plan (pro | studio). */
export async function startSubscriptionCheckout(
  planId: 'pro' | 'studio',
  email?: string,
  onSuccess?: () => void
): Promise<CheckoutResult> {
  const { res, data } = await authedPost('/api/billing/create-subscription', { planId });
  if (!res.ok) return { ok: false, error: data?.error, code: data?.code };

  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) return { ok: false, error: 'Could not load the payment window.' };

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: data.keyId,
      subscription_id: data.subscription.id,
      name: 'VibeSiteScan',
      description: `${data.plan.name} — ${data.plan.monthlyCredits} credits / month`,
      prefill: email ? { email } : undefined,
      theme: { color: '#10b981' },
      handler: () => {
        onSuccess?.();
        resolve({ ok: true });
      },
      modal: { ondismiss: () => resolve({ ok: false, error: 'Checkout cancelled.' }) },
    });
    rzp.open();
  });
}

/** Start a one-time credit top-up checkout. */
export async function startTopupCheckout(
  packId: string,
  email?: string,
  onSuccess?: () => void
): Promise<CheckoutResult> {
  const { res, data } = await authedPost('/api/billing/create-order', { packId });
  if (!res.ok) return { ok: false, error: data?.error, code: data?.code };

  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) return { ok: false, error: 'Could not load the payment window.' };

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.order.id,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'VibeSiteScan',
      description: `${data.pack.credits} credits`,
      prefill: email ? { email } : undefined,
      theme: { color: '#10b981' },
      handler: () => {
        onSuccess?.();
        resolve({ ok: true });
      },
      modal: { ondismiss: () => resolve({ ok: false, error: 'Checkout cancelled.' }) },
    });
    rzp.open();
  });
}
