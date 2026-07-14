import { test, expect, request as pwRequest } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * End-to-end coverage for the launch-critical flows.
 *
 * UI flows run against the dev server (:3000). The credits/auth tests also need
 * a local Supabase stack (`npx supabase start`) — they self-skip if it's absent.
 */

const SUPA_URL = 'http://127.0.0.1:54321';
const SERVICE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function supabaseUp(): Promise<boolean> {
  try {
    const r = await fetch(SUPA_URL + '/auth/v1/health', { headers: { apikey: ANON } });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Public UI flows (no auth needed) ─────────────────────────────────────────

test('homepage renders and exposes a Sign in entry point', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/VibeSiteScan/i);
  await expect(page.locator('a[href="/login"]').first()).toBeVisible();
});

test('pricing shows the ₹99 / ₹299 ladder', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Studio', { exact: true }).first()).toBeVisible();
  await expect(page.locator('text=99').first()).toBeVisible();
  await expect(page.locator('text=299').first()).toBeVisible();
});

test('login page renders the magic-link form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText(/Sign in to VibeSiteScan/i)).toBeVisible();
});

test('anonymous quick scan completes end-to-end', async ({ page }) => {
  await page.goto('/dashboard/new-scan-pipeline');
  // choose Quick, fill URL, run
  await page.getByRole('button', { name: /Quick Pass/i }).click();
  await page.locator('input[placeholder*="your-site"]').fill('https://example.com');
  await page.getByRole('button', { name: /run free scan/i }).first().click();
  // pipeline appears, then a terminal verdict
  await expect(page.getByText(/Terminal stream/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Scan complete|View summary|Verified|Not Verified|Conditional/i).first()).toBeVisible({
    timeout: 45_000,
  });
});

test('pipeline does not overflow horizontally', async ({ page }) => {
  await page.goto('/dashboard/new-scan-pipeline');
  await page.getByRole('button', { name: /Quick Pass/i }).click();
  await page.locator('input[placeholder*="your-site"]').fill('https://www.apple.com');
  await page.getByRole('button', { name: /run free scan/i }).first().click();
  await page.getByText(/Terminal stream/i).waitFor({ timeout: 20_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

// ── Credits + auth (needs local Supabase) ────────────────────────────────────

test('signed-in scan deducts a credit; over-quota returns 402', async ({}, testInfo) => {
  test.skip(!(await supabaseUp()), 'local Supabase not running');

  const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const email = `pw-${Date.now()}@vibesitescan.test`;
  const password = 'Test123456!';

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error, error?.message).toBeNull();

  const pub = createClient(SUPA_URL, ANON, { auth: { persistSession: false } });
  const { data: sess } = await pub.auth.signInWithPassword({ email, password });
  const token = sess!.session!.access_token;

  const api = await pwRequest.newContext({
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });

  // Profile is seeded with the free plan's 15 credits on first authed call.
  const me = await (await api.get('/api/me')).json();
  expect(me.authed).toBe(true);
  expect(me.balance).toBe(15);

  // A quick scan costs 1 credit.
  const scan = await api.post('/api/demo-scan/stream', {
    data: { url: 'https://example.com', depth: 'quick' },
  });
  expect(scan.ok()).toBeTruthy();
  await scan.body();

  const after = await (await api.get('/api/me')).json();
  expect(after.balance).toBe(14);

  // Drain to zero and confirm the quota gate blocks with 402.
  await admin.from('profiles').update({ credits_balance: 0 }).eq('id', created.user!.id);
  const blocked = await api.post('/api/demo-scan/stream', {
    data: { url: 'https://another.example.org', depth: 'quick' },
  });
  expect(blocked.status()).toBe(402);

  await admin.auth.admin.deleteUser(created.user!.id);
  await api.dispose();
});
