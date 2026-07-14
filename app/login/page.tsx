'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase, isAuthAvailable } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [linkError, setLinkError] = useState('');
  const authOn = isAuthAvailable();

  // Surface an expired/invalid magic-link error. It can arrive either as a
  // ?authError query (routed here by AuthLanding) or directly as a #error hash
  // (if Supabase's Site URL points at /login). Handle both.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('authError');
    const h = window.location.hash.includes('error=')
      ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_code')
      : null;
    const code = q || h;
    if (!code) return;
    setLinkError(
      code === 'otp_expired'
        ? 'That sign-in link expired or was already used. Enter your email below to get a fresh one.'
        : 'That sign-in link was invalid. Enter your email below to get a new one.'
    );
    // Clean the URL so a refresh doesn't keep showing it.
    window.history.replaceState({}, '', '/login');
  }, []);

  // Where to land after sign-in (?next=/pricing?upgrade=pro), default dashboard.
  function nextPath(): string {
    if (typeof window === 'undefined') return '/dashboard';
    const n = new URLSearchParams(window.location.search).get('next');
    // Only allow same-origin relative paths.
    return n && n.startsWith('/') ? n : '/dashboard';
  }

  // If already signed in, bounce onward.
  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = nextPath();
    });
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) return;
    setStatus('sending');
    setMessage('');
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${nextPath()}` },
    });
    if (error) {
      setStatus('error');
      const raw = (error.message || '').toLowerCase();
      if (raw.includes('rate limit') || raw.includes('too many') || (error as any).status === 429) {
        setMessage(
          'Too many sign-in emails for now. Wait a minute and try once more — or, if this keeps happening, the email limit was reached (set up custom SMTP in Supabase for production).'
        );
      } else {
        setMessage(error.message);
      }
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-cream scanline-overlay bg-coord-grid-dark flex flex-col">
      <header className="border-b border-white/10 bg-black/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between w-full">
          <Link href="/" className="font-mono text-sm font-semibold tracking-widest uppercase text-white/85">
            VibeSiteScan
          </Link>
          <Link href="/pricing" className="font-mono text-xs uppercase tracking-widest text-white/60 hover:text-white">
            Pricing
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <span className="text-emerald-400 text-xl">✓</span>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Sign in to VibeSiteScan</h1>
            <p className="text-sm text-white/55">
              We&apos;ll email you a magic link — no password to remember.
            </p>
          </div>

          {linkError && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 mb-4 text-center">
              <p className="text-sm text-amber-300">{linkError}</p>
            </div>
          )}

          {!authOn ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
              <p className="text-sm text-amber-300/90 font-mono">
                Sign-in isn&apos;t configured yet.
              </p>
              <p className="text-xs text-white/50 mt-2">
                Add your Supabase keys (see SETUP.md) to enable accounts. You can still run free
                scans without signing in.
              </p>
              <Link
                href="/dashboard/new-scan-pipeline"
                className="inline-block mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-widest rounded"
              >
                Run a free scan
              </Link>
            </div>
          ) : status === 'sent' ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
              <div className="text-3xl mb-3">📨</div>
              <p className="text-sm text-white font-medium mb-1">Check your inbox</p>
              <p className="text-xs text-white/55">
                We sent a sign-in link to <span className="text-emerald-400">{email}</span>. Open it
                on this device to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={sendLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/15 text-white placeholder-white/30 font-mono text-sm focus:outline-none focus:border-emerald-500/60"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-mono text-xs uppercase tracking-widest rounded-lg transition-colors"
              >
                {status === 'sending' ? 'Sending…' : 'Email me a magic link'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-400 font-mono text-center">{message}</p>
              )}
            </form>
          )}

          <p className="text-center text-xs text-white/35 mt-6">
            No account needed to run a free scan.{' '}
            <Link href="/dashboard/new-scan-pipeline" className="text-white/60 hover:text-white underline">
              Skip
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
