'use client';

import { useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';

/**
 * Global handler for what Supabase puts in the URL hash after an email link.
 *
 * - Expired / invalid link → Supabase returns `#error=access_denied&error_code=
 *   otp_expired&...`. We surface that clearly by routing to /login with a message
 *   instead of leaving the user on a page that silently ignores it.
 * - Valid link that happens to land somewhere other than the dashboard → make
 *   sure the browser client consumes the `#access_token` (detectSessionInUrl),
 *   then send them to the dashboard.
 *
 * Mounted once in the root layout so it works no matter which page the link
 * redirects to. Inert when there's no auth hash.
 */
export function AuthLanding() {
  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash || hash.length < 2) return;

    if (hash.includes('error=')) {
      const p = new URLSearchParams(hash.replace(/^#/, ''));
      const code = p.get('error_code') || p.get('error') || 'auth_error';
      // Strip the ugly hash, then show a friendly message on /login.
      window.history.replaceState({}, '', window.location.pathname);
      window.location.replace(`/login?authError=${encodeURIComponent(code)}`);
      return;
    }

    if (hash.includes('access_token=')) {
      const sb = getBrowserSupabase(); // creating the client consumes the token
      const path = window.location.pathname;
      if (sb && !path.startsWith('/dashboard') && !path.startsWith('/login')) {
        // Give detectSessionInUrl a tick to store the session, then continue.
        sb.auth.getSession().finally(() => window.location.replace('/dashboard'));
      }
    }
  }, []);

  return null;
}
