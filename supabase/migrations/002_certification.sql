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
