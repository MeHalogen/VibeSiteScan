'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase, isAuthAvailable } from '@/lib/supabase-browser';

type Mode = 'magic' | 'password';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [linkError, setLinkError] = useState('');
  const authOn = isAuthAvailable();
  // Show the Google button only once you've enabled Google in Supabase and set
  // NEXT_PUBLIC_GOOGLE_AUTH=true — otherwise clicking it hits a raw provider error.
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === 'true';

  // Surface an expired/invalid magic-link error. It can arrive either as a
  // ?authError query (routed here by AuthLanding) or directly as a #error hash.
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
    window.history.replaceState({}, '', '/login');
  }, []);

  function nextPath(): string {
    if (typeof window === 'undefined') return '/dashboard';
    const n = new URLSearchParams(window.location.search).get('next');
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

  function friendly(err: { message?: string; status?: number }): string {
    const raw = (err.message || '').toLowerCase();
    if (raw.includes('rate limit') || raw.includes('too many') || err.status === 429) {
      return 'Too many sign-in emails for now. Wait a minute and try once more — or set up custom SMTP in Supabase (see FLOW.md).';
    }
    if (raw.includes('invalid login credentials')) return 'Wrong email or password.';
    if (raw.includes('already registered')) return 'That email already has an account — use "Sign in" instead.';
    return err.message || 'Something went wrong.';
  }

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
      setMessage(friendly(error));
    } else {
      setStatus('sent');
    }
  }

  async function passwordSignIn(e: React.FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) return;
    setStatus('sending');
    setMessage('');
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setStatus('error');
      setMessage(friendly(error));
    } else {
      window.location.href = nextPath();
    }
  }

  async function passwordSignUp() {
    const sb = getBrowserSupabase();
    if (!sb) return;
    if (password.length < 6) {
      setStatus('error');
      setMessage('Choose a password of at least 6 characters.');
      return;
    }
    setStatus('sending');
    setMessage('');
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) {
      setStatus('error');
      setMessage(friendly(error));
    } else if (data.session) {
      // Email confirmation is off → signed in immediately.
      window.location.href = nextPath();
    } else {
      // Confirmation on → a confirm email was sent.
      setStatus('sent');
    }
  }

  async function signInWithGoogle() {
    const sb = getBrowserSupabase();
    if (!sb) return;
    setStatus('sending');
    setMessage('');
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${nextPath()}` },
    });
    // On success the browser navigates to Google; on error we stay put.
    if (error) {
      setStatus('error');
      setMessage(
        (error.message || '').toLowerCase().includes('provider is not enabled')
          ? 'Google sign-in isn’t enabled yet. Turn it on in Supabase → Authentication → Providers → Google.'
          : friendly(error)
      );
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-black/40 border border-white/15 text-white placeholder-white/30 font-mono text-sm focus:outline-none focus:border-emerald-500/60';
  const primaryBtn =
    'w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-mono text-xs uppercase tracking-widest rounded-lg transition-colors';

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
              {mode === 'magic'
                ? "We'll email you a magic link — no password to remember."
                : 'Use your email and a password.'}
            </p>
          </div>

          {linkError && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 mb-4 text-center">
              <p className="text-sm text-amber-300">{linkError}</p>
            </div>
          )}

          {!authOn ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
              <p className="text-sm text-amber-300/90 font-mono">Sign-in isn&apos;t configured yet.</p>
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
                We sent an email to <span className="text-emerald-400">{email}</span>. Open it on
                this device to continue.
              </p>
            </div>
          ) : (
          <>
            {googleEnabled && (
              <>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={status === 'sending'}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-4 rounded-lg bg-white hover:bg-white/90 disabled:opacity-60 text-[#1f1f1f] text-sm font-medium transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">or</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              </>
            )}

            {mode === 'magic' ? (
            <form onSubmit={sendLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
              <button type="submit" disabled={status === 'sending'} className={primaryBtn}>
                {status === 'sending' ? 'Sending…' : 'Email me a magic link'}
              </button>
              {status === 'error' && <p className="text-xs text-red-400 font-mono text-center">{message}</p>}
              <p className="text-center text-xs text-white/40 pt-1">
                <button type="button" onClick={() => { setMode('password'); setStatus('idle'); setMessage(''); }} className="text-emerald-400/80 hover:text-emerald-300 underline">
                  Use a password instead
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={passwordSignIn} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={inputClass}
              />
              <button type="submit" disabled={status === 'sending'} className={primaryBtn}>
                {status === 'sending' ? 'Signing in…' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={passwordSignUp}
                disabled={status === 'sending'}
                className="w-full px-4 py-3 border border-white/15 hover:bg-white/5 disabled:opacity-60 text-white/85 font-mono text-xs uppercase tracking-widest rounded-lg transition-colors"
              >
                Create account
              </button>
              {status === 'error' && <p className="text-xs text-red-400 font-mono text-center">{message}</p>}
              <p className="text-center text-xs text-white/40 pt-1">
                <button type="button" onClick={() => { setMode('magic'); setStatus('idle'); setMessage(''); }} className="text-emerald-400/80 hover:text-emerald-300 underline">
                  Email me a magic link instead
                </button>
              </p>
            </form>
            )}
          </>
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
