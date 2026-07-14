'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBrowserSupabase, getAccessToken, isAuthAvailable } from '@/lib/supabase-browser';
import { startSubscriptionCheckout, startTopupCheckout } from '@/lib/razorpay-checkout';

interface Me {
  authed: boolean;
  configured: boolean;
  email?: string;
  plan?: { id: string; name: string };
  balance?: number;
}

export function AccountBar() {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const authOn = isAuthAvailable();

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMe(await res.json());
    } catch {
      setMe({ authed: false, configured: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle ?upgrade=plan / ?topup=pack handed off from the pricing page.
  useEffect(() => {
    if (!me) return;
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    const topup = params.get('topup');
    if (!upgrade && !topup) return;

    // Clear the query so a refresh doesn't re-trigger checkout.
    window.history.replaceState({}, '', window.location.pathname);

    if (!me.authed) {
      window.location.href = `/login`;
      return;
    }
    if (upgrade === 'pro' || upgrade === 'studio') void doUpgrade(upgrade);
    else if (topup) void doTopup(topup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  async function doUpgrade(planId: 'pro' | 'studio') {
    setBusy(true);
    setNotice('');
    const r = await startSubscriptionCheckout(planId, me?.email, refresh);
    setBusy(false);
    if (!r.ok && r.error) setNotice(r.error);
    else if (r.ok) setNotice('Payment successful — credits will appear shortly.');
  }

  async function doTopup(packId: string) {
    setBusy(true);
    setNotice('');
    const r = await startTopupCheckout(packId, me?.email, refresh);
    setBusy(false);
    if (!r.ok && r.error) setNotice(r.error);
    else if (r.ok) setNotice('Payment successful — credits will appear shortly.');
  }

  async function signOut() {
    const sb = getBrowserSupabase();
    await sb?.auth.signOut();
    await refresh();
  }

  async function cancelPlan() {
    if (!window.confirm('Cancel your plan? You keep access until the end of the current billing cycle.')) return;
    setBusy(true);
    setNotice('');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNotice(data.success ? data.message : data.error || 'Could not cancel.');
    } catch {
      setNotice('Could not cancel right now.');
    } finally {
      setBusy(false);
    }
  }

  // Auth not configured → keep the dashboard clean, no account chrome.
  if (!authOn || (me && !me.configured)) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      {me?.authed ? (
        <>
          <div className="flex items-center gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Credits</div>
              <div className="font-mono text-2xl font-bold text-emerald-400 leading-none">
                {me.balance ?? 0}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Plan</div>
              <div className="font-mono text-sm text-white">{me.plan?.name ?? 'Free'}</div>
            </div>
            <div className="hidden sm:block text-xs text-white/40 font-mono">{me.email}</div>
          </div>
          <div className="flex items-center gap-2">
            {me.plan?.id !== 'studio' && (
              <button
                onClick={() => doUpgrade(me.plan?.id === 'pro' ? 'studio' : 'pro')}
                disabled={busy}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-[11px] uppercase tracking-widest rounded"
              >
                {busy ? '…' : me.plan?.id === 'pro' ? 'Upgrade to Studio' : 'Upgrade'}
              </button>
            )}
            <button
              onClick={() => doTopup('pack_150')}
              disabled={busy}
              className="px-4 py-2 border border-white/15 hover:bg-white/5 disabled:opacity-50 text-white/85 font-mono text-[11px] uppercase tracking-widest rounded"
            >
              Buy credits
            </button>
            {me.plan?.id && me.plan.id !== 'free' && (
              <button
                onClick={cancelPlan}
                disabled={busy}
                className="px-3 py-2 text-white/45 hover:text-red-400 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50"
              >
                Cancel plan
              </button>
            )}
            <button
              onClick={signOut}
              className="px-3 py-2 text-white/45 hover:text-white font-mono text-[11px] uppercase tracking-widest"
            >
              Sign out
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm text-white/60">
            Running as a guest — sign in to save scans and manage credits.
          </div>
          <Link
            href="/login"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] uppercase tracking-widest rounded"
          >
            Sign in
          </Link>
        </>
      )}
      {notice && (
        <div className="w-full text-xs font-mono text-emerald-400/80 pt-1">{notice}</div>
      )}
    </div>
  );
}
