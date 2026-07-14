# VibeSiteScan — Full Flow Guide

Everything about how the product works end-to-end: the auth you're using, the
scan → credit → certificate → billing journey, and the exact fix for why your
live site (`vibesitescan.pro`) showed "report not available" / "certificate not
found".

---

## 0. Which auth did I put in?

**Supabase Auth, email magic-link (passwordless OTP).** No passwords, no Google/
GitHub OAuth (those can be added later in the Supabase dashboard with no code
change). Concretely:

- **Sign-in** (`/login`): user types their email → Supabase emails a magic link →
  clicking it signs them in. Implemented with `supabase.auth.signInWithOtp()`
  (`app/login/page.tsx`).
- **Session**: lives in the browser (localStorage), auto-refreshed by
  `@supabase/supabase-js` (`lib/supabase-browser.ts`). **No cookies / no
  middleware** — deliberately simple and serverless-friendly.
- **How the server knows who you are**: the browser attaches the Supabase access
  token as `Authorization: Bearer <token>` on API calls. The server validates it
  with the service-role client (`lib/auth-server.ts` → `getUserFromRequest`) and
  looks up / creates the user's profile (`ensureProfile`).
- **What needs auth**: running deeper scans, credits, billing, saved history.
  **What doesn't**: running a free Quick scan, and viewing a public certificate.

To enable it you only flip on **Authentication → Providers → Email** in Supabase.

---

## 1. The end-to-end user journey

```
Homepage ──"Scan a site"──▶ Pipeline (live) ──▶ Result + Certification
   │                                                  │
   │                                         ┌────────┼─────────────┐
 "Sign in"                          "Open full report"      "Public certificate"
   │                                    (/dashboard/…)          (/r/<token>)
   ▼                                         │                     │
 /login (magic link) ──▶ /dashboard ◀────────┘              embeddable badge
   │                        │                                (/api/badge/<token>)
   │                   credits, plan,
   │                   scan history,
   │                   upgrade / cancel
   ▼
 /pricing ──"Choose Pro"──▶ Razorpay Checkout ──▶ webhook ──▶ credits granted
```

**Step by step**

1. **Scan** — On the homepage, "Scan a site" opens the pipeline. A guest gets
   **2 free Quick checks**; deeper scans require sign-in. Each scan streams live
   stages (security headers, performance, links, metadata, …).
2. **Credits** — Signed-in scans cost credits: Quick = 1, Launch = 2, Deep = 5.
   Re-scanning the **same URL within 15 minutes is free** (rewards the fix →
   re-verify loop). Out of credits → a clear "top up or upgrade" message.
3. **Result + Certification** — Every scan produces a deterministic verdict:
   **Verified / Conditional / Not Verified / Unverified**, an overall A–F grade,
   per-pillar grades (Security, SEO, Performance, …), and a Launch Readiness
   score. Same scan → same result, always.
4. **Full report** — "Open full report" shows every issue with evidence and a
   copy-paste fix prompt (Cursor / Lovable / Bolt / Replit flavored).
5. **Public certificate** — `/r/<token>` is a shareable page anyone can view (no
   login), plus an embeddable SVG **badge** (`/api/badge/<token>`) that links
   back to it — the viral "is your site scan-approved?" loop.
6. **Billing** — `/pricing` → "Choose Pro/Studio" opens the Razorpay Checkout
   modal (guests are sent to sign in and bounced right back). After payment,
   Razorpay calls our **webhook**, which grants credits and sets the plan. Users
   can **cancel** from the dashboard (access continues to end of cycle).

---

## 2. Plans & credits (single source of truth: `lib/plans.ts`)

| Plan   | Price   | Credits/mo | Scans          | Extras |
|--------|---------|-----------|----------------|--------|
| Free   | ₹0      | 15        | Quick + Launch | Public cert + badge |
| Pro    | ₹99/mo  | 100       | + Deep         | PDF export, history, priority |
| Studio | ₹299/mo | 400       | + Deep         | White-label, client workspaces |

One-time top-ups (never expire): **₹49 → 60 cr**, **₹99 → 150 cr**, **₹199 → 350 cr**.

---

## 3. ⚠️ Why your live site failed — and the fix

Your `vibesitescan.pro` screenshots showed "report not available" and
"certificate not found". Root cause: **the live deployment wasn't connected to
Supabase**, so everything fell back to in-memory storage — and on Vercel
(serverless) in-memory storage is per-request and effectively empty. It also
explains the old "score 0/100" (a separate scoring bug, now fixed).

To make the live site real, do this **once**:

### 3a. Connect Supabase on the host (Vercel)
In **Vercel → Project → Settings → Environment Variables** (Production + Preview),
add — from Supabase **Settings → API**:
```
NEXT_PUBLIC_SUPABASE_URL        = https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = <anon public key>
SUPABASE_SERVICE_ROLE_KEY       = <service_role key>   # secret
NEXT_PUBLIC_APP_URL             = https://vibesitescan.pro
```

### 3b. Run ALL migrations in the Supabase SQL editor, in order
```
001_init.sql          002_certification.sql   003_credits.sql
004_grants.sql   ← REQUIRED   005_report_lookup.sql   ← REQUIRED
```
- **004_grants.sql** grants the API roles table access. Without it every
  credits/profile query fails with "permission denied" (this was a real bug).
- **005_report_lookup.sql** lets the full report resolve durably by scan id.

### 3c. Enable Email auth
Supabase → **Authentication → Providers → Email** → on.

### 3d. Razorpay (Test mode first)
Vercel env vars:
```
RAZORPAY_KEY_ID / NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RAZORPAY_PLAN_PRO / RAZORPAY_PLAN_STUDIO   # created under Subscriptions → Plans
```
Webhook URL: `https://vibesitescan.pro/api/billing/webhook` — events:
`subscription.charged`, `subscription.cancelled`, `subscription.halted`, `order.paid`.

**Redeploy.** After that, certificates and reports persist, scores are correct,
and payments grant credits. (Full detail in `SETUP.md`.)

---

## 4. Test it locally exactly like production

The whole stack runs locally against a real Supabase:
```bash
npx supabase start          # Docker; prints local keys + a Mailpit inbox
# put the local URL + anon + service_role keys in .env.local
npm run dev
npx playwright test         # 6 e2e tests: scan, credits, over-quota, no-overflow
```
Magic-link emails land in Mailpit (`http://127.0.0.1:54324`). This is how the
whole auth + credits + webhook flow was verified end-to-end.

---

## 5. What's proven working (tested against real Supabase)

- Sign-in seeds 15 credits · Quick scan deducts 1 · free re-scan within 15 min
  doesn't double-charge · out of credits → 402.
- Razorpay webhook (signed) grants credits + upgrades plan · replay is idempotent
  · bad signature → 401 · cancel ends at cycle end.
- Full report + certificate survive a server restart (durable in Supabase).
- Scoring is honest: repeated per-page issues are grouped, so a fixable site
  scores in the 60s, not 0; real blockers still drop it hard.
