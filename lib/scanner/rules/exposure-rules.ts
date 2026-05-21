/**
 * Public Exposure Map — Rule Engine
 *
 * Classifies discovered routes by type and risk level.
 * Flags routes that look private but are publicly reachable.
 *
 * This is a deterministic, rules-based check — no AI.
 * Every finding includes evidence: path, status code, matched keywords.
 */

export type RouteType =
  | 'marketing'
  | 'auth'
  | 'dashboard_like'
  | 'admin_like'
  | 'account_like'
  | 'api_like'
  | 'debug_or_test'
  | 'public_page'
  | 'unknown';

export type PublicStatus =
  | 'publicly_reachable'
  | 'redirects_to_login'
  | 'blocked'
  | 'not_found'
  | 'unknown';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface PublicRoute {
  url: string;
  path: string;
  statusCode: number;
  finalUrl?: string;
  routeType: RouteType;
  publicStatus: PublicStatus;
  riskLevel: RiskLevel;
  evidence: {
    matchedKeywords: string[];
    statusCode: number;
    redirectTarget?: string;
    titleSnippet?: string;
    contentSnippet?: string;
  };
}

export interface ExposureFinding {
  id: string;
  ruleId: string;
  category: 'public_exposure';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  whyItMatters: string;
  pageUrl: string;
  path: string;
  evidence: Record<string, any>;
  fixSummary: string;
  fixPrompt: string;
}

// ─── Path keyword lists ───────────────────────────────────────────────────────

const ADMIN_KEYWORDS = [
  'admin', 'administrator', 'manage', 'management', 'cms', 'control-panel',
  'cp', 'backend', 'superuser', 'staff', 'console',
];

const DASHBOARD_KEYWORDS = [
  'dashboard', 'app', 'portal', 'workspace', 'home', 'main', 'overview',
];

const ACCOUNT_KEYWORDS = [
  'account', 'profile', 'settings', 'preferences', 'billing', 'subscription',
  'orders', 'users', 'members',
];

const AUTH_KEYWORDS = [
  'login', 'signin', 'sign-in', 'signup', 'sign-up', 'register', 'registration',
  'auth', 'oauth', 'sso', 'logout', 'signout', 'sign-out', 'forgot-password',
  'reset-password', 'verify', 'confirm',
];

const DEBUG_KEYWORDS = [
  'debug', 'test', 'dev', 'development', 'staging', 'stg', 'qa', 'uat',
  'sandbox', 'demo-admin', 'preview', 'internal', 'private', 'secret',
  'logs', 'log', 'trace', 'error', 'exception',
];

const API_KEYWORDS = [
  'api', 'v1', 'v2', 'v3', 'graphql', 'rest', 'webhook', 'webhooks',
  'endpoint', 'rpc', 'trpc',
];

const DATABASE_KEYWORDS = [
  'database', 'db', 'supabase', 'mongo', 'redis', 'postgres', 'mysql',
  'phpmyadmin', 'pgadmin', 'adminer',
];

const MARKETING_KEYWORDS = [
  'about', 'pricing', 'contact', 'blog', 'docs', 'documentation', 'support',
  'help', 'faq', 'features', 'product', 'solutions', 'team', 'careers',
  'jobs', 'press', 'news', 'legal', 'privacy', 'terms', 'security',
  'changelog', 'roadmap',
];

// ─── Route classification ─────────────────────────────────────────────────────

function getPathSegments(url: string): string[] {
  try {
    const parsed = new URL(url);
    return parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((s) => s.toLowerCase());
  } catch {
    return [];
  }
}

function matchesKeywords(segments: string[], keywords: string[]): string[] {
  const matched: string[] = [];
  for (const seg of segments) {
    for (const kw of keywords) {
      if (seg === kw || seg.startsWith(kw) || seg.endsWith(kw)) {
        matched.push(kw);
      }
    }
  }
  return Array.from(new Set(matched));
}

export function classifyRoute(url: string, statusCode: number, finalUrl?: string): {
  routeType: RouteType;
  publicStatus: PublicStatus;
  riskLevel: RiskLevel;
  matchedKeywords: string[];
} {
  const segments = getPathSegments(url);
  const path = (() => {
    try { return new URL(url).pathname; } catch { return url; }
  })();

  // Determine public status
  let publicStatus: PublicStatus;
  if (statusCode === 404) {
    publicStatus = 'not_found';
  } else if (statusCode === 401 || statusCode === 403) {
    publicStatus = 'blocked';
  } else if (statusCode >= 300 && statusCode < 400) {
    // Redirects — check if redirect target looks like a login page
    const target = finalUrl || '';
    const targetLower = target.toLowerCase();
    const isLoginRedirect = AUTH_KEYWORDS.some((kw) => targetLower.includes(kw));
    publicStatus = isLoginRedirect ? 'redirects_to_login' : 'publicly_reachable';
  } else if (statusCode >= 200 && statusCode < 300) {
    publicStatus = 'publicly_reachable';
  } else {
    publicStatus = 'unknown';
  }

  // Classify route type
  let routeType: RouteType = 'unknown';
  let matchedKeywords: string[] = [];

  const adminMatches = matchesKeywords(segments, [...ADMIN_KEYWORDS, ...DATABASE_KEYWORDS]);
  const dashboardMatches = matchesKeywords(segments, DASHBOARD_KEYWORDS);
  const accountMatches = matchesKeywords(segments, ACCOUNT_KEYWORDS);
  const authMatches = matchesKeywords(segments, AUTH_KEYWORDS);
  const debugMatches = matchesKeywords(segments, DEBUG_KEYWORDS);
  const apiMatches = matchesKeywords(segments, API_KEYWORDS);
  const marketingMatches = matchesKeywords(segments, MARKETING_KEYWORDS);

  if (adminMatches.length > 0) {
    routeType = 'admin_like';
    matchedKeywords = adminMatches;
  } else if (debugMatches.length > 0) {
    routeType = 'debug_or_test';
    matchedKeywords = debugMatches;
  } else if (accountMatches.length > 0) {
    routeType = 'account_like';
    matchedKeywords = accountMatches;
  } else if (dashboardMatches.length > 0) {
    routeType = 'dashboard_like';
    matchedKeywords = dashboardMatches;
  } else if (authMatches.length > 0) {
    routeType = 'auth';
    matchedKeywords = authMatches;
  } else if (apiMatches.length > 0) {
    routeType = 'api_like';
    matchedKeywords = apiMatches;
  } else if (path === '/' || marketingMatches.length > 0) {
    routeType = 'marketing';
    matchedKeywords = marketingMatches;
  } else if (statusCode >= 200 && statusCode < 300) {
    routeType = 'public_page';
  }

  // Determine risk level
  let riskLevel: RiskLevel = 'low';

  if (publicStatus === 'publicly_reachable') {
    if (routeType === 'admin_like') {
      riskLevel = 'high';
    } else if (routeType === 'debug_or_test') {
      riskLevel = 'high';
    } else if (routeType === 'dashboard_like') {
      riskLevel = 'medium';
    } else if (routeType === 'account_like') {
      riskLevel = 'medium';
    } else if (routeType === 'api_like') {
      riskLevel = 'medium';
    }
  }

  return { routeType, publicStatus, riskLevel, matchedKeywords };
}

// ─── Build public route list ──────────────────────────────────────────────────

export function buildPublicRouteMap(
  pages: Array<{
    url: string;
    statusCode: number;
    finalUrl?: string;
    seo?: { title?: string };
    html?: string;
  }>
): PublicRoute[] {
  return pages.map((page) => {
    const { routeType, publicStatus, riskLevel, matchedKeywords } = classifyRoute(
      page.url,
      page.statusCode,
      page.finalUrl
    );

    const path = (() => {
      try { return new URL(page.url).pathname; } catch { return page.url; }
    })();

    // Grab a short content snippet for evidence
    const contentSnippet = page.html
      ? page.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      : undefined;

    return {
      url: page.url,
      path,
      statusCode: page.statusCode,
      finalUrl: page.finalUrl,
      routeType,
      publicStatus,
      riskLevel,
      evidence: {
        matchedKeywords,
        statusCode: page.statusCode,
        redirectTarget: page.finalUrl !== page.url ? page.finalUrl : undefined,
        titleSnippet: (page.seo as any)?.title?.slice(0, 80),
        contentSnippet,
      },
    };
  });
}

// ─── Generate exposure findings ───────────────────────────────────────────────

export function generateExposureFindings(routes: PublicRoute[]): ExposureFinding[] {
  const findings: ExposureFinding[] = [];

  for (const route of routes) {
    if (route.publicStatus !== 'publicly_reachable') continue;

    if (route.routeType === 'admin_like') {
      findings.push({
        id: `exposure_admin_${route.path}`,
        ruleId: 'admin_route_publicly_reachable',
        category: 'public_exposure',
        severity: 'critical',
        title: `Admin-like route is publicly reachable`,
        description: `The route ${route.path} matches admin/management path patterns and returned a ${route.statusCode} response without an auth redirect. Review before sharing.`,
        whyItMatters:
          'Admin routes expose internal management interfaces. If this is not protected by authentication, data or settings may be accessible to anyone.',
        pageUrl: route.url,
        path: route.path,
        evidence: route.evidence,
        fixSummary: `Add authentication guard to ${route.path}. Redirect unauthenticated users to /login.`,
        fixPrompt: `Review the route "${route.path}". It appears publicly reachable without an auth check. If this page is intended for logged-in users, add an auth guard so logged-out visitors are redirected to /login. Do not change the admin UI. Verify by opening ${route.url} in an incognito window — you should be redirected to login.`,
      });
    } else if (route.routeType === 'debug_or_test') {
      findings.push({
        id: `exposure_debug_${route.path}`,
        ruleId: 'debug_route_publicly_reachable',
        category: 'public_exposure',
        severity: 'critical',
        title: `Debug/test route is publicly reachable`,
        description: `The route ${route.path} looks like a development or test page and is publicly accessible (HTTP ${route.statusCode}).`,
        whyItMatters:
          'Debug and staging routes can expose internal state, stack traces, or testing data to the public internet.',
        pageUrl: route.url,
        path: route.path,
        evidence: route.evidence,
        fixSummary: `Remove or restrict ${route.path} before sharing. Add auth protection or delete it entirely.`,
        fixPrompt: `The route "${route.path}" appears to be a debug or test page and is publicly reachable. Either remove this route entirely or restrict it with authentication. Do not ship debug endpoints to production.`,
      });
    } else if (route.routeType === 'dashboard_like') {
      findings.push({
        id: `exposure_dashboard_${route.path}`,
        ruleId: 'dashboard_publicly_reachable',
        category: 'public_exposure',
        severity: 'warning',
        title: `Dashboard-like route is publicly reachable`,
        description: `The route ${route.path} looks like an app dashboard or private area and returned HTTP ${route.statusCode} without redirecting to login.`,
        whyItMatters:
          'If this is a private app area, it should redirect unauthenticated visitors to the login page, not show content.',
        pageUrl: route.url,
        path: route.path,
        evidence: route.evidence,
        fixSummary: `If ${route.path} requires login, add an auth guard. Test in incognito to verify.`,
        fixPrompt: `Review the route "${route.path}". It looks like a private dashboard but is publicly reachable. If this is behind authentication, verify your auth middleware is working. Test by opening ${route.url} in incognito mode — you should see a login redirect, not the dashboard.`,
      });
    } else if (route.routeType === 'account_like') {
      findings.push({
        id: `exposure_account_${route.path}`,
        ruleId: 'account_route_publicly_reachable',
        category: 'public_exposure',
        severity: 'warning',
        title: `Account/settings route is publicly reachable`,
        description: `The route ${route.path} looks like a private account or settings page and returned HTTP ${route.statusCode}.`,
        whyItMatters:
          'Account and settings routes should require authentication. A publicly accessible settings page could expose user data.',
        pageUrl: route.url,
        path: route.path,
        evidence: route.evidence,
        fixSummary: `Verify ${route.path} redirects to login for unauthenticated visitors.`,
        fixPrompt: `The route "${route.path}" appears to be an account or settings page and is publicly reachable. Add authentication middleware so unauthenticated users are redirected to /login. Test in an incognito window.`,
      });
    } else if (route.routeType === 'api_like') {
      findings.push({
        id: `exposure_api_${route.path}`,
        ruleId: 'api_route_publicly_reachable',
        category: 'public_exposure',
        severity: 'warning',
        title: `API-like route is publicly reachable`,
        description: `The route ${route.path} looks like an API endpoint and returned HTTP ${route.statusCode} with accessible content.`,
        whyItMatters:
          'Public API routes may expose data or actions without authentication. This may be intentional for public APIs, but verify access rules.',
        pageUrl: route.url,
        path: route.path,
        evidence: route.evidence,
        fixSummary: `Review ${route.path}. If it exposes private data, add authentication or rate limiting.`,
        fixPrompt: `The route "${route.path}" looks like an API endpoint and is publicly reachable. Review what data it returns. If it exposes private user data or actions that should require auth, add authentication. This may be intentional for a public API — verify your access rules are correct.`,
      });
    }
  }

  return findings;
}
