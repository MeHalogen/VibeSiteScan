# VibeSiteScan — Setup Guide

This turns the app from "runs in demo mode" into the real product: durable
certificates, accounts, credits, and paid plans.

**You can run everything locally with zero setup** — the scanner, pipeline UI,
certification, and certificate pages all work in in-memory demo mode. The steps
below unlock persistence and billing.

Order matters: **Supabase first** (accounts + durable data), **Razorpay second**
(payments, which depend on accounts).

---

## 0. Local run (no setup)

```bash
npm install
npm run dev        # http://localhost:3000
```

Scan a site → you get a live pipeline, a certification verdict, and a public
certificate at `/r/<token>`. In demo mode the certificate lives in server memory
and resets when the server restarts. That's expected until Supabase is set up.

---

## 1. Supabase — accounts, durable certificates, credits

### 1a. Create the project
1. Go to https://supabase.com → **New project**. Pick a region near your users.
2. Wait for it to provision (~2 min).

### 1b. Get your keys
Project → **Settings → API**. Copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret — server only, never ship to the browser)

Put them in `.env.local` (copy from `.env.example`).

### 1c. Run the database migrations
Supabase → **SQL Editor** → paste and run each file **in order**:
1. `supabase/migrations/001_init.sql`  — scans, issues, profiles, RLS
2. `supabase/migrations/002_certification.sql` — certificate columns
3. `supabase/migrations/003_credits.sql` — credits balance, transactions, `consume_credits`/`grant_credits` functions
4. `supabase/migrations/004_grants.sql` — **required** — grants the API roles access to the tables/functions (without it every profiles/credits query fails with "permission denied")

(Or use the Supabase CLI: `supabase db push`.)

### 1d. Turn on Auth (email)
Project → **Authentication → Providers → Email**: enable it. Email OTP / magic
link is enough — paid plans require sign-in; viewing a public certificate does not.

### 1e. Verify
Restart `npm run dev`, run a scan, then **restart the server** and reload the
certificate URL. If it still loads, persistence is live. (The scan log line will
say "Certificate saved (durable)" instead of "in-memory".)

---

## 2. Razorpay — subscriptions + credit top-ups

Credits model (single source of truth: `lib/plans.ts`):
- **Free** — 15 credits/mo · Quick + Launch checks
- **Pro** — ₹99/mo · 100 credits · adds Deep checks · PDF + history
- **Studio** — ₹299/mo · 400 credits · white-label + client workspaces
- **Top-up packs** (one-time, never expire): 60/₹49, 150/₹99, 350/₹199
- A scan costs 1 (quick) / 2 (standard) / 5 (deep) credits. Re-scanning the same
  URL within 15 minutes is **free** (rewards the fix → re-verify loop).

### 2a. Get API keys (use Test mode first)
Razorpay Dashboard → **Settings → API Keys → Generate Test Key**:
- **Key Id** → `RAZORPAY_KEY_ID` (and optionally `NEXT_PUBLIC_RAZORPAY_KEY_ID`)
- **Key Secret** → `RAZORPAY_KEY_SECRET` (⚠️ secret)

### 2b. Create the subscription plans
Dashboard → **Subscriptions → Plans → Create Plan**. Make two monthly plans:
- Pro: ₹99 / month → copy its `plan_...` id → `RAZORPAY_PLAN_PRO`
- Studio: ₹299 / month → copy its `plan_...` id → `RAZORPAY_PLAN_STUDIO`

(Credit top-up packs need **no** plan — they use one-time Orders, created from
`CREDIT_PACKS` in `lib/plans.ts`.)

### 2c. Configure the webhook
Dashboard → **Settings → Webhooks → Add New Webhook**:
- **URL**: `https://YOUR_DOMAIN/api/billing/webhook`
- **Secret**: make one up → put the same value in `RAZORPAY_WEBHOOK_SECRET`
- **Active events**: `subscription.charged`, `subscription.cancelled`,
  `subscription.halted`, `order.paid`

The webhook route verifies the signature (HMAC-SHA256) and grants credits /
updates the plan via the Supabase `grant_credits` function. Unsigned or
mis-signed calls are rejected.

### 2d. Verify (test mode)
- On `/pricing`, click **Choose Pro** → you're sent to the dashboard, which opens
  the Razorpay Checkout modal (sign in first if prompted). Pay with a Razorpay
  **test card**, then confirm the webhook fired and the user's credits/plan
  updated (dashboard credits jump; `profiles.plan` = `pro`).
- Also set `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same as `RAZORPAY_KEY_ID`) so the
  client checkout can initialize.

### 2e. Go live
Swap Test keys for **Live** keys, recreate the plans in Live mode, update the
webhook to the live secret, and set `NEXT_PUBLIC_APP_URL` to your real domain.

> The billing flow is **complete end-to-end**: pricing → checkout modal →
> Razorpay → webhook → credits granted (verified against a local Supabase +
> signed test webhooks). You only need to plug in your own keys.

---

## 3. Deploy (Vercel)

1. Import the repo in Vercel.
2. Add every variable from `.env.example` under **Project → Settings →
   Environment Variables** (Production + Preview).
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Deploy. Point the Razorpay webhook at the production `/api/billing/webhook`.

---

## What you need, at a glance

| Service   | Required for                    | Env vars |
|-----------|---------------------------------|----------|
| Supabase  | accounts, durable certs, credits| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Razorpay  | paid plans + top-ups            | `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_PRO`, `RAZORPAY_PLAN_STUDIO` |
| App       | cert links + badge              | `NEXT_PUBLIC_APP_URL` |

Nothing else. No third service is required.
