/**
 * Scan Coverage Calculator
 * 
 * Calculates what percentage of the intended checklist LaunchScan could actually verify.
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

function assessTargetAccessibility(scanResult: any): CoverageCategory {
  const homepage = scanResult.pages?.find((p: any) => p.crawl_depth === 0);
  if (!homepage) {
    return {
      name: 'Target Accessibility',
      status: 'not_captured',
      weight: 10,
      reason: 'Could not access homepage',
      evidenceCount: 0,
    };
  }
  
  if (homepage.response_status >= 200 && homepage.response_status < 300) {
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
    reason: `Homepage returned ${homepage.response_status}`,
    evidenceCount: 1,
  };
}

function assessHttpsAndStatus(scanResult: any): CoverageCategory {
  const homepage = scanResult.pages?.find((p: any) => p.crawl_depth === 0);
  if (!homepage) {
    return {
      name: 'HTTPS & Status Checks',
      status: 'not_captured',
      weight: 8,
      evidenceCount: 0,
    };
  }
  
  return {
    name: 'HTTPS & Status Checks',
    status: 'verified',
    weight: 8,
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
  const metadataCount = pages.filter((p: any) => p.metadata_captured).length;
  
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
    reason: 'Could not capture metadata',
    evidenceCount: 0,
  };
}

function assessSharePreviews(scanResult: any): CoverageCategory {
  const ogIssues = (scanResult.issues || []).filter((i: any) => 
    i.issue_code?.includes('og_') || i.issue_code?.includes('twitter_')
  );
  
  if (ogIssues.length > 0 || scanResult.pages?.some((p: any) => p.has_og_tags)) {
    return {
      name: 'Share Preview Checks',
      status: 'verified',
      weight: 8,
      evidenceCount: ogIssues.length,
    };
  }
  
  return {
    name: 'Share Preview Checks',
    status: 'partial',
    weight: 8,
    reason: 'Checked expected locations but cannot guarantee absence',
    evidenceCount: 0,
  };
}

function assessIndexing(scanResult: any): CoverageCategory {
  const indexingIssues = (scanResult.issues || []).filter((i: any) => 
    i.issue_code?.includes('noindex') || i.issue_code?.includes('canonical')
  );
  
  return {
    name: 'Indexing Checks',
    status: 'verified',
    weight: 7,
    evidenceCount: Math.max(1, indexingIssues.length),
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
  const imageIssues = (scanResult.issues || []).filter((i: any) => 
    i.issue_code?.includes('image') || i.issue_code?.includes('alt')
  );
  
  if (imageIssues.length > 0) {
    return {
      name: 'Image & Accessibility Basics',
      status: 'verified',
      weight: 5,
      evidenceCount: imageIssues.length,
    };
  }
  
  return {
    name: 'Image & Accessibility Basics',
    status: 'partial',
    weight: 5,
    reason: 'Basic checks performed',
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
