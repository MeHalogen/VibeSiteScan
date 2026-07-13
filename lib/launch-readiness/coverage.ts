/**
 * Scan Coverage Calculator
 * 
 * Calculates what percentage of the intended checklist VibeSiteScan could actually verify.
 */

import { CoverageDetails, CoverageCategory } from './types';

export function calculateCoverage(scanResult: any): CoverageDetails {
  const categories: CoverageCategory[] = [
    assessTargetAccessibility(scanResult),
    assessHttpsAndStatus(scanResult),
    assessRouteDiscovery(scanResult),
    assessInternalLinks(scanResult),
    assessExternalLinks(scanResult),
    assessMetadata(scanResult),
    assessSharePreviews(scanResult),
    assessIndexing(scanResult),
    assessForms(scanResult),
    assessImages(scanResult),
    assessBrowserDiagnostics(scanResult),
    assessSitemapRobots(scanResult),
    assessSecurityHeaders(scanResult),
    assessPerformanceBudget(scanResult),
  ];

  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  const verifiedWeight = categories
    .filter(cat => cat.status === 'verified' || cat.status === 'partial')
    .reduce((sum, cat) => sum + (cat.status === 'verified' ? cat.weight : cat.weight * 0.5), 0);

  const coveragePercentage = Math.round((verifiedWeight / totalWeight) * 100);

  const verifiedCount = categories.filter(c => c.status === 'verified').length;
  const partialCount = categories.filter(c => c.status === 'partial').length;
  const skippedCount = categories.filter(c => c.status === 'skipped').length;
  const notCapturedCount = categories.filter(c => c.status === 'not_captured').length;

  let summary = `Verified ${verifiedCount} of ${categories.length} check categories`;
  if (partialCount > 0) summary += `, ${partialCount} partial`;
  if (skippedCount > 0) summary += `, ${skippedCount} skipped`;
  if (notCapturedCount > 0) summary += `, ${notCapturedCount} not captured`;

  return {
    categories,
    totalWeight,
    verifiedWeight,
    coveragePercentage,
    summary,
  };
}

// The scanner produces camelCase PageData (crawlDepth, statusCode, finalUrl,
// seo). Always read those real fields — never invented snake_case names.
function getHomepage(scanResult: any): any | undefined {
  const pages = scanResult.pages || [];
  return pages.find((p: any) => p.crawlDepth === 0) || pages[0];
}

function assessTargetAccessibility(scanResult: any): CoverageCategory {
  const homepage = getHomepage(scanResult);
  const status = homepage?.statusCode;
  if (!homepage || !status) {
    return {
      name: 'Target Accessibility',
      status: 'not_captured',
      weight: 10,
      reason: 'Could not access homepage',
      evidenceCount: 0,
    };
  }

  if (status >= 200 && status < 300) {
    return {
      name: 'Target Accessibility',
      status: 'verified',
      weight: 10,
      evidenceCount: 1,
    };
  }

  return {
    name: 'Target Accessibility',
    status: 'failed',
    weight: 10,
    reason: `Homepage returned ${status}`,
    evidenceCount: 1,
  };
}

function assessHttpsAndStatus(scanResult: any): CoverageCategory {
  const homepage = getHomepage(scanResult);
  const finalUrl: string = homepage?.finalUrl || homepage?.url || '';
  if (!homepage || !finalUrl) {
    return {
      name: 'HTTPS & Status Checks',
      status: 'not_captured',
      weight: 8,
      reason: 'Homepage did not respond',
      evidenceCount: 0,
    };
  }

  // Actually verify HTTPS rather than assuming it.
  const isHttps = finalUrl.startsWith('https://');
  if (isHttps) {
    return {
      name: 'HTTPS & Status Checks',
      status: 'verified',
      weight: 8,
      evidenceCount: 1,
    };
  }

  return {
    name: 'HTTPS & Status Checks',
    status: 'failed',
    weight: 8,
    reason: 'Site is not served over HTTPS',
    evidenceCount: 1,
  };
}

function assessRouteDiscovery(scanResult: any): CoverageCategory {
  if ((scanResult.discovered_pages_count || 0) > 0) {
    return {
      name: 'Route Discovery',
      status: 'verified',
      weight: 7,
      evidenceCount: scanResult.discovered_pages_count,
    };
  }
  
  return {
    name: 'Route Discovery',
    status: 'partial',
    weight: 7,
    reason: 'No routes discovered beyond homepage',
    evidenceCount: 0,
  };
}

function assessInternalLinks(scanResult: any): CoverageCategory {
  if ((scanResult.internal_links_count || 0) > 0) {
    return {
      name: 'Internal Link Checks',
      status: 'verified',
      weight: 9,
      evidenceCount: scanResult.internal_links_count,
    };
  }
  
  return {
    name: 'Internal Link Checks',
    status: 'not_captured',
    weight: 9,
    reason: 'No internal links found',
    evidenceCount: 0,
  };
}

function assessExternalLinks(scanResult: any): CoverageCategory {
  if (scanResult.scan_depth === 'quick') {
    return {
      name: 'External Link Checks',
      status: 'skipped',
      weight: 5,
      reason: 'Skipped in quick scan mode',
      evidenceCount: 0,
    };
  }
  
  if ((scanResult.external_links_count || 0) > 0) {
    return {
      name: 'External Link Checks',
      status: 'verified',
      weight: 5,
      evidenceCount: scanResult.external_links_count,
    };
  }
  
  return {
    name: 'External Link Checks',
    status: 'not_captured',
    weight: 5,
    reason: 'No external links found',
    evidenceCount: 0,
  };
}

function assessMetadata(scanResult: any): CoverageCategory {
  const pages = scanResult.pages || [];
  // Metadata was captured whenever we successfully parsed a page's SEO data —
  // i.e. we have the HTML and a seo object for at least one reachable page.
  const metadataCount = pages.filter(
    (p: any) => p.seo && p.html && p.statusCode >= 200 && p.statusCode < 400
  ).length;

  if (metadataCount > 0) {
    return {
      name: 'Metadata Checks',
      status: 'verified',
      weight: 10,
      evidenceCount: metadataCount,
    };
  }

  return {
    name: 'Metadata Checks',
    status: 'not_captured',
    weight: 10,
    reason: 'No page HTML could be parsed',
    evidenceCount: 0,
  };
}

function assessSharePreviews(scanResult: any): CoverageCategory {
  // Verified whenever we parsed the page and could therefore inspect OG/Twitter
  // tags — presence or absence of the tags is the finding, not the coverage.
  const inspected = (scanResult.pages || []).filter(
    (p: any) => p.seo && p.html && p.statusCode >= 200 && p.statusCode < 400
  );
  const withOg = inspected.filter(
    (p: any) => p.seo?.ogTitle || p.seo?.ogImage || p.seo?.twitterCard
  ).length;

  if (inspected.length > 0) {
    return {
      name: 'Share Preview Checks',
      status: 'verified',
      weight: 8,
      evidenceCount: withOg,
    };
  }

  return {
    name: 'Share Preview Checks',
    status: 'not_captured',
    weight: 8,
    reason: 'No page HTML could be parsed',
    evidenceCount: 0,
  };
}

function assessIndexing(scanResult: any): CoverageCategory {
  // Indexing is genuinely verified only if we actually resolved robots/sitemap
  // state AND parsed at least one page (to read noindex/canonical meta).
  const robotsChecked = scanResult.robots_found !== undefined;
  const sitemapChecked = scanResult.sitemap_found !== undefined;
  const parsedPage = (scanResult.pages || []).some(
    (p: any) => p.seo && p.statusCode >= 200 && p.statusCode < 400
  );

  if ((robotsChecked || sitemapChecked) && parsedPage) {
    const evidence =
      (robotsChecked ? 1 : 0) + (sitemapChecked ? 1 : 0) + (parsedPage ? 1 : 0);
    return {
      name: 'Indexing Checks',
      status: 'verified',
      weight: 7,
      evidenceCount: evidence,
    };
  }

  return {
    name: 'Indexing Checks',
    status: 'partial',
    weight: 7,
    reason: 'Some indexing signals could not be resolved',
    evidenceCount: (robotsChecked ? 1 : 0) + (sitemapChecked ? 1 : 0),
  };
}

function assessForms(scanResult: any): CoverageCategory {
  if ((scanResult.forms_found_count || 0) > 0) {
    return {
      name: 'Form Structure Checks',
      status: 'verified',
      weight: 6,
      evidenceCount: scanResult.forms_found_count,
    };
  }
  
  return {
    name: 'Form Structure Checks',
    status: 'not_captured',
    weight: 6,
    reason: 'No forms found',
    evidenceCount: 0,
  };
}

function assessImages(scanResult: any): CoverageCategory {
  // Verified when we actually inspected images on a parsed page (we capture
  // imageCount + imgMissingAlt per page in seo). Absence of issues != no check.
  const inspected = (scanResult.pages || []).filter(
    (p: any) => p.seo && p.statusCode >= 200 && p.statusCode < 400
  );
  const totalImages = inspected.reduce(
    (sum: number, p: any) => sum + (p.seo?.imageCount || 0),
    0
  );

  if (inspected.length > 0) {
    return {
      name: 'Image & Accessibility Basics',
      status: 'verified',
      weight: 5,
      evidenceCount: totalImages,
    };
  }

  return {
    name: 'Image & Accessibility Basics',
    status: 'not_captured',
    weight: 5,
    reason: 'No page HTML could be parsed',
    evidenceCount: 0,
  };
}

function assessBrowserDiagnostics(scanResult: any): CoverageCategory {
  const browserStatus = scanResult.browser_checks_status || 'not_available';
  
  if (browserStatus === 'completed') {
    return {
      name: 'Browser Diagnostics',
      status: 'verified',
      weight: 8,
      evidenceCount: 1,
    };
  }
  
  if (browserStatus === 'skipped') {
    return {
      name: 'Browser Diagnostics',
      status: 'skipped',
      weight: 8,
      reason: 'Browser checks not available in this environment',
      evidenceCount: 0,
    };
  }
  
  return {
    name: 'Browser Diagnostics',
    status: 'not_captured',
    weight: 8,
    reason: 'Browser checks failed or blocked',
    evidenceCount: 0,
  };
}

function assessSitemapRobots(scanResult: any): CoverageCategory {
  const hasSitemap = scanResult.sitemap_found;
  const hasRobots = scanResult.robots_found;
  
  if (hasSitemap !== undefined || hasRobots !== undefined) {
    return {
      name: 'Sitemap & Robots Checks',
      status: 'verified',
      weight: 7,
      evidenceCount: (hasSitemap ? 1 : 0) + (hasRobots ? 1 : 0),
    };
  }
  
  return {
    name: 'Sitemap & Robots Checks',
    status: 'partial',
    weight: 7,
    reason: 'Checked default locations',
    evidenceCount: 0,
  };
}

function assessSecurityHeaders(scanResult: any): CoverageCategory {
  // Verified when we actually captured response headers from the homepage;
  // that means every passive security check could run.
  if (scanResult.security_headers_captured) {
    return {
      name: 'Security Headers & Transport',
      status: 'verified',
      weight: 12,
      evidenceCount: scanResult.security_findings_count ?? 0,
    };
  }

  return {
    name: 'Security Headers & Transport',
    status: 'not_captured',
    weight: 12,
    reason: 'Could not read response headers (homepage unreachable)',
    evidenceCount: 0,
  };
}

function assessPerformanceBudget(scanResult: any): CoverageCategory {
  // Verified whenever the homepage responded — TTFB and payload are always
  // measurable from the scan fetch.
  if (scanResult.homepage_ttfb_ms != null) {
    return {
      name: 'Performance Signals',
      status: 'verified',
      weight: 8,
      evidenceCount: scanResult.performance_findings_count ?? 0,
    };
  }

  return {
    name: 'Performance Signals',
    status: 'not_captured',
    weight: 8,
    reason: 'Homepage did not respond',
    evidenceCount: 0,
  };
}
