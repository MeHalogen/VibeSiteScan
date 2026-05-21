/**
 * URL Normalizer & Safety Validator
 *
 * Two jobs:
 * 1. normalizeUrl — clean and standardize user-supplied URLs
 * 2. isPrivateOrLocal / isSafeUrl — SSRF protection
 */

// Tracking params that should be stripped
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'gad_source', 'msclkid', '_ga', '_gl',
]);

// Private IPv4 pattern guards
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^169\.254\./,
];

const BLOCKED_IPS = new Set(['169.254.169.254', '100.100.100.200']);
const BLOCKED_HOSTNAMES = new Set(['localhost', 'localdomain']);

function looksLikeIPv4(h: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
}
function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((p) => p.test(ip));
}
function isIPv6Private(h: string): boolean {
  const lower = h.replace(/[\[\]]/g, '');
  return lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd');
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Please enter a URL.');

  // Add https:// if no protocol
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(withProtocol)) {
      throw new Error('Only http:// and https:// URLs are supported.');
    }
    withProtocol = 'https://' + withProtocol;
  }

  let url: URL;
  try { url = new URL(withProtocol); } catch {
    throw new Error(`"${trimmed}" is not a valid URL. Please check it and try again.`);
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http:// and https:// URLs are supported.');
  }

  // Strip tracking params
  const cleaned = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) cleaned.set(key, value);
  });
  url.search = cleaned.toString() ? `?${cleaned.toString()}` : '';
  url.hash = '';

  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.toString();
}

export function isPrivateOrLocal(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  if (lower.endsWith('.local') || lower.endsWith('.internal')) return true;
  if (BLOCKED_IPS.has(lower)) return true;
  if (looksLikeIPv4(lower) && isPrivateIPv4(lower)) return true;
  if (lower.includes(':') && isIPv6Private(lower)) return true;
  return false;
}

export function isSameOrigin(baseUrl: string, targetUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    const target = new URL(targetUrl);
    return base.hostname === target.hostname;
  } catch {
    return false;
  }
}

/** Common route probes used during discovery */
export const COMMON_ROUTE_PROBES = [
  '/about', '/pricing', '/contact', '/login', '/signin', '/signup',
  '/register', '/dashboard', '/admin', '/settings', '/account',
  '/profile', '/privacy', '/terms', '/blog', '/docs', '/api',
  '/debug', '/test', '/dev', '/staging',
];
