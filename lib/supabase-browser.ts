'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client for auth (email magic-link / OTP).
 *
 * We keep auth entirely client-side and pass the access token as a Bearer
 * header to our API routes (validated server-side with the service-role
 * client). This avoids SSR cookie plumbing and works with the existing
 * fetch-based scan flow. Session is persisted in localStorage by supabase-js.
 */
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Auth is unavailable until real credentials are set (placeholders are rejected).
  if (!url || !anon || url.includes('placeholder')) return null;
  if (client) return client;
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function isAuthAvailable(): boolean {
  return getBrowserSupabase() !== null;
}

/** Current access token, or null if signed out / auth unavailable. */
export async function getAccessToken(): Promise<string | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}
