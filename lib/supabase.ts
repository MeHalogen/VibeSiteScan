import { createClient } from '@supabase/supabase-js';

// Fall back to harmless placeholders so `createClient` never throws at import
// time when env vars are absent (build/CI). Real persistence is gated behind
// isSupabaseConfigured() in lib/persistence.ts, which rejects these placeholders.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

// Browser client for client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for API routes (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
