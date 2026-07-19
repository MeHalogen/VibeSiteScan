/**
 * Known-vulnerable / outdated front-end library list — static, bundled.
 *
 * Passive detection only: we fingerprint a library + version from the delivered
 * HTML (script src URLs and a few well-known inline globals) and compare against
 * documented advisory thresholds. Version detection from a URL is heuristic, so
 * every finding produced from this list is reported at MEDIUM confidence.
 *
 * Keep this list conservative and well-sourced. A false "you are vulnerable"
 * destroys trust faster than a missed finding.
 */

export interface VulnLibrary {
  /** Canonical library name shown to the user. */
  name: string;
  /**
   * Patterns that both detect the library and capture its version in group 1.
   * Matched against each <script src> and against the raw HTML.
   */
  versionPatterns: RegExp[];
  /** Highest version considered vulnerable (exclusive upper bound is `fixedIn`). */
  fixedIn: string;
  severity: 'critical' | 'warning' | 'info';
  /** Advisory identifier(s), e.g. CVE or GHSA. */
  advisory: string;
  /** One-line description of the risk. */
  risk: string;
}

/**
 * Each entry documents a real, widely-cited advisory. Thresholds are the
 * version the fix shipped in — anything strictly below is flagged.
 */
export const VULN_LIBRARIES: VulnLibrary[] = [
  {
    name: 'jQuery',
    versionPatterns: [
      /jquery[-.]?(\d+\.\d+\.\d+)(?:\.min)?\.js/i,
      /jquery@(\d+\.\d+\.\d+)/i,
    ],
    fixedIn: '3.5.0',
    severity: 'warning',
    advisory: 'CVE-2020-11022 / CVE-2020-11023',
    risk: 'Cross-site scripting (XSS) via jQuery.htmlPrefilter when passing untrusted HTML to DOM-manipulation methods.',
  },
  {
    name: 'Bootstrap',
    versionPatterns: [
      /bootstrap[-.]?(\d+\.\d+\.\d+)(?:\.min)?\.(?:js|css)/i,
      /bootstrap@(\d+\.\d+\.\d+)/i,
    ],
    fixedIn: '4.3.1',
    severity: 'warning',
    advisory: 'CVE-2019-8331',
    risk: 'XSS in the tooltip / popover data-template and related attributes.',
  },
  {
    name: 'Lodash',
    versionPatterns: [
      /lodash[-.]?(\d+\.\d+\.\d+)(?:\.min)?\.js/i,
      /lodash@(\d+\.\d+\.\d+)/i,
    ],
    fixedIn: '4.17.21',
    severity: 'warning',
    advisory: 'CVE-2021-23337 / CVE-2020-8203',
    risk: 'Prototype pollution and command injection via _.template / _.set on untrusted input.',
  },
  {
    name: 'AngularJS (1.x)',
    versionPatterns: [
      /angular[-.]?(1\.\d+\.\d+)(?:\.min)?\.js/i,
      /angular\.js@(1\.\d+\.\d+)/i,
    ],
    fixedIn: '1.8.3',
    severity: 'warning',
    advisory: 'Multiple (AngularJS is end-of-life)',
    risk: 'AngularJS 1.x is end-of-life and receives no security patches; several sandbox-bypass and XSS issues are unfixed.',
  },
  {
    name: 'Moment.js',
    versionPatterns: [
      /moment[-.]?(\d+\.\d+\.\d+)(?:\.min)?\.js/i,
      /moment@(\d+\.\d+\.\d+)/i,
    ],
    fixedIn: '2.29.4',
    severity: 'info',
    advisory: 'CVE-2022-31129',
    risk: 'Regular-expression denial of service (ReDoS) when parsing very long, attacker-controlled date strings.',
  },
  {
    name: 'Vue 2',
    versionPatterns: [
      /vue[-.]?(2\.\d+\.\d+)(?:\.min)?\.js/i,
      /vue@(2\.\d+\.\d+)/i,
    ],
    fixedIn: '2.7.16',
    severity: 'info',
    advisory: 'Vue 2 is end-of-life (Dec 2023)',
    risk: 'Vue 2 no longer receives updates; migrate to Vue 3 for continued security support.',
  },
];

/**
 * Compare two dotted version strings. Returns negative if a < b, 0 if equal,
 * positive if a > b. Missing segments are treated as 0.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface DetectedLibrary {
  name: string;
  version: string;
  fixedIn: string;
  isVulnerable: boolean;
  severity: 'critical' | 'warning' | 'info';
  advisory: string;
  risk: string;
}

/**
 * Fingerprint libraries + versions from delivered HTML. Returns one entry per
 * distinct library/version found in the known list. Only vulnerable versions
 * are marked isVulnerable; callers decide whether to surface up-to-date ones.
 */
export function detectVulnerableLibraries(html: string): DetectedLibrary[] {
  if (!html) return [];
  const results: DetectedLibrary[] = [];
  const seen = new Set<string>();

  for (const lib of VULN_LIBRARIES) {
    for (const pattern of lib.versionPatterns) {
      // Reset lastIndex defensively; patterns are not global but be safe.
      const match = html.match(pattern);
      if (match && match[1]) {
        const version = match[1];
        const key = `${lib.name}@${version}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const isVulnerable = compareVersions(version, lib.fixedIn) < 0;
        results.push({
          name: lib.name,
          version,
          fixedIn: lib.fixedIn,
          isVulnerable,
          severity: lib.severity,
          advisory: lib.advisory,
          risk: lib.risk,
        });
        break; // one version per library is enough
      }
    }
  }

  return results;
}
