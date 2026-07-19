import { defineConfig, devices } from '@playwright/test';

/**
 * Run with the dev server on :3000 and (for the credit tests) a local Supabase
 * stack (`npx supabase start`). `npx playwright test`.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /e2e\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
