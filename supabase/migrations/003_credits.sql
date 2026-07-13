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
