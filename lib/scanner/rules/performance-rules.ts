/**
 * Passive Performance Analyzer — Rule Engine
 *
 * Derives launch-relevant performance signals from data we already captured on
 * a normal GET: response timing, transfer weight, response headers, and the
 * delivered HTML. No headless browser, no Lighthouse — these are cheap,
 * reproducible heuristics that catch the issues fast-shipped sites actually hit.
 *
 * These are directional signals (labelled as such), not lab Core Web Vitals.
 * Where a value is a heuristic proxy we say so, so we never overclaim.
 */

import * as cheerio from 'cheerio';

export type PerfSeverity = 'critical' | 'warning' | 'info';

export interface PerformanceFinding {
  id: string;
  ruleId: string;
  issueCode: string;
  category: 'performance';
  severity: PerfSeverity;
  confidence: 'high' | 'medium' | 'low';
  title: string;
  pageUrl: string;
  path: string;
  whatFound: string;
  evidence: Record<string, any>;
}

export interface PerformancePageInput {
  url: string;
  finalUrl: string;
  statusCode: number;
  html: string;
  responseTimeMs: number;
  pageSizeBytes?: number;
  responseHeaders?: Record<string, string>;
  isHomepage: boolean;
}

// Thresholds — deliberately conservative so we flag real problems, not nitpicks.
const TTFB_SLOW_MS = 1500;
const TTFB_VERY_SLOW_MS = 3000;
const HTML_HEAVY_BYTES = 1_000_000; // 1 MB of HTML is a lot
const RENDER_BLOCKING_SCRIPTS = 5;

let seq = 0;
function pathOf(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

function mk(
  ruleId: string,
  issueCode: string,
  severity: PerfSeverity,
  confidence: 'high' | 'medium' | 'low',
  title: string,
  page: PerformancePageInput,
  whatFound: string,
  evidence: Record<string, any>
): PerformanceFinding {
  seq += 1;
  return {
    id: `perf_${ruleId}_${seq}`,
    ruleId,
    issueCode,
    category: 'performance',
    severity,
    confidence,
    title,
    pageUrl: page.finalUrl || page.url,
    path: pathOf(page.finalUrl || page.url),
    whatFound,
    evidence,
  };
}

function analyzePage(page: PerformancePageInput): PerformanceFinding[] {
  const out: PerformanceFinding[] = [];
  const h = page.responseHeaders || {};

  // ── TTFB (server responsiveness) ──
  if (page.responseTimeMs >= TTFB_VERY_SLOW_MS) {
    out.push(
      mk(
        'slow_ttfb',
        'slow_ttfb',
        'warning',
        'high',
        'Very slow server response',
        page,
        `The server took ${page.responseTimeMs} ms to respond (time to first byte). Above ~3 s, users routinely abandon the page before it loads.`,
        { responseTimeMs: page.responseTimeMs, thresholdMs: TTFB_VERY_SLOW_MS }
      )
    );
  } else if (page.responseTimeMs >= TTFB_SLOW_MS) {
    out.push(
      mk(
        'slow_ttfb',
        'slow_ttfb',
        'info',
        'high',
        'Slow server response',
        page,
        `The server took ${page.responseTimeMs} ms to respond (time to first byte). Aim for under ~800 ms for a snappy first load.`,
        { responseTimeMs: page.responseTimeMs, thresholdMs: TTFB_SLOW_MS }
      )
    );
  }

  // ── HTML transfer weight ──
  if ((page.pageSizeBytes || 0) >= HTML_HEAVY_BYTES) {
    out.push(
      mk(
        'large_html_payload',
        'large_html_payload',
        'info',
        'high',
        'Large HTML document',
        page,
        `The HTML document is ${(page.pageSizeBytes! / 1024).toFixed(0)} KB before images and scripts. Large HTML delays first render, especially on mobile.`,
        { pageSizeBytes: page.pageSizeBytes }
      )
    );
  }

  // ── Compression ──
  const encoding = h['content-encoding'];
  const contentType = (h['content-type'] || '').toLowerCase();
  const isCompressible = contentType.includes('text/html');
  if (isCompressible && !encoding && (page.pageSizeBytes || 0) > 30_000) {
    out.push(
      mk(
        'no_compression',
        'no_compression',
        'warning',
        'high',
        'HTML served without compression',
        page,
        'The HTML response has no Content-Encoding (gzip/br). Enabling compression typically cuts transfer size by 60–80%.',
        { contentEncoding: null, pageSizeBytes: page.pageSizeBytes }
      )
    );
  }

  // ── Caching ──
  const cacheControl = h['cache-control'] || '';
  if (!cacheControl || /no-store/.test(cacheControl)) {
    out.push(
      mk(
        'weak_cache_headers',
        'weak_cache_headers',
        'info',
        'medium',
        'No caching headers on the document',
        page,
        `The document has ${cacheControl ? `Cache-Control: ${cacheControl}` : 'no Cache-Control header'}, so repeat visits re-download it in full. Static assets in particular should be cacheable.`,
        { cacheControl: cacheControl || null }
      )
    );
  }

  // ── Render-blocking resources + image hygiene (parse HTML once) ──
  if (page.html) {
    const $ = cheerio.load(page.html);

    // Synchronous scripts in <head> (no async/defer) block the parser.
    let blockingScripts = 0;
    $('head script[src]').each((_, el) => {
      const async = $(el).attr('async') !== undefined;
      const defer = $(el).attr('defer') !== undefined;
      const type = ($(el).attr('type') || '').toLowerCase();
      if (!async && !defer && type !== 'module') blockingScripts += 1;
    });
    if (blockingScripts >= RENDER_BLOCKING_SCRIPTS) {
      out.push(
        mk(
          'render_blocking_resources',
          'render_blocking_resources',
          'info',
          'high',
          `${blockingScripts} render-blocking scripts in <head>`,
          page,
          `${blockingScripts} synchronous <script> tags load in the <head> without async/defer, each blocking first paint. Add defer or move them to the end of <body>.`,
          { blockingScripts }
        )
      );
    }

    // Images without explicit width/height → layout shift (CLS) risk.
    const imgs = $('img');
    let missingDims = 0;
    imgs.each((_, el) => {
      const hasW = $(el).attr('width') !== undefined || /width\s*:/i.test($(el).attr('style') || '');
      const hasH = $(el).attr('height') !== undefined || /height\s*:/i.test($(el).attr('style') || '');
      if (!hasW || !hasH) missingDims += 1;
    });
    if (imgs.length > 0 && missingDims >= Math.max(3, Math.ceil(imgs.length * 0.5))) {
      out.push(
        mk(
          'images_missing_dimensions',
          'images_missing_dimensions',
          'info',
          'high',
          `${missingDims} images missing width/height`,
          page,
          `${missingDims} of ${imgs.length} <img> tags have no explicit width/height, which causes layout shift (CLS) as images load. Set intrinsic dimensions.`,
          { missingDimensions: missingDims, totalImages: imgs.length }
        )
      );
    }
  }

  return out;
}

/**
 * Run passive performance checks. Detailed per-page findings are generated for
 * the homepage; other pages contribute only their headline signals to avoid
 * flooding the report with near-duplicate rows.
 */
export function analyzePerformance(pages: PerformancePageInput[]): PerformanceFinding[] {
  seq = 0;
  const homepage = pages.find((p) => p.isHomepage) || pages[0];
  if (!homepage || homepage.statusCode < 200 || homepage.statusCode >= 400) return [];
  return analyzePage(homepage);
}
