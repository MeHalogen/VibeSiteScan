'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/supabase-browser';
import { startSubscriptionCheckout, startTopupCheckout } from '@/lib/razorpay-checkout';

interface Me {
  authed: boolean;
  email?: string;
  plan?: { id: string };
}

async function fetchMe(): Promise<Me> {
  try {
    const token = await getAccessToken();
    const res = await fetch('/api/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return await res.json();
  } catch {
    return { authed: false };
  }
}

/** Send a guest to sign in, returning to the pricing action afterwards. */
function goSignIn(resume: string) {
  window.location.href = `/login?next=${encodeURIComponent('/pricing?' + resume)}`;
}

export function PlanCta({
  planId,
  label,
  popular,
}: {
  planId: 'pro' | 'studio';
  label: string;
  popular?: boolean;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  async function run() {
    setBusy(true);
    setMsg('');
    const r = await startSubscriptionCheckout(planId, me?.email, () => {
      window.location.href = '/dashboard';
    });
    setBusy(false);
    if (!r.ok && r.error) setMsg(r.error);
  }

  // Auto-resume after returning from sign-in (?upgrade=plan).
  useEffect(() => {
    if (!me?.authed) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === planId) {
      window.history.replaceState({}, '', '/pricing');
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const onClick = () => {
    if (!me) return;
    if (!me.authed) return goSignIn(`upgrade=${planId}`);
    void run();
  };

  const isCurrent = me?.plan?.id === planId;

  return (
    <div>
      <button
        onClick={onClick}
        disabled={busy || isCurrent}
        className={`block w-full text-center px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-60 ${
          popular
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'border border-white/15 text-white/85 hover:bg-white/5'
        }`}
      >
        {isCurrent ? 'Current plan' : busy ? 'Opening…' : label}
      </button>
      {msg && <p className="mt-2 text-[11px] text-amber-400/80 font-mono text-center">{msg}</p>}
    </div>
  );
}

export function PackCta({ packId, label }: { packId: string; label: string }) {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  async function run() {
    setBusy(true);
    setMsg('');
    const r = await startTopupCheckout(packId, me?.email, () => {
      window.location.href = '/dashboard';
    });
    setBusy(false);
    if (!r.ok && r.error) setMsg(r.error);
  }

  useEffect(() => {
    if (!me?.authed) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('topup') === packId) {
      window.history.replaceState({}, '', '/pricing');
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const onClick = () => {
    if (!me) return;
    if (!me.authed) return goSignIn(`topup=${packId}`);
    void run();
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={busy}
        className="block w-full text-center px-4 py-2 rounded-lg border border-white/15 text-white/85 hover:bg-white/5 font-mono text-[11px] uppercase tracking-widest disabled:opacity-60"
      >
        {busy ? 'Opening…' : label}
      </button>
      {msg && <p className="mt-2 text-[10px] text-amber-400/80 font-mono text-center">{msg}</p>}
    </div>
  );
}
