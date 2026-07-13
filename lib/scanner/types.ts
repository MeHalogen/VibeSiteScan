import type { LaunchReadinessScore } from '@/lib/launch-readiness/types';

// Enhanced SEO Data with detailed capture
export interface SeoData {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  h1Count: number;
  h1Texts: string[];
  h2Count: number;
  canonical: boolean;
  canonicalUrl: string;
  ogTitle: boolean;
  ogTitleText: string;
  ogDescription: boolean;
  ogDescriptionText: string;
  ogImage: boolean;
  ogImageUrl: string;
  twitterCard: boolean;
  twitterCardType: string;
  favicon: boolean;
  faviconUrl: string;
  viewport: boolean;
  robotsNoindex: boolean;
  robotsMeta: string;
  imgMissingAlt: number;
  imageCount: number;
}

// Enhanced Page Data with forensic details
export interface PageData {
  url: string;
  normalizedUrl: string;
  finalUrl: string;
  sourceUrl: string;
  sourceAnchorText: string;
  crawlDepth: number;
  includedReason: string;
  excludedReason?: string;
  statusCode: number;
  responseTimeMs: number;
  contentType: string;
  html: string;
  seo: SeoData;
  internalLinksCount: number;
  externalLinksCount: number;
  formCount: number;
  wordCount?: number;
  pageSizeBytes?: number;
  /** All response headers, lowercased keys. Empty when the fetch failed. */
  responseHeaders?: Record<string, string>;
  /** Individual Set-Cookie header values as delivered. */
  setCookies?: string[];
  /** Whether the request was redirected before reaching finalUrl. */
  redirected?: boolean;
}

// Enhanced Link Check with full tracing
export interface LinkCheck {
  sourceUrl: string;
  anchorText: string;
  rawHref: string;
  targetUrl: string;
  normalizedTargetUrl: string;
  finalUrl: string;
  linkType: 'internal' | 'external' | 'mailto' | 'tel' | 'anchor' | 'javascript' | 'asset' | 'unknown';
  status: number;
  ok: boolean;
  isBroken: boolean;
  isRedirect: boolean;
  redirectChain?: string[];
  checkedMethod: 'HEAD' | 'GET' | 'skipped';
  responseTimeMs: number;
  error?: string;
  ignoredReason?: string;
}

// Enhanced Issue with knowledge base integration
export interface Issue {
  issueCode: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  affectedUrl: string;
  title: string;
  description: string;
  whatChecked: string;
  whatFound: string;
  whyItMatters: string;
  businessImpact: string;
  developerFix: string;
  sampleFix: string;
  evidenceJson: Record<string, any>;
  priority: number;
  estimatedFixTime: string;
  ownerRole: string;
  launchBlocker: boolean;
  canLaunchWithoutFixing: boolean;
  groupedKey: string;
  // Legacy fields for backward compatibility
  fix?: string;
  page?: string;
  evidence?: string;
}

// Console Events with detailed capture
export interface ConsoleEvent {
  pageUrl: string;
  eventType: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
}

// Form Check Data
export interface FormCheck {
  pageUrl: string;
  formIndex: number;
  hasAction: boolean;
  action: string;
  method: string;
  inputCount: number;
  missingLabelCount: number;
  requiredCount: number;
  submitButtonText?: string;
}

// Robots and Sitemap Data
export interface RobotsData {
  robotsUrl: string;
  robotsStatusCode: number;
  robotsFound: boolean;
  robotsContentPreview: string;
  sitemapUrls: string[];
}

export interface SitemapData {
  sitemapUrl: string;
  sitemapStatusCode: number;
  sitemapFound: boolean;
  sitemapUrlsCount: number;
  sitemapUrlsSample: string[];
}

// Browser Checks Data (Playwright optional)
export interface BrowserChecksData {
  browserChecksStatus: 'completed' | 'skipped' | 'failed';
  consoleErrors: ConsoleEvent[];
  consoleWarnings: ConsoleEvent[];
  pageErrors: string[];
  failedNetworkRequests: Array<{url: string, error: string}>;
  desktopScreenshotUrl?: string;
  mobileScreenshotUrl?: string;
}

// Enhanced Scan Result with all forensic data
export interface ScanResult {
  rootUrl: string;
  pages: PageData[];
  linkResults: LinkCheck[];
  issues: Issue[];
  score: number; // Legacy score for backwards compatibility
  launchReadiness?: LaunchReadinessScore; // Launch readiness scoring
  certification?: any; // Certification (green-light gate + pillar grades)
  /** True when the user stopped the scan before it finished. */
  partial?: boolean;
  /** Stage during which the user stopped, when partial. */
  stoppedAtStage?: string;
  durationMs: number;
  consoleEvents: ConsoleEvent[];
  formChecks: FormCheck[];
  robotsData?: RobotsData;
  sitemapData?: SitemapData;
  browserChecks?: BrowserChecksData;
  // NEW: Engine outputs
  publicRoutes?: any[];          // PublicRoute[]
  exposureFindings?: any[];      // ExposureFinding[]
  aiLeftoverFindings?: any[];    // AILeftoverFinding[]
  keyPatternFindings?: any[];    // KeyPatternFinding[]
  enhancedForms?: any[];         // DetectedForm[]
  formFindings?: any[];          // FormFinding[]
  securityFindings?: any[];      // SecurityFinding[]
  performanceFindings?: any[];   // PerformanceFinding[]
  fixPrompts?: any[];            // FixPrompt[]
  // Summary stats
  discoveredPagesCount: number;
  skippedPagesCount: number;
  internalLinksCount: number;
  externalLinksCount: number;
  brokenInternalLinksCount: number;
  brokenExternalLinksCount: number;
  redirectsCount: number;
  ignoredLinksCount: number;
  formsFoundCount: number;
  consoleErrorsCount: number;
}
