-- VibeSiteScan — COMBINED database setup (migrations 001–005, in order).
-- Paste this whole file into the Supabase SQL Editor and click RUN, ONCE,
-- on a fresh project. Safe/idempotent for the ADD COLUMN / GRANT parts.
-- If you re-run and hit 'policy already exists', you've already set it up —
-- that error is harmless.


-- =============================================================
-- 001_init.sql
-- =============================================================
-- LaunchScan Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  website TEXT,
  plan TEXT DEFAULT 'free',
  monthly_scan_limit INTEGER DEFAULT 3,
  scans_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  scan_depth TEXT DEFAULT 'quick',
  status TEXT DEFAULT 'queued',
  launch_score INTEGER,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  pages_scanned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  share_token TEXT UNIQUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan pages table
CREATE TABLE IF NOT EXISTS scan_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  title TEXT,
  meta_description TEXT,
  h1_count INTEGER DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  has_canonical BOOLEAN DEFAULT FALSE,
  has_og_title BOOLEAN DEFAULT FALSE,
  has_og_description BOOLEAN DEFAULT FALSE,
  has_og_image BOOLEAN DEFAULT FALSE,
  has_twitter_card BOOLEAN DEFAULT FALSE,
  has_favicon BOOLEAN DEFAULT FALSE,
  has_viewport BOOLEAN DEFAULT FALSE,
  robots_noindex BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan issues table
CREATE TABLE IF NOT EXISTS scan_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  page_id UUID REFERENCES scan_pages(id) ON DELETE SET NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fix_suggestion TEXT,
  evidence TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan links table
CREATE TABLE IF NOT EXISTS scan_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  source_url TEXT,
  target_url TEXT,
  link_type TEXT,
  status_code INTEGER,
  is_broken BOOLEAN DEFAULT FALSE,
  is_redirect BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Console events table
CREATE TABLE IF NOT EXISTS console_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  page_url TEXT,
  event_type TEXT,
  message TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form checks table
CREATE TABLE IF NOT EXISTS form_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  page_url TEXT,
  form_index INTEGER,
  has_action BOOLEAN,
  method TEXT,
  input_count INTEGER,
  missing_label_count INTEGER,
  required_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_share_token ON scans(share_token);
CREATE INDEX IF NOT EXISTS idx_scan_pages_scan_id ON scan_pages(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_issues_scan_id ON scan_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_links_scan_id ON scan_links(scan_id);
CREATE INDEX IF NOT EXISTS idx_console_events_scan_id ON console_events(scan_id);

-- RLS Policies (examples - adjust based on your auth setup)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own scans
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can create scans" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own scan data
CREATE POLICY "Users can view own scan pages" ON scan_pages
  FOR SELECT USING (scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own scan issues" ON scan_issues
  FOR SELECT USING (scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own scan links" ON scan_links
  FOR SELECT USING (scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid()));

-- Public share token access (anyone can read scans with valid share_token)
CREATE POLICY "Public can view shared scans" ON scans
  FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Public can view shared scan issues" ON scan_issues
  FOR SELECT USING (scan_id IN (SELECT id FROM scans WHERE share_token IS NOT NULL));


-- =============================================================
-- 002_certification.sql
-- =============================================================
-- Certification + report persistence for the public certificate page.
-- Safe to run repeatedly (IF NOT EXISTS). Apply in the Supabase SQL editor.

ALTER TABLE scans ADD COLUMN IF NOT EXISTS certification_gate TEXT;      -- pass | conditional | fail | unverified
ALTER TABLE scans ADD COLUMN IF NOT EXISTS overall_grade TEXT;          -- A | B | C | D | F
ALTER TABLE scans ADD COLUMN IF NOT EXISTS scan_coverage INTEGER;       -- 0-100
ALTER TABLE scans ADD COLUMN IF NOT EXISTS result_confidence TEXT;      -- high | medium | limited
ALTER TABLE scans ADD COLUMN IF NOT EXISTS certification_json JSONB;    -- full Certification object (pillars, reasons)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS report_json JSONB;           -- launchReadiness + context

-- Fast lookups for the badge / certificate.
CREATE INDEX IF NOT EXISTS idx_scans_certification_gate ON scans(certification_gate);


-- =============================================================
-- 003_credits.sql
-- =============================================================
-- Credits, plans, and billing. Apply in the Supabase SQL editor.
-- Safe to run repeatedly.

-- Profiles: credit balance + plan period.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 15;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Append-only credit ledger for transparency + audit.
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,                -- +grant / +topup / -consume / +refund
  reason TEXT NOT NULL,                  -- 'scan' | 'grant' | 'topup' | 'monthly_reset' | 'refund'
  balance_after INTEGER NOT NULL,
  meta JSONB,                            -- e.g. { url, depth, scan_id }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

-- Idempotency for Razorpay webhook events.
CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,                   -- Razorpay event id
  event_type TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic credit spend. Returns the new balance, or -1 if insufficient.
-- Runs as a single statement so concurrent scans cannot overspend.
CREATE OR REPLACE FUNCTION consume_credits(p_user UUID, p_amount INTEGER, p_reason TEXT, p_meta JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles
    SET credits_balance = credits_balance - p_amount
    WHERE id = p_user AND credits_balance >= p_amount
    RETURNING credits_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RETURN -1; -- insufficient credits (or unknown user)
  END IF;

  INSERT INTO credit_transactions (user_id, delta, reason, balance_after, meta)
    VALUES (p_user, -p_amount, p_reason, new_balance, p_meta);

  RETURN new_balance;
END;
$$;

-- Grant credits (monthly reset, top-up, subscription charge).
CREATE OR REPLACE FUNCTION grant_credits(p_user UUID, p_amount INTEGER, p_reason TEXT, p_meta JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles
    SET credits_balance = credits_balance + p_amount
    WHERE id = p_user
    RETURNING credits_balance INTO new_balance;

  INSERT INTO credit_transactions (user_id, delta, reason, balance_after, meta)
    VALUES (p_user, p_amount, p_reason, COALESCE(new_balance, 0), p_meta);

  RETURN new_balance;
END;
$$;

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credit tx" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);


-- =============================================================
-- 004_grants.sql
-- =============================================================
-- Grant the Supabase API roles access to our tables + functions.
--
-- The app does ALL database work through the service-role client
-- (lib/supabase.ts → supabaseAdmin), which bypasses RLS but still needs
-- table/function GRANTs. Hosted Supabase usually auto-grants these via default
-- privileges, but a local stack (and some projects) does not — without this,
-- every profiles/credits query fails with "permission denied for table".
--
-- Safe to run repeatedly.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role is the trusted server identity — full access, bypasses RLS.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Future tables/sequences/functions created in public inherit the grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Credit RPCs are called by the server as service_role.
GRANT EXECUTE ON FUNCTION consume_credits(UUID, INTEGER, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION grant_credits(UUID, INTEGER, TEXT, JSONB) TO service_role;


-- =============================================================
-- 005_report_lookup.sql
-- =============================================================
-- Durable full-report lookup.
--
-- The "Open full report" link uses the streaming scan id (e.g. demo-1784...).
-- On serverless (Vercel) the in-memory store is per-lambda and effectively
-- empty, so the full report MUST resolve from Supabase. Store that id so we can
-- look the report up, and keep the trimmed full result in report_json.
--
-- Safe to run repeatedly.

ALTER TABLE scans ADD COLUMN IF NOT EXISTS demo_scan_id TEXT;
CREATE INDEX IF NOT EXISTS idx_scans_demo_scan_id ON scans(demo_scan_id);

