'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase, isAuthAvailable } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const authOn = isAuthAvailable();

  // If already signed in, bounce to the dashboard.
  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = '/dashboard';
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
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
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
            <span className="classified-stamp text-[9px] text-white/45">Account access</span>
            <h1 className="text-2xl font-bold text-white mt-4 mb-2">Sign in to VibeSiteScan</h1>
            <p className="text-sm text-white/55">
              We&apos;ll email you a magic link — no password to remember.
            </p>
          </div>

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
