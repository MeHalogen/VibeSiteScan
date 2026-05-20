/**
 * Stage Context & "Why This Matters" Explanations
 * 
 * Provides user-friendly explanations for each pipeline stage
 * focused on launch readiness and AI-builder pain points
 */

export interface StageContext {
  whyItMatters: string;
  whatWeCheck: string[];
  commonIssues: string[];
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
}

export const STAGE_CONTEXTS: Record<string, StageContext> = {
  init: {
    whyItMatters: "Before checking anything, we need to verify your URL is reachable and properly configured with HTTPS. A broken target URL means nothing else matters.",
    whatWeCheck: [
      "URL normalization (trailing slashes, www vs non-www)",
      "HTTPS configuration",
      "Domain reachability",
      "Redirect chains (if any)",
    ],
    commonIssues: [
      "Mixed http/https redirects",
      "Infinite redirect loops",
      "Domain not resolving",
      "SSL certificate errors",
    ],
    impact: 'Critical',
  },

  fetch: {
    whyItMatters: "Your homepage is the first thing visitors and crawlers see. If it's slow, broken, or unreachable, you have a launch blocker.",
    whatWeCheck: [
      "Homepage HTTP status (200 = good)",
      "Response time and performance",
      "Content type and encoding",
      "Initial HTML structure",
    ],
    commonIssues: [
      "404/500 errors on homepage",
      "Slow load times (>3s)",
      "Empty or minimal content",
      "Missing or broken HTML",
    ],
    impact: 'Critical',
  },

  discover: {
    whyItMatters: "We map out all your internal routes to understand your site structure. AI-built sites often have broken navigation or duplicate hash routes.",
    whatWeCheck: [
      "Internal link discovery",
      "Route mapping and depth",
      "Hash anchor classification (#features, #pricing)",
      "Sitemap.xml if available",
    ],
    commonIssues: [
      "Hash anchors counted as separate pages",
      "Broken internal navigation",
      "Unreachable pages",
      "Missing sitemap",
    ],
    impact: 'High',
  },

  crawl: {
    whyItMatters: "We scan discovered routes to extract content, metadata, and check for issues. This is where we find what AI builders often miss.",
    whatWeCheck: [
      "Page content extraction",
      "HTML structure validation",
      "Resource loading",
      "Content quality indicators",
    ],
    commonIssues: [
      "Pages with identical content",
      "Missing or duplicate metadata",
      "Broken images or resources",
      "Poor mobile responsiveness",
    ],
    impact: 'High',
  },

  links: {
    whyItMatters: "Broken links frustrate users and signal poor quality. Internal broken links are launch blockers. External broken links look sloppy.",
    whatWeCheck: [
      "Internal link validation",
      "External link checking",
      "Redirect detection (301/302)",
      "Broken link identification (404/5xx)",
    ],
    commonIssues: [
      "Broken internal navigation",
      "Dead external references",
      "Excessive redirect chains",
      "mailto/tel links incorrectly flagged",
    ],
    impact: 'High',
  },

  seo: {
    whyItMatters: "Search engines and browser previews rely on metadata. AI-built sites often reuse the same title and description across all pages.",
    whatWeCheck: [
      "Page titles (unique, descriptive)",
      "Meta descriptions (compelling, 150-160 chars)",
      "H1 headings (one per page, relevant)",
      "Canonical tags (prevent duplicate content)",
      "Robots meta tags",
    ],
    commonIssues: [
      "Duplicate titles across all pages",
      "Duplicate meta descriptions",
      "Missing or too-short descriptions",
      "Missing canonical tags",
    ],
    impact: 'Medium',
  },

  social: {
    whyItMatters: "When you paste your link on LinkedIn, X, WhatsApp, or Slack, these tags decide whether the preview looks professional or broken. This is what people see BEFORE clicking.",
    whatWeCheck: [
      "og:title (optimized for social sharing)",
      "og:description (compelling preview text)",
      "og:image (1200x630px recommended)",
      "Twitter card tags (summary_large_image)",
      "Fallback behavior if tags missing",
    ],
    commonIssues: [
      "Missing OG image on all pages",
      "Generic or missing OG titles",
      "No OG descriptions",
      "Image too small or wrong format",
    ],
    impact: 'High',
  },

  forms: {
    whyItMatters: "Forms are how users interact with your site. Broken or poorly structured forms frustrate users and lose conversions.",
    whatWeCheck: [
      "Form detection",
      "Input structure (labels, names, types)",
      "Required field indicators",
      "Action and method validation",
      "Basic accessibility (labels for inputs)",
    ],
    commonIssues: [
      "Forms without proper labels",
      "Missing required field indicators",
      "Unclear or missing action URLs",
      "Poor mobile form experience",
    ],
    impact: 'Medium',
  },

  browser: {
    whyItMatters: "Console errors and failed requests indicate broken JavaScript or missing resources. These often go unnoticed until users complain.",
    whatWeCheck: [
      "Console errors (JavaScript crashes)",
      "Failed network requests (404 on assets)",
      "Mobile viewport configuration",
      "Browser compatibility indicators",
    ],
    commonIssues: [
      "Missing viewport meta tag",
      "Console errors from broken scripts",
      "404s on CSS/JS/image assets",
      "Third-party script failures",
    ],
    impact: 'Medium',
  },

  score: {
    whyItMatters: "Sitemap and robots.txt help search engines discover and index your pages. Missing them doesn't prevent launch, but reduces discoverability.",
    whatWeCheck: [
      "Sitemap.xml presence and validity",
      "Robots.txt presence and configuration",
      "Noindex/nofollow status",
      "Crawl hints and directives",
    ],
    commonIssues: [
      "Missing sitemap.xml",
      "Missing robots.txt",
      "Sitemap not listed in robots.txt",
      "Accidental noindex on important pages",
    ],
    impact: 'Low',
  },

  report: {
    whyItMatters: "This is where we calculate your launch readiness and group issues into actionable fixes. We determine: Can you ship this? What must be fixed first?",
    whatWeCheck: [
      "Issue severity aggregation",
      "Blocker identification (critical issues)",
      "Needs-fix grouping (warnings)",
      "Ready checks (passed validations)",
      "Launch decision calculation",
    ],
    commonIssues: [
      "Multiple related issues shown separately",
      "Unclear fix priorities",
      "Score doesn't reflect real problems",
      "Can't tell what's actually blocking launch",
    ],
    impact: 'Critical',
  },
};

/**
 * Get context for a specific stage
 */
export function getStageContext(stageId: string): StageContext | null {
  return STAGE_CONTEXTS[stageId] || null;
}

/**
 * Get launch impact badge color
 */
export function getImpactColor(impact: StageContext['impact']): {
  text: string;
  bg: string;
  border: string;
} {
  const colors = {
    Critical: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
    High: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    Medium: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
    },
    Low: {
      text: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
    },
  };

  return colors[impact];
}
