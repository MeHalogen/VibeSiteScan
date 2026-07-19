/**
 * Passive Security Analyzer — Rule Engine
 *
 * Analyzes ONLY what a site already returns to a normal GET request:
 * response headers, Set-Cookie flags, transport (HTTP vs HTTPS), delivered HTML
 * (mixed content, source maps, library versions, exposed LLM surfaces).
 *
 * There is NO active testing here — no crafted payloads, no injection probes,
 * no redirect-follow exploits. Every finding is reproducible with `curl -sI` +
 * viewing source, which keeps false positives low and trust high.
 *
 * Each finding carries an `issueCode` that maps to lib/scanner/issueKnowledgeBase.ts,
 * plus a computed `severity` (some checks are conditional) and `evidence`. The
 * scanner converts these into Issue objects so they feed scoring and coverage.
 */

import { detectVulnerableLibraries } from './vuln-libraries';

export type SecuritySeverity = 'critical' | 'warning' | 'info';
export type SecurityConfidence = 'high' | 'medium' | 'low';

export interface SecurityFinding {
  id: string;
  ruleId: string;
  issueCode: string;
  category: 'security';
  severity: SecuritySeverity;
  confidence: SecurityConfidence;
  title: string;
  pageUrl: string;
  path: string;
  whatFound: string;
  evidence: Record<string, any>;
}

export interface SecurityPageInput {
  url: string;
  finalUrl: string;
  statusCode: number;
  html: string;
  responseHeaders?: Record<string, string>;
  setCookies?: string[];
  redirected?: boolean;
  isHomepage: boolean;
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

let seq = 0;
function mkId(ruleId: string): string {
  seq += 1;
  return `sec_${ruleId}_${seq}`;
}

function finding(
  ruleId: string,
  issueCode: string,
  severity: SecuritySeverity,
  confidence: SecurityConfidence,
  title: string,
  page: SecurityPageInput,
  whatFound: string,
  evidence: Record<string, any>
): SecurityFinding {
  return {
    id: mkId(ruleId),
    ruleId,
    issueCode,
    category: 'security',
    severity,
    confidence,
    title,
    pageUrl: page.finalUrl || page.url,
    path: pathOf(page.finalUrl || page.url),
    whatFound,
    evidence,
  };
}

// ─── Header checks (homepage) ────────────────────────────────────────────────

function checkSecurityHeaders(page: SecurityPageInput): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const h = page.responseHeaders || {};
  const onHttps = isHttps(page.finalUrl || page.url);

  const csp = h['content-security-policy'];
  if (!csp) {
    out.push(
      finding(
        'missing_csp',
        'missing_csp',
        'warning',
        'high',
        'No Content-Security-Policy header',
        page,
        'The response has no Content-Security-Policy header, so the browser applies no restrictions on which scripts, styles, or frames may load.',
        { header: 'content-security-policy', present: false }
      )
    );
  } else if (/unsafe-inline|unsafe-eval/i.test(csp)) {
    out.push(
      finding(
        'weak_csp',
        'weak_csp',
        'info',
        'high',
        'Content-Security-Policy allows unsafe-inline / unsafe-eval',
        page,
        'A CSP is present but weakens itself with unsafe-inline or unsafe-eval, which largely defeats XSS protection.',
        { header: 'content-security-policy', value: csp.slice(0, 300) }
      )
    );
  }

  // HSTS only matters (and is only valid) over HTTPS.
  if (onHttps && !h['strict-transport-security']) {
    out.push(
      finding(
        'missing_hsts',
        'missing_hsts',
        'warning',
        'high',
        'No HTTP Strict-Transport-Security header',
        page,
        'HTTPS is served but no Strict-Transport-Security header is set, so browsers may still attempt insecure HTTP connections.',
        { header: 'strict-transport-security', present: false }
      )
    );
  }

  // Clickjacking protection: X-Frame-Options OR CSP frame-ancestors.
  const hasFrameProtection =
    !!h['x-frame-options'] || (csp ? /frame-ancestors/i.test(csp) : false);
  if (!hasFrameProtection) {
    out.push(
      finding(
        'missing_frame_protection',
        'missing_frame_protection',
        'warning',
        'high',
        'No clickjacking protection (X-Frame-Options / frame-ancestors)',
        page,
        'Neither X-Frame-Options nor a CSP frame-ancestors directive is set, so the page can be embedded in a malicious iframe (clickjacking).',
        { xFrameOptions: h['x-frame-options'] || null, cspFrameAncestors: false }
      )
    );
  }

  if (!h['x-content-type-options']) {
    out.push(
      finding(
        'missing_x_content_type_options',
        'missing_x_content_type_options',
        'info',
        'high',
        'No X-Content-Type-Options header',
        page,
        'Without X-Content-Type-Options: nosniff, browsers may MIME-sniff responses and execute files as an unintended type.',
        { header: 'x-content-type-options', present: false }
      )
    );
  }

  if (!h['referrer-policy']) {
    out.push(
      finding(
        'missing_referrer_policy',
        'missing_referrer_policy',
        'info',
        'high',
        'No Referrer-Policy header',
        page,
        'No Referrer-Policy is set, so full URLs (which may contain sensitive tokens) can leak to third-party sites via the Referer header.',
        { header: 'referrer-policy', present: false }
      )
    );
  }

  if (!h['permissions-policy']) {
    out.push(
      finding(
        'missing_permissions_policy',
        'missing_permissions_policy',
        'info',
        'medium',
        'No Permissions-Policy header',
        page,
        'No Permissions-Policy is set, so the page does not restrict access to powerful browser features (camera, microphone, geolocation) for itself and embedded content.',
        { header: 'permissions-policy', present: false }
      )
    );
  }

  return out;
}

// ─── Cookie flags (homepage) ─────────────────────────────────────────────────

function checkCookies(page: SecurityPageInput): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const cookies = page.setCookies || [];
  const onHttps = isHttps(page.finalUrl || page.url);

  for (const cookie of cookies) {
    const nameMatch = cookie.match(/^\s*([^=]+)=/);
    const name = nameMatch ? nameMatch[1].trim() : 'cookie';
    const lower = cookie.toLowerCase();
    const missing: string[] = [];
    if (onHttps && !/;\s*secure/.test(lower)) missing.push('Secure');
    if (!/;\s*httponly/.test(lower)) missing.push('HttpOnly');
    if (!/;\s*samesite/.test(lower)) missing.push('SameSite');

    if (missing.length > 0) {
      out.push(
        finding(
          'insecure_cookie',
          'insecure_cookie',
          missing.includes('Secure') || missing.includes('HttpOnly') ? 'warning' : 'info',
          'high',
          `Cookie "${name}" is missing ${missing.join(', ')}`,
          page,
          `The cookie "${name}" is set without the ${missing.join(', ')} flag${missing.length > 1 ? 's' : ''}, weakening protection against theft (Secure/HttpOnly) or CSRF (SameSite).`,
          { cookieName: name, missingFlags: missing }
        )
      );
    }
  }

  return out;
}

// ─── Transport (homepage) ────────────────────────────────────────────────────

function checkTransport(page: SecurityPageInput): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  const finalUrl = page.finalUrl || page.url;
  const requestedHttp = !isHttps(page.url);
  const finalHttps = isHttps(finalUrl);

  if (!finalHttps) {
    out.push(
      finding(
        'no_https',
        'http_not_https',
        'critical',
        'high',
        'Site is not served over HTTPS',
        page,
        'The final page URL is served over plain HTTP. All traffic is unencrypted and can be read or modified in transit.',
        { finalUrl, protocol: 'http:' }
      )
    );
  } else if (requestedHttp && !page.redirected) {
    // Requested http, landed on http-less... handled above. If requested http and
    // ended https via redirect, that's good. If requested http and stayed http,
    // no_https already fired. Nothing extra here.
  }

  return out;
}

// ─── Mixed content (all pages) ───────────────────────────────────────────────

function checkMixedContent(page: SecurityPageInput): SecurityFinding[] {
  if (!isHttps(page.finalUrl || page.url) || !page.html) return [];
  const out: SecurityFinding[] = [];

  // http:// subresources referenced from an https page.
  const matches = page.html.match(/(?:src|href)\s*=\s*["']http:\/\/[^"']+["']/gi) || [];
  const insecure = matches
    .map((m) => {
      const u = m.match(/https?:\/\/[^"']+/i);
      return u ? u[0] : null;
    })
    .filter((u): u is string => !!u)
    // Ignore http:// links that are just navigational anchors to other sites in <a href>;
    // focus on subresources. We already limited to src/href; keep a small sample.
    .slice(0, 10);

  if (insecure.length > 0) {
    out.push(
      finding(
        'mixed_content',
        'mixed_content',
        'warning',
        'medium',
        `Mixed content: ${insecure.length} insecure resource${insecure.length === 1 ? '' : 's'} on an HTTPS page`,
        page,
        'This HTTPS page references resources over plain HTTP. Browsers may block them or show a "not secure" warning, and they undermine the page\'s encryption.',
        { insecureUrls: insecure }
      )
    );
  }

  return out;
}

// ─── Exposed source maps (all pages) ─────────────────────────────────────────

function checkSourceMaps(page: SecurityPageInput): SecurityFinding[] {
  if (!page.html) return [];
  const refs = page.html.match(/\/\/[#@]\s*sourceMappingURL=([^\s"']+)/gi) || [];
  if (refs.length === 0) return [];
  return [
    finding(
      'exposed_source_map',
      'exposed_source_map',
      'info',
      'medium',
      'Source maps referenced in production',
      page,
      'The delivered JavaScript references source maps (sourceMappingURL). If those .map files are publicly served, your original source code is exposed.',
      { references: refs.slice(0, 5) }
    ),
  ];
}

// ─── Vulnerable libraries (all pages) ────────────────────────────────────────

function checkLibraries(page: SecurityPageInput): SecurityFinding[] {
  if (!page.html) return [];
  const detected = detectVulnerableLibraries(page.html).filter((d) => d.isVulnerable);
  return detected.map((d) =>
    finding(
      'vulnerable_js_library',
      `vuln_lib_${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      d.severity,
      'medium',
      `Outdated ${d.name} ${d.version} with a known advisory`,
      page,
      `${d.name} ${d.version} is loaded; ${d.risk} Fixed in ${d.fixedIn} (${d.advisory}).`,
      {
        library: d.name,
        version: d.version,
        fixedIn: d.fixedIn,
        advisory: d.advisory,
        risk: d.risk,
      }
    )
  );
}

// ─── Exposed LLM / chat surface (advisory, passive) ──────────────────────────

const LLM_SURFACE_SIGNALS = [
  /api\.openai\.com/i,
  /openai/i,
  /anthropic/i,
  /\bchatbot\b/i,
  /\bchat-widget\b/i,
  /data-chatbot/i,
  /intercom|drift|crisp\.chat/i,
  /dialogflow/i,
  /\bassistant\b.{0,20}\bapi\b/i,
];

function checkLlmSurface(page: SecurityPageInput): SecurityFinding[] {
  if (!page.isHomepage || !page.html) return [];
  const html = page.html;
  const matched = LLM_SURFACE_SIGNALS.filter((re) => re.test(html)).map((re) => re.source);
  if (matched.length === 0) return [];
  return [
    finding(
      'exposed_llm_surface',
      'exposed_llm_surface',
      'info',
      'low',
      'Public AI / chat surface detected',
      page,
      'The page appears to expose an AI assistant or chat widget. Any public LLM surface is a prompt-injection target: harden it before launch (system-prompt guarding, output/tool allow-lists, rate limits). We do not attack it — this is an advisory to review.',
      { signals: matched }
    ),
  ];
}

// ─── Public entrypoint ───────────────────────────────────────────────────────

/**
 * Run all passive security checks. Header/cookie/transport checks run against
 * the homepage; content checks (mixed content, source maps, libraries) run
 * across every successfully-fetched page.
 */
export function analyzeSecurity(pages: SecurityPageInput[]): SecurityFinding[] {
  seq = 0;
  const out: SecurityFinding[] = [];
  const homepage = pages.find((p) => p.isHomepage) || pages[0];

  if (homepage && homepage.statusCode >= 200 && homepage.statusCode < 400) {
    out.push(...checkSecurityHeaders(homepage));
    out.push(...checkCookies(homepage));
    out.push(...checkTransport(homepage));
    out.push(...checkLlmSurface(homepage));
  }

  const seenContent = new Set<string>();
  for (const page of pages) {
    if (page.statusCode < 200 || page.statusCode >= 400 || !page.html) continue;
    for (const f of [
      ...checkMixedContent(page),
      ...checkSourceMaps(page),
      ...checkLibraries(page),
    ]) {
      // Dedupe identical issue codes across pages (report once per site for
      // content-level findings to avoid noise).
      const dedupeKey = `${f.issueCode}:${JSON.stringify(f.evidence.library || f.evidence.insecureUrls || f.evidence.references || f.path)}`;
      if (seenContent.has(dedupeKey)) continue;
      seenContent.add(dedupeKey);
      out.push(f);
    }
  }

  return out;
}
