/**
 * VibeSiteScan — Product Configuration
 *
 * Single source of truth for product name, limits, and constants.
 * Never hardcode "VibeSiteScan", "VibeSiteScan", or "LaunchLint" elsewhere —
 * always import from this file.
 */

export const PRODUCT_NAME = 'VibeSiteScan';
export const PRODUCT_TAGLINE = 'Final QA for vibe-coded websites.';
export const PRODUCT_DESCRIPTION =
  'Paste your public URL. VibeSiteScan maps what the internet can see, catches broken routes, exposed client keys, dead forms, missing previews, and AI leftovers — then gives you copy-paste fix prompts for Cursor, Lovable, Bolt, and Replit.';
export const PRODUCT_URL = 'https://vibesitescan.app';

/** Scanner identity string used in User-Agent headers */
export const SCANNER_USER_AGENT = `VibeSiteScanBot/1.0 (+${PRODUCT_URL})`;

// ─── Scan Limits ─────────────────────────────────────────────────────────────

/** Maximum pages to crawl per scan */
export const MAX_PAGES = 25;

/** Maximum redirects to follow per request */
export const MAX_REDIRECTS = 5;

/** Per-request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Maximum HTML response size to process (5 MB) */
export const MAX_HTML_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximum total JS content to scan for key patterns (10 MB) */
export const MAX_JS_SCAN_BYTES = 10 * 1024 * 1024;

/** Maximum wall-clock time for a full scan (60 s) */
export const MAX_SCAN_DURATION_MS = 60_000;

/** Maximum links extracted per page */
export const MAX_LINKS_PER_PAGE = 100;

/** Maximum total links to check across the whole scan */
export const MAX_TOTAL_LINKS = 200;

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** Minimum coverage % to assign high confidence */
export const CONFIDENCE_HIGH_THRESHOLD = 0.85;

/** Minimum coverage % to assign medium confidence */
export const CONFIDENCE_MEDIUM_THRESHOLD = 0.60;

/** Number of critical findings that trigger "Do Not Share Yet" */
export const DECISION_CRITICAL_THRESHOLD = 1;

/** Number of warnings that trigger "Review Before Sharing" */
export const DECISION_WARNING_THRESHOLD = 5;

// ─── Enterprise Domains ───────────────────────────────────────────────────────

/** Well-known large enterprise domains → always get Diagnostic Only mode */
export const ENTERPRISE_DOMAINS = [
  'apple.com',
  'google.com',
  'microsoft.com',
  'amazon.com',
  'meta.com',
  'facebook.com',
  'netflix.com',
  'adobe.com',
  'salesforce.com',
  'oracle.com',
  'ibm.com',
  'intel.com',
  'cisco.com',
  'sap.com',
  'walmart.com',
  'target.com',
  'cnn.com',
  'bbc.com',
  'nytimes.com',
  'forbes.com',
  'bloomberg.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'reddit.com',
  'wikipedia.org',
  'github.com',
  'stripe.com',
  'shopify.com',
  'wordpress.com',
  'medium.com',
];
