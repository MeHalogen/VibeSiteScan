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
