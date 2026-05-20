export function normalizeUrl(input: string): string {
  try {
    if (!/^https?:\/\//i.test(input)) {
      input = 'https://' + input;
    }
    const url = new URL(input);
    // Remove trailing slash except for root
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }
    url.hash = '';
    return url.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

export function isPrivateOrLocal(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1') return true;
  if (lower.startsWith('10.')) return true;
  if (lower.startsWith('192.168.')) return true;
  if (lower.startsWith('172.16.') || lower.startsWith('172.17.')) return true;
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
