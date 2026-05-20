/**
 * Route Classification & Hash Anchor Handling
 * 
 * AI-built single-page apps often use hash routes (#features, #pricing)
 * These should not be counted as separate full pages unless explicitly enabled.
 */

export interface RouteInfo {
  url: string;
  normalizedUrl: string;
  type: 'page' | 'hash-anchor' | 'external' | 'skipped';
  baseUrl: string;
  hash: string | null;
  isHomepage: boolean;
  status?: number;
  sourceUrl?: string;
  anchorText?: string;
  reason?: string;
}

/**
 * Classify a URL as page, hash anchor, external, etc.
 */
export function classifyRoute(url: string, baseUrl: string): RouteInfo {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    
    const isSameDomain = urlObj.hostname === baseUrlObj.hostname;
    const isHomepage = urlObj.pathname === '/' && !urlObj.hash;
    const hash = urlObj.hash || null;
    
    // External link
    if (!isSameDomain) {
      return {
        url,
        normalizedUrl: url,
        type: 'external',
        baseUrl,
        hash,
        isHomepage: false,
      };
    }

    // Same domain, no hash = regular page
    if (!hash) {
      return {
        url,
        normalizedUrl: url,
        type: 'page',
        baseUrl,
        hash,
        isHomepage,
      };
    }

    // Same domain with hash = might be hash anchor or client-side route
    const withoutHash = urlObj.origin + urlObj.pathname + urlObj.search;
    
    return {
      url,
      normalizedUrl: withoutHash, // normalized version without hash
      type: 'hash-anchor',
      baseUrl,
      hash,
      isHomepage: withoutHash === baseUrlObj.origin + '/',
    };
  } catch (error) {
    return {
      url,
      normalizedUrl: url,
      type: 'skipped',
      baseUrl,
      hash: null,
      isHomepage: false,
      reason: 'Invalid URL',
    };
  }
}

/**
 * Deduplicate routes considering hash anchors
 */
export function deduplicateRoutes(routes: RouteInfo[]): {
  uniquePages: RouteInfo[];
  hashAnchors: RouteInfo[];
  duplicates: RouteInfo[];
} {
  const uniquePages: RouteInfo[] = [];
  const hashAnchors: RouteInfo[] = [];
  const duplicates: RouteInfo[] = [];
  const seen = new Set<string>();

  for (const route of routes) {
    if (route.type === 'hash-anchor') {
      hashAnchors.push(route);
      continue;
    }

    const key = route.normalizedUrl;
    if (seen.has(key)) {
      duplicates.push(route);
    } else {
      seen.add(key);
      uniquePages.push(route);
    }
  }

  return { uniquePages, hashAnchors, duplicates };
}

/**
 * Get route statistics for reporting
 */
export function getRouteStats(routes: RouteInfo[]): {
  totalRoutes: number;
  uniquePages: number;
  hashAnchors: number;
  external: number;
  skipped: number;
  duplicates: number;
  warning?: string;
} {
  const { uniquePages, hashAnchors, duplicates } = deduplicateRoutes(routes);
  
  const external = routes.filter(r => r.type === 'external').length;
  const skipped = routes.filter(r => r.type === 'skipped').length;

  let warning: string | undefined;
  
  if (hashAnchors.length > 0) {
    warning = `${hashAnchors.length} hash anchor${hashAnchors.length > 1 ? 's' : ''} discovered (${hashAnchors.map(h => h.hash).join(', ')}). These may not represent separate HTML pages.`;
  }

  return {
    totalRoutes: routes.length,
    uniquePages: uniquePages.length,
    hashAnchors: hashAnchors.length,
    external,
    skipped,
    duplicates: duplicates.length,
    warning,
  };
}

/**
 * Format route for display
 */
export function formatRouteDisplay(route: RouteInfo): {
  display: string;
  badge?: string;
  description?: string;
} {
  const badges: Record<string, string> = {
    'page': '📄',
    'hash-anchor': '#️⃣',
    'external': '🔗',
    'skipped': '⊘',
  };

  const descriptions: Record<string, string> = {
    'page': 'HTML page',
    'hash-anchor': 'Same-page anchor',
    'external': 'External link',
    'skipped': 'Skipped or invalid',
  };

  return {
    display: route.hash ? `${route.normalizedUrl}${route.hash}` : route.normalizedUrl,
    badge: badges[route.type],
    description: descriptions[route.type],
  };
}

/**
 * Detect duplicate metadata across routes
 */
export function detectDuplicateMetadata(pages: Array<{
  url: string;
  title?: string;
  metaDescription?: string;
  h1?: string;
}>): {
  duplicateTitles: Map<string, string[]>;
  duplicateDescriptions: Map<string, string[]>;
  duplicateH1s: Map<string, string[]>;
  hasDuplicates: boolean;
} {
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();
  const h1Map = new Map<string, string[]>();

  for (const page of pages) {
    if (page.title) {
      const urls = titleMap.get(page.title) || [];
      urls.push(page.url);
      titleMap.set(page.title, urls);
    }

    if (page.metaDescription) {
      const urls = descMap.get(page.metaDescription) || [];
      urls.push(page.url);
      descMap.set(page.metaDescription, urls);
    }

    if (page.h1) {
      const urls = h1Map.get(page.h1) || [];
      urls.push(page.url);
      h1Map.set(page.h1, urls);
    }
  }

  // Filter to only duplicates (more than 1 page)
  const duplicateTitles = new Map(
    Array.from(titleMap.entries()).filter(([_, urls]) => urls.length > 1)
  );
  const duplicateDescriptions = new Map(
    Array.from(descMap.entries()).filter(([_, urls]) => urls.length > 1)
  );
  const duplicateH1s = new Map(
    Array.from(h1Map.entries()).filter(([_, urls]) => urls.length > 1)
  );

  return {
    duplicateTitles,
    duplicateDescriptions,
    duplicateH1s,
    hasDuplicates: duplicateTitles.size > 0 || duplicateDescriptions.size > 0 || duplicateH1s.size > 0,
  };
}
