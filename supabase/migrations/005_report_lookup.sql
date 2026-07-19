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
