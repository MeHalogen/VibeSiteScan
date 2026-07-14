'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAccessToken, isAuthAvailable } from '@/lib/supabase-browser';

interface Me {
  authed: boolean;
  email?: string;
  balance?: number;
  plan?: { name?: string };
}

/**
 * Compact account chip for page navs. Shows "Dashboard / Sign in" for guests,
 * or a greeting + remaining credits + Dashboard link when signed in.
 */
export function NavAccount() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthAvailable()) {
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setMe(await res.json());
      } catch {
        setMe({ authed: false });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Until we know, render the neutral guest link so nothing flickers to "signed in".
  if (!loaded || !me?.authed) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-3 py-2 font-mono text-xs tracking-wide rounded transition-colors border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
      >
        Dashboard / Sign in
      </Link>
    );
  }

  const name = (me.email || '').split('@')[0];
  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline font-mono text-xs text-white/60">
        Hey <span className="text-white/85">{name}</span>
      </span>
      <span className="font-mono text-xs text-emerald-400/90">
        {me.balance ?? 0} <span className="text-white/40">credits</span>
      </span>
      <Link
        href="/dashboard"
        className="inline-flex items-center px-3 py-2 font-mono text-xs tracking-wide rounded transition-colors border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      >
        Dashboard
      </Link>
    </div>
  );
}
