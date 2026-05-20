/**
 * Browser Scanner - Playwright Integration
 * 
 * This module provides browser automation capabilities to eliminate
 * the limitations of static HTML scanning.
 * 
 * KEY FEATURES:
 * - Executes JavaScript and captures fully-rendered DOM
 * - Captures console errors/warnings
 * - Measures Core Web Vitals (LCP, FID, CLS)
 * - Takes screenshots for visual regression
 * - Supports authenticated scanning with cookies
 * 
 * INSTALLATION:
 * npm install playwright
 * 
 * USAGE:
 * import { scanWithBrowser } from './browserScanner';
 * const result = await scanWithBrowser('https://example.com');
 */

import { chromium, Browser, Page } from 'playwright';

export interface BrowserScanOptions {
  url: string;
  waitForSelector?: string;
  timeout?: number;
  cookies?: Array<{ name: string; value: string; domain: string }>;
  screenshot?: boolean;
  mobileEmulation?: boolean;
}

export interface BrowserScanResult {
  html: string;
  consoleLogs: Array<{
    type: 'log' | 'warn' | 'error' | 'info';
    text: string;
    timestamp: number;
  }>;
  networkErrors: Array<{
    url: string;
    statusCode: number;
    errorText: string;
  }>;
  performance: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  screenshot?: string; // Base64 encoded image
  coreWebVitals?: {
    LCP?: number; // Largest Contentful Paint
    FID?: number; // First Input Delay
    CLS?: number; // Cumulative Layout Shift
  };
}

/**
 * Scan a URL with a real browser (Playwright)
 * 
 * This function launches a headless Chrome browser, navigates to the URL,
 * waits for JavaScript to execute, and captures:
 * - Fully-rendered HTML
 * - Console logs (errors, warnings, info)
 * - Network failures
 * - Performance metrics
 * - Screenshots (optional)
 */
export async function scanWithBrowser(
  options: BrowserScanOptions
): Promise<BrowserScanResult> {
  const {
    url,
    waitForSelector,
    timeout = 30000,
    cookies,
    screenshot = false,
    mobileEmulation = false,
  } = options;

  let browser: Browser | null = null;
  const consoleLogs: BrowserScanResult['consoleLogs'] = [];
  const networkErrors: BrowserScanResult['networkErrors'] = [];

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const context = await browser.newContext({
      viewport: mobileEmulation 
        ? { width: 390, height: 844 } 
        : { width: 1920, height: 1080 },
      userAgent: mobileEmulation 
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        : undefined,
    });

    const page = await context.newPage();

    // Inject cookies for authenticated scanning
    if (cookies && cookies.length > 0) {
      await context.addCookies(cookies.map(c => ({ ...c, url })));
    }

    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type() as any,
        text: msg.text(),
        timestamp: Date.now(),
      });
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      networkErrors.push({
        url: request.url(),
        statusCode: 0,
        errorText: failure?.errorText || 'Unknown error',
      });
    });

    // Navigate to URL
    const startTime = Date.now();
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    });

    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
        console.warn(`Selector ${waitForSelector} not found`);
      });
    }

    // Capture performance metrics
    const performanceTiming = await page.evaluate(() => {
      const timing = window.performance.timing;
      return {
        navigationStart: timing.navigationStart,
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
        loadEventEnd: timing.loadEventEnd,
      };
    });

    const performance = {
      domContentLoaded: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart,
      loadComplete: performanceTiming.loadEventEnd - performanceTiming.navigationStart,
    };

    // Capture Core Web Vitals (if available)
    const coreWebVitals = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        const vitals: any = {};
        
        // LCP - Largest Contentful Paint
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }

        // CLS - Cumulative Layout Shift
        try {
          let clsScore = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
              }
            }
            vitals.CLS = clsScore;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // CLS not supported
        }

        // Resolve after 2 seconds
        setTimeout(() => resolve(vitals), 2000);
      });
    }).catch(() => ({}));

    // Get fully-rendered HTML
    const html = await page.content();

    // Take screenshot (optional)
    let screenshotBase64: string | undefined;
    if (screenshot) {
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      screenshotBase64 = screenshotBuffer.toString('base64');
    }

    await browser.close();

    return {
      html,
      consoleLogs,
      networkErrors,
      performance,
      screenshot: screenshotBase64,
      coreWebVitals,
    };
  } catch (error: any) {
    if (browser) await browser.close();
    throw new Error(`Browser scan failed: ${error.message}`);
  }
}

/**
 * Test a form by auto-filling and submitting
 * 
 * This function:
 * 1. Fills out form fields with test data
 * 2. Submits the form
 * 3. Captures any validation errors
 * 4. Checks for success messages
 */
export async function testForm(
  url: string,
  formSelector: string,
  testData: Record<string, string>
): Promise<{
  success: boolean;
  validationErrors: string[];
  successMessage?: string;
  screenshot?: string;
}> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for form to appear
    await page.waitForSelector(formSelector, { timeout: 5000 });

    // Fill out form fields
    for (const [fieldName, value] of Object.entries(testData)) {
      const selector = `input[name="${fieldName}"], textarea[name="${fieldName}"]`;
      await page.fill(selector, value).catch(() => {
        console.warn(`Field ${fieldName} not found`);
      });
    }

    // Submit form
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.click(`${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`),
    ]);

    // Check for validation errors
    const validationErrors = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('.error, .invalid-feedback, [role="alert"]'));
      return errors.map((el) => el.textContent?.trim() || '');
    });

    // Check for success message
    const successMessage = await page.evaluate(() => {
      const success = document.querySelector('.success, .alert-success, [role="status"]');
      return success?.textContent?.trim();
    });

    // Take screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshot = screenshotBuffer.toString('base64');

    await browser.close();

    return {
      success: validationErrors.length === 0 && !!successMessage,
      validationErrors,
      successMessage,
      screenshot,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Scan with authentication cookies
 * 
 * Use this to scan pages behind login walls.
 * 
 * USAGE:
 * const cookies = [
 *   { name: 'session', value: 'abc123', domain: 'example.com' }
 * ];
 * const result = await scanWithAuth('https://example.com/dashboard', cookies);
 */
export async function scanWithAuth(
  url: string,
  cookies: Array<{ name: string; value: string; domain: string }>
): Promise<BrowserScanResult> {
  return scanWithBrowser({ url, cookies });
}
