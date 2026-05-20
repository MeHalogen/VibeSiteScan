/**
 * Product Language System for LaunchScan
 * 
 * LaunchScan is the final QA gate for AI-built websites.
 * This file defines consistent terminology focused on launch readiness.
 */

export const PRODUCT_LANGUAGE = {
  // Main product positioning
  tagline: "Final QA for AI-built websites",
  heroHeadline: "Check your site before you share it.",
  heroSubheadline: "LaunchScan catches the production basics AI builders often miss: share previews, metadata, broken routes, sitemap, robots.txt, forms, mobile setup, and launch hygiene.",
  
  // Scan terminology
  scan: {
    action: "Run Launch Check",
    running: "Launch check running",
    complete: "Launch check complete",
    failed: "Launch check failed",
  },

  // Severity levels
  severity: {
    critical: "Blocker",
    warning: "Needs Fix",
    info: "Ready Check",
    passed: "Ready Check",
  },

  // Score/readiness
  score: {
    label: "Launch Readiness",
    explanation: "Based on production basics and share-preview readiness",
  },

  // Issue grouping
  issues: {
    title: "Launch Risks",
    grouped: "Fix Before Shipping",
    passed: "Ready Checks",
    prioritized: "Fix Before Shipping",
  },

  // Scan sections
  sections: {
    crawlMap: "Routes Discovered",
    social: "Share Preview",
    seo: "Search & Metadata",
    indexing: "Indexing",
    forms: "Forms",
    browser: "Browser Health",
    links: "Links",
    pages: "Pages",
  },

  // Launch decision
  decision: {
    safe: "Ready to Share",
    fix: "Fix Before Sharing",
    block: "Do Not Share Yet",
    diagnostic: "Diagnostic Report Only",
  },

  // Scan modes
  modes: {
    quick: {
      label: "Quick Check",
      description: "Homepage only",
      bestFor: "Best for landing pages",
      duration: "5–10 sec",
    },
    standard: {
      label: "Launch Check",
      description: "Homepage + internal routes",
      bestFor: "Best before public launch",
      duration: "15–45 sec",
    },
    deep: {
      label: "Deep Check",
      description: "Browser checks + screenshots + 100 pages",
      bestFor: "Pro / Coming soon",
      duration: "1–3 min",
    },
  },

  // Helper text
  helpers: {
    target: "Built for AI-generated websites, landing pages, SaaS MVPs, and fast-shipped projects.",
    why: "AI can build the page. It usually won't remember your favicon, OG image, canonical tags, sitemap, robots.txt, broken routes, or share preview. LaunchScan checks those before your audience does.",
    rescan: "Fixed something? Run LaunchScan again and verify before sharing.",
    diagnosticOnly: "This site is outside our ideal target. We checked what we could, but we are not assigning a share-readiness decision.",
    enterpriseTarget: "This appears to be a large, mature enterprise website. LaunchScan is optimized for AI-built sites, MVPs, landing pages, portfolios, and client previews — not full enterprise websites.",
    coverageNote: "Coverage affects confidence, not website quality.",
    limitedDiagnostic: "This is a limited diagnostic, not a full audit.",
  },

  // Diagnostic state messaging
  diagnostic: {
    badge: "DIAGNOSTIC COMPLETE",
    title: "Diagnostic Report Only",
    subtitle: "This site is outside our ideal target. We checked what we could, but we are not assigning a share-readiness decision.",
    disclaimer: "This does not mean the site is poor quality. It means this scan is only a limited public launch-hygiene diagnostic.",
    scopeNote: "This report reflects only public launch-hygiene checks we could verify. Skipped or unavailable checks reduce coverage and confidence, not the site's quality.",
    whyTitle: "Why this result is diagnostic only",
    whyBody: "Large enterprise websites often have complex infrastructure, redirects, regional routing, bot protections, huge page graphs, and intentional SEO/security configurations. A simple launch-readiness decision would be misleading.",
    ctaTitle: "Want an accurate readiness decision?",
    ctaBody: "Scan an AI-built site, MVP, landing page, portfolio, or client preview link to get a full launch-readiness decision with actionable recommendations.",
    trySuggestions: [
      "Your Lovable app",
      "Your Bolt site", 
      "Your Cursor-built landing page",
      "Your portfolio",
      "Your MVP landing page",
      "Your client preview link"
    ],
    checksPerformed: [
      "Public launch hygiene",
      "Share preview tags",
      "Metadata completeness",
      "Link health",
      "Route discoverability",
      "Indexing basics",
      "Form structure",
      "Browser/mobile basics"
    ],
    checksNotPerformed: [
      "Brand quality",
      "SEO authority",
      "Enterprise SEO strategy",
      "Full accessibility compliance",
      "Full security posture",
      "Business credibility",
      "Ranking potential",
      "Full performance quality"
    ]
  },

  // CTA buttons
  cta: {
    runScan: "Run Launch Check",
    viewReport: "Open Full Report",
    copyFixes: "Copy Fix List",
    copyPrompt: "Copy AI Fix Prompt",
    runAgain: "Run Again",
    exportReport: "Export Report",
    sampleReport: "View sample launch report",
  },
} as const;

/**
 * Map legacy terminology to new product language
 */
export function translateSeverity(severity: string): string {
  const map: Record<string, string> = {
    critical: PRODUCT_LANGUAGE.severity.critical,
    warning: PRODUCT_LANGUAGE.severity.warning,
    info: PRODUCT_LANGUAGE.severity.info,
  };
  return map[severity.toLowerCase()] || severity;
}

/**
 * Determine launch decision based on scan results
 */
export function getLaunchDecision(scan: {
  critical_issues_count?: number;
  warning_issues_count?: number;
  launch_score?: number;
  launch_decision?: string;
  score_mode?: string;
}): {
  status: keyof typeof PRODUCT_LANGUAGE.decision;
  message: string;
  canShip: boolean;
} {
  // Check for diagnostic-only mode first
  if (scan.launch_decision === 'diagnostic_only' || scan.score_mode === 'diagnostic_only') {
    return {
      status: 'diagnostic',
      message: 'This site is outside our ideal target. We checked what we could, but we are not assigning a share-readiness decision.',
      canShip: true,
    };
  }

  const criticalCount = scan.critical_issues_count || 0;
  const warningCount = scan.warning_issues_count || 0;
  const score = scan.launch_score || 0;

  // Blockers present
  if (criticalCount > 0) {
    return {
      status: 'block',
      message: `Found ${criticalCount} critical blocker${criticalCount > 1 ? 's' : ''} preventing launch. Fix these before sharing publicly.`,
      canShip: false,
    };
  }

  // Many warnings or low score
  if (warningCount > 5 || score < 50) {
    return {
      status: 'fix',
      message: `Your site is reachable, but ${warningCount} issue${warningCount > 1 ? 's need' : ' needs'} fixing before you share the link publicly. Focus on share preview and metadata.`,
      canShip: true,
    };
  }

  // Good to go
  return {
    status: 'safe',
    message: `Your site passed ${100 - warningCount}+ checks. Safe to share. Consider fixing remaining items for polish.`,
    canShip: true,
  };
}
