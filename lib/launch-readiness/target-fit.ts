/**
 * Target Fit Detection
 * 
 * Determines whether the scanned website is an ideal fit for LaunchScan's
 * launch hygiene scoring model.
 */

import { TargetFit, TargetFitDetection } from './types';

const ENTERPRISE_DOMAINS = [
  'apple.com',
  'microsoft.com',
  'google.com',
  'amazon.com',
  'facebook.com',
  'meta.com',
  'netflix.com',
  'adobe.com',
  'oracle.com',
  'salesforce.com',
  'ibm.com',
  'intel.com',
  'cisco.com',
  'hp.com',
  'dell.com',
  'sap.com',
  'walmart.com',
  'target.com',
  'nike.com',
  'tesla.com',
  'toyota.com',
  'ford.com',
  'chevrolet.com',
  'bmw.com',
  'mercedes-benz.com',
  'cnn.com',
  'bbc.com',
  'nytimes.com',
  'forbes.com',
  'bloomberg.com',
];

export function detectTargetFit(scanResult: any): TargetFitDetection {
  const signals = {
    isEnterpriseDomain: isEnterpriseDomain(scanResult.target_url),
    hasHighBlockageRate: calculateBlockageRate(scanResult) > 0.3,
    hasBotProtection: detectBotProtection(scanResult),
    hasLowCrawlability: scanResult.skipped_pages_count > (scanResult.pages_count * 0.5),
    hasLowCoverage: false, // Will be calculated by coverage system
    pageCount: scanResult.pages_count || 0,
    blockedRequestCount: scanResult.blocked_requests_count || 0,
    skippedCheckCount: scanResult.skipped_checks_count || 0,
  };

  // Determine target fit
  let targetFit: TargetFit;
  let reason: string;

  // Limited fit signals
  if (signals.isEnterpriseDomain) {
    targetFit = 'limited';
    reason = 'Large enterprise website detected. LaunchScan is optimized for AI-built sites, MVPs, landing pages, and portfolios.';
  } else if (signals.hasBotProtection) {
    targetFit = 'limited';
    reason = 'Bot protection or access restrictions detected. LaunchScan could not reliably capture all checks.';
  } else if (signals.hasHighBlockageRate) {
    targetFit = 'limited';
    reason = 'Many requests were blocked or failed. This reduces scan reliability.';
  } else if (signals.hasLowCrawlability && signals.pageCount > 10) {
    targetFit = 'limited';
    reason = 'Large site with many skipped pages. Coverage is limited.';
  }
  // Ideal fit signals
  else if (isAIBuiltSignal(scanResult.target_url)) {
    targetFit = 'ideal';
    reason = 'AI-built or fast-deployed site. Perfect fit for LaunchScan launch hygiene checks.';
  } else if (signals.pageCount <= 25 && !signals.hasHighBlockageRate) {
    targetFit = 'ideal';
    reason = 'Small public website. Good fit for LaunchScan launch hygiene checks.';
  }
  // Acceptable fit
  else {
    targetFit = 'acceptable';
    reason = 'Normal business website. LaunchScan can verify most launch hygiene checks.';
  }

  return {
    targetFit,
    reason,
    signals,
  };
}

function isEnterpriseDomain(url: string): boolean {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return ENTERPRISE_DOMAINS.some(ed => domain.includes(ed));
  } catch {
    return false;
  }
}

function isAIBuiltSignal(url: string): boolean {
  const aiPlatformSignals = [
    'vercel.app',
    'netlify.app',
    'replit.app',
    'repl.co',
    'lovable.app',
    'bolt.new',
    'cursor.sh',
    'railway.app',
    'render.com',
    'fly.dev',
  ];
  
  try {
    const hostname = new URL(url).hostname;
    return aiPlatformSignals.some(signal => hostname.includes(signal));
  } catch {
    return false;
  }
}

function calculateBlockageRate(scanResult: any): number {
  const total = (scanResult.internal_links_count || 0) + (scanResult.external_links_count || 0);
  const blocked = scanResult.blocked_requests_count || 0;
  return total > 0 ? blocked / total : 0;
}

function detectBotProtection(scanResult: any): boolean {
  // Check for bot protection signals in issues or metadata
  const botSignals = [
    'cloudflare',
    'captcha',
    'bot-protection',
    'access-denied',
    '403',
    'forbidden',
  ];
  
  const issues = scanResult.issues || [];
  return issues.some((issue: any) => 
    botSignals.some(signal => 
      issue.message?.toLowerCase().includes(signal)
    )
  );
}
