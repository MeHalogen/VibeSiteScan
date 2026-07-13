# Credits System + Real Pipeline UI — Design

**Date:** 2026-07-13
**Prereq confirmed:** the scan engine is foolproof — security findings match `curl` ground truth exactly, verdicts are deterministic, and the link checker no longer reports rate-limited/bot-blocked links as "broken" (GitHub went fail/F → conditional/D once that false positive was fixed).

This milestone has two intertwined parts: **(A) a real credits system tied to payment plans**, and **(B) a pipeline UI that shows the genuine scan happening** and stops exactly where the user stops it. Credits gate the scan start; the pipeline shows credits and honors Stop.

---

## Part A — Credits system

### Model
- **1 credit = 1 site check.** Depth-weighted so cost matches compute: **Quick = 1, Launch (standard) = 2, Deep = 5.**
- **Free re-verify:** re-scanning the *same URL* within 15 minutes costs 0 credits — this rewards the fix→re-scan loop vibe coders live in, and is a genuine differentiator.
- **Credit is reserved at scan start.** Stopping early does not refund (compute was spent). A scan that fails to start (invalid URL, over quota) reserves nothing.

### Plans (`lib/plans.ts` — single source of truth)
| Plan | Price | Monthly credits | Depths | Extras |
|---|---|---|---|---|
| Free | ₹0 | 15 | Quick, Launch | Public certificate, badge |
| Starter | ₹799/mo | 250 | + Deep | History, PDF export, priority |
| Agency | ₹1,999/mo | 1000 | + Deep | White-label certs, client workspaces, API |
| Top-up pack | ₹199 one-time | +75 | — | Pay-as-you-go, never expires |

Numbers are the starting calibration, all in one file so they're trivially tunable.

### Enforcement (`lib/credits.ts`)
- `getBalance(userId)`, `canRun(userId, depth)`, `consumeCredits(userId, depth, url)` — **atomic** decrement via a Supabase RPC (`consume_credits`) so concurrent scans can't overspend.
- **Anonymous trial:** unauthenticated visitors get **2 free quick checks**, keyed by a signed device cookie + IP (abuse-limited). Lets people try before signup — critical for virality. Beyond that → sign-in prompt.
- **Monthly reset:** lazy — on first scan of a new period, reset `used=0` and roll `period_start`. No cron needed.
- **Ledger:** append-only `credit_transactions` (grant / consume / topup / refund) for full transparency ("damn real" — a user can see exactly where credits went).
- Over-quota → structured **402** with an upgrade CTA, surfaced in the existing `ScanInitializer` error path.

### Razorpay (`app/api/billing/*`)
- **Monthly plans → Razorpay Subscriptions**; **top-up packs → Razorpay Orders** (one-time).
- `create-subscription` / `create-order` routes; client checkout via Razorpay's script.
- `webhook` route verifies `x-razorpay-signature` (HMAC-SHA256 with `RAZORPAY_KEY_SECRET`) and, on `subscription.charged` / `order.paid`, grants credits + sets plan. Idempotent by event id.
- Keys from env (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) — test mode until the user adds live keys. **The assistant never handles keys or transacts.**
- Migration `003_credits.sql`: `profiles` gets `credits_balance`, `plan`, `period_start`; new `credit_transactions` + `billing_events` (idempotency) tables.

### Identity
Credits require a user → **Supabase Auth email OTP** (magic code). Viewing a certificate stays fully public (the viral surface needs no login). Anonymous trial via device cookie.

---

## Part B — Real pipeline UI (matches the homepage, no gimmick)

### The problem with today's pipeline
It animates stage names but doesn't show the *actual site being examined*, so it reads as decorative. And Stop currently throws an error instead of preserving what was scanned.

### Principle: show the real artifact at every step
The scanner already streams stages, metrics, and logs. We make it stream **granular evidence** and render it verbatim:
- **Target** → normalized URL, protocol, redirect chain
- **Homepage** → `GET → 200 in 143 ms · text/html · 18 KB`
- **Routes** → the actual discovered route list appearing one by one
- **Page Scan** → each route fetched with its live status
- **Links** → a live ticker + the real links resolving: `✓ /pricing 200 · ✕ /old 404 · ⚠ /gh 429 restricted`
- **Security** → the header checklist filling in: `CSP ✗ · HSTS ✓ · X-Frame ✗ · cookies: 1 insecure · jQuery 3.4.1 ⚠ CVE-2020-11022`
- **Performance** → `TTFB 143 ms · 3 render-blocking scripts · 5 imgs missing dimensions`
- **Certification** → the gate computing from the real counts

### Engine changes (to make the feed real)
1. **Granular events:** emit per-link results and per-header results as `stage_progress` (the event contract already supports arbitrary metrics; we add a light `evidence` array). Capped/throttled so the stream stays smooth.
2. **Graceful Stop → partial result:** thread an `AbortSignal` into `runScan`. At each stage boundary, if aborted, stop, compute a **partial certification** (`gate = unverified`, reason "scan stopped at <stage>"), and return what was gathered. The stream emits `result` with `partial: true`. No throw, no fake error — the user sees a **partial report up to the exact stop point**, clearly labelled, with a one-click resume/rescan.

### UI (homepage-matched, 3-column forensic console)
Reuses the homepage's exact visual system — `bg-[#0a0e14]`, `scanline-overlay`, `bg-coord-grid-dark`, mono type, `classified-stamp`, `signal-dot`, emerald accents, corner labels:
- **Left rail** — the pipeline modules with live status (the homepage "Live Scans" panel, but these are the real stages).
- **Center** — "NOW SCANNING": the current stage's real artifact, big and legible (the header checklist, the link ticker, the route list). This is the anti-gimmick core.
- **Right rail** — live **terminal evidence feed**: real actions as they happen (`GET /about → 200 · checking CSP → absent · jQuery 3.4.1 → advisory`), styled like the homepage terminal stream.
- **Top bar** — target, elapsed, progress, **credits remaining**.
- **Stop** — prominent; freezes to the partial report at the current point.

### What stays
The reliability work already done (honest stage statuses, skipped/failed states, idle watchdog, no rAF-dependent transitions) carries over unchanged — this is a presentational + evidence-granularity upgrade on a solid base.

---

## Sequencing
1. Credits schema + `lib/plans.ts` + `lib/credits.ts` + auth + quota enforcement (no UI yet).
2. Razorpay routes + webhook + pricing page wired to real plans (test mode).
3. Engine: granular evidence events + AbortSignal → partial result.
4. Real pipeline UI (homepage-matched 3-col) rendering the evidence + Stop→partial + credits.
Each step ends green (build + live verification against real sites).

## Open decisions (for the user)
1. Credit model: depth-weighted (recommended) vs flat 1-per-scan.
2. Razorpay: subscriptions + top-up packs (recommended) vs top-up packs only to start.
3. Anonymous trial before signup (recommended, viral) vs require signup to scan.
