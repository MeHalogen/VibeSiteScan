import * as cheerio from 'cheerio';
import fetch from 'cross-fetch';
import { normalizeUrl, isPrivateOrLocal, isSameOrigin } from './utils';
import { createIssueFromCode } from './issueKnowledgeBase';
import { calculateLaunchReadiness } from '@/lib/launch-readiness';
import type {
  ScanResult,
  PageData,
  LinkCheck,
  Issue,
  SeoData,
  ConsoleEvent,
  FormCheck,
  RobotsData,
  SitemapData,
  BrowserChecksData,
} from './types';

const USER_AGENT = 'LaunchScanBot/1.0 (+https://launchscan.app)';
const TIMEOUT = 15000;
const LINK_TIMEOUT = 10000;

type ScanProgressEmitter = (event: {
  type: 'log' | 'stage_start' | 'stage_progress' | 'stage_end';
  stageId?: string;
  message?: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  status?: 'completed' | 'warning' | 'failed' | 'skipped';
  metrics?: Record<string, any>;
}) => void;

// Enhanced page fetching with timing and redirect tracking
async function fetchPage(
  url: string,
  sourceUrl: string = '',
  anchorText: string = ''
): Promise<{
  finalUrl: string;
  html: string;
  status: number;
  responseTimeMs: number;
  contentType: string;
}> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: controller.signal,
    });

    const html = await response.text();
    const responseTimeMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || 'text/html';

    return {
      finalUrl: response.url || url,
      html,
      status: response.status,
      responseTimeMs,
      contentType,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Enhanced SEO analysis with detailed data capture
function analyzeSeo(url: string, html: string): SeoData {
  const $ = cheerio.load(html);

  const title = $('title').text().trim();
  const titleLength = title.length;

  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const metaDescriptionLength = metaDescription.length;

  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1Texts: string[] = [];
  h1Elements.each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1Texts.push(text);
  });

  const h2Count = $('h2').length;

  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  const hasCanonical = !!canonicalUrl;

  const ogTitleText = $('meta[property="og:title"]').attr('content')?.trim() || '';
  const hasOgTitle = !!ogTitleText;

  const ogDescriptionText = $('meta[property="og:description"]').attr('content')?.trim() || '';
  const hasOgDescription = !!ogDescriptionText;

  const ogImageUrl = $('meta[property="og:image"]').attr('content')?.trim() || '';
  const hasOgImage = !!ogImageUrl;

  const twitterCardType = $('meta[name="twitter:card"]').attr('content')?.trim() || '';
  const hasTwitterCard = !!twitterCardType;

  const faviconUrl =
    $('link[rel~="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';
  const hasFavicon = !!faviconUrl;

  const hasViewport = !!$('meta[name="viewport"]').attr('content');

  const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
  const robotsNoindex = robotsMeta.includes('noindex');

  const images = $('img');
  const imageCount = images.length;
  let imagesMissingAltCount = 0;
  images.each((_, img) => {
    if (!$(img).attr('alt')) {
      imagesMissingAltCount++;
    }
  });

  return {
    title,
    titleLength,
    metaDescription,
    metaDescriptionLength,
    h1Count,
    h1Texts,
    h2Count,
    canonical: hasCanonical,
    canonicalUrl,
    ogTitle: hasOgTitle,
    ogTitleText,
    ogDescription: hasOgDescription,
    ogDescriptionText,
    ogImage: hasOgImage,
    ogImageUrl,
    twitterCard: hasTwitterCard,
    twitterCardType,
    favicon: hasFavicon,
    faviconUrl,
    viewport: hasViewport,
    robotsNoindex,
    robotsMeta,
    imgMissingAlt: imagesMissingAltCount,
    imageCount,
  };
}

// Enhanced link extraction with anchor text and type classification
function extractLinks(
  baseUrl: string,
  html: string
): Array<{ href: string; anchorText: string; rawHref: string }> {
  const $ = cheerio.load(html);
  const links: Array<{ href: string; anchorText: string; rawHref: string }> = [];

  $('a[href]').each((_, element) => {
    const rawHref = $(element).attr('href') || '';
    const anchorText = $(element).text().trim() || '[no text]';

    try {
      const absoluteUrl = new URL(rawHref, baseUrl).toString();
      links.push({ href: absoluteUrl, anchorText, rawHref });
    } catch {
      // Invalid URL, skip
    }
  });

  return links;
}

// Classify link type
function classifyLinkType(href: string): LinkCheck['linkType'] {
  const lower = href.toLowerCase();

  if (lower.startsWith('mailto:')) return 'mailto';
  if (lower.startsWith('tel:')) return 'tel';
  if (lower.startsWith('javascript:')) return 'javascript';
  if (lower.startsWith('#')) return 'anchor';
  if (lower.match(/\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3)$/i)) return 'asset';
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return 'external'; // Will be refined later based on domain
  }
  return 'unknown';
}

// Enhanced link checking with detailed tracking
async function checkLink(
  sourceUrl: string,
  targetUrl: string,
  anchorText: string,
  rawHref: string,
  rootUrl: string
): Promise<LinkCheck> {
  const normalizedTargetUrl = normalizeUrl(targetUrl);
  const linkType = isSameOrigin(rootUrl, targetUrl) ? 'internal' : classifyLinkType(targetUrl);

  // Skip certain link types
  if (['mailto', 'tel', 'javascript', 'anchor'].includes(linkType)) {
    return {
      sourceUrl,
      anchorText,
      rawHref,
      targetUrl,
      normalizedTargetUrl,
      finalUrl: targetUrl,
      linkType,
      status: 0,
      ok: true,
      isBroken: false,
      isRedirect: false,
      checkedMethod: 'skipped',
      responseTimeMs: 0,
      ignoredReason: `${linkType} link - not checked`,
    };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LINK_TIMEOUT);

  try {
    // Try HEAD first
    try {
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;
      const finalUrl = response.url || targetUrl;
      const isRedirect = finalUrl !== targetUrl;

      return {
        sourceUrl,
        anchorText,
        rawHref,
        targetUrl,
        normalizedTargetUrl,
        finalUrl,
        linkType,
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        isBroken: response.status >= 400,
        isRedirect,
        redirectChain: isRedirect ? [targetUrl, finalUrl] : undefined,
        checkedMethod: 'HEAD',
        responseTimeMs,
      };
    } catch (headError) {
      // Fallback to GET if HEAD fails
      clearTimeout(timeoutId);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), LINK_TIMEOUT);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller2.signal,
      });

      clearTimeout(timeoutId2);
      const responseTimeMs = Date.now() - startTime;
      const finalUrl = response.url || targetUrl;
      const isRedirect = finalUrl !== targetUrl;

      return {
        sourceUrl,
        anchorText,
        rawHref,
        targetUrl,
        normalizedTargetUrl,
        finalUrl,
        linkType,
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        isBroken: response.status >= 400,
        isRedirect,
        redirectChain: isRedirect ? [targetUrl, finalUrl] : undefined,
        checkedMethod: 'GET',
        responseTimeMs: Date.now() - startTime,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      sourceUrl,
      anchorText,
      rawHref,
      targetUrl,
      normalizedTargetUrl,
      finalUrl: targetUrl,
      linkType,
      status: 0,
      ok: false,
      isBroken: true,
      isRedirect: false,
      checkedMethod: 'GET',
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Analyze forms on a page
function analyzeForms(url: string, html: string): FormCheck[] {
  const $ = cheerio.load(html);
  const forms: FormCheck[] = [];

  $('form').each((index, form) => {
    const $form = $(form);
    const action = $form.attr('action') || '';
    const method = $form.attr('method') || '';
    const hasAction = !!action;

    const inputs = $form.find('input, textarea, select');
    const inputCount = inputs.length;
    let missingLabelCount = 0;
    let requiredCount = 0;

    inputs.each((_, input) => {
      const $input = $(input);
      const id = $input.attr('id');
      const ariaLabel = $input.attr('aria-label');
      const type = $input.attr('type');
      const required = $input.attr('required') !== undefined;

      if (required) requiredCount++;

      if (type !== 'hidden' && !id && !ariaLabel) {
        const hasLabel = $form.find(`label[for="${id}"]`).length > 0;
        if (!hasLabel) {
          missingLabelCount++;
        }
      }
    });

    const submitButton = $form.find('button[type="submit"], input[type="submit"]').first();
    const submitButtonText = submitButton.text().trim() || submitButton.attr('value') || '';

    forms.push({
      pageUrl: url,
      formIndex: index,
      hasAction,
      action,
      method,
      inputCount,
      missingLabelCount,
      requiredCount,
      submitButtonText,
    });
  });

  return forms;
}

// Check robots.txt
async function checkRobotsTxt(rootUrl: string): Promise<RobotsData> {
  const parsedUrl = new URL(rootUrl);
  const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
    });

    const robotsFound = response.status === 200;
    const content = robotsFound ? await response.text() : '';
    const robotsContentPreview = content.substring(0, 500);

    // Extract sitemap URLs from robots.txt
    const sitemapUrls: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().startsWith('sitemap:')) {
        const url = line.substring(8).trim();
        if (url) sitemapUrls.push(url);
      }
    }

    return {
      robotsUrl,
      robotsStatusCode: response.status,
      robotsFound,
      robotsContentPreview,
      sitemapUrls,
    };
  } catch (error) {
    return {
      robotsUrl,
      robotsStatusCode: 0,
      robotsFound: false,
      robotsContentPreview: '',
      sitemapUrls: [],
    };
  }
}

// Check sitemap
async function checkSitemap(sitemapUrl: string): Promise<SitemapData> {
  try {
    const response = await fetch(sitemapUrl, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
    });

    const sitemapFound = response.status === 200;
    let sitemapUrlsCount = 0;
    let sitemapUrlsSample: string[] = [];

    if (sitemapFound) {
      const content = await response.text();
      // Simple XML parsing for <loc> tags
      const locMatches = content.match(/<loc>(.*?)<\/loc>/g);
      if (locMatches) {
        sitemapUrlsCount = locMatches.length;
        sitemapUrlsSample = locMatches
          .slice(0, 10)
          .map((m) => m.replace(/<\/?loc>/g, ''));
      }
    }

    return {
      sitemapUrl,
      sitemapStatusCode: response.status,
      sitemapFound,
      sitemapUrlsCount,
      sitemapUrlsSample,
    };
  } catch (error) {
    return {
      sitemapUrl,
      sitemapStatusCode: 0,
      sitemapFound: false,
      sitemapUrlsCount: 0,
      sitemapUrlsSample: [],
    };
  }
}

// Generate enhanced issues using knowledge base
function generateEnhancedIssues(
  rootUrl: string,
  pages: PageData[],
  linkResults: LinkCheck[],
  formChecks: FormCheck[]
): Issue[] {
  const issues: Issue[] = [];

  // Check each page
  for (const page of pages) {
    // Page accessibility issues
    if (page.statusCode >= 400 && page.statusCode < 500) {
      issues.push(
        createIssueFromCode(
          'page_4xx',
          page.url,
          `Page returned HTTP ${page.statusCode} error`,
          { statusCode: page.statusCode, pageUrl: page.url }
        )
      );
    } else if (page.statusCode >= 500) {
      issues.push(
        createIssueFromCode(
          'page_5xx',
          page.url,
          `Page returned HTTP ${page.statusCode} server error`,
          { statusCode: page.statusCode, pageUrl: page.url }
        )
      );
    } else if (page.statusCode === 0) {
      issues.push(
        createIssueFromCode(
          'homepage_unreachable',
          page.url,
          'Page could not be reached (timeout or network error)',
          { pageUrl: page.url }
        )
      );
      continue; // Skip further checks for unreachable pages
    }

    // Title checks
    if (!page.seo.title) {
      issues.push(
        createIssueFromCode('missing_title', page.url, 'No <title> tag found', {
          selector: 'title',
          result: 'not_found',
        })
      );
    } else if (page.seo.titleLength < 30) {
      issues.push(
        createIssueFromCode(
          'title_too_short',
          page.url,
          `Title is only ${page.seo.titleLength} characters`,
          { title: page.seo.title, length: page.seo.titleLength }
        )
      );
    } else if (page.seo.titleLength > 60) {
      issues.push(
        createIssueFromCode(
          'title_too_long',
          page.url,
          `Title is ${page.seo.titleLength} characters`,
          { title: page.seo.title, length: page.seo.titleLength }
        )
      );
    }

    // Meta description checks
    if (!page.seo.metaDescription) {
      issues.push(
        createIssueFromCode(
          'missing_meta_description',
          page.url,
          'No meta description tag found',
          { selector: 'meta[name="description"]', result: 'not_found' }
        )
      );
    } else if (page.seo.metaDescriptionLength < 120) {
      issues.push(
        createIssueFromCode(
          'meta_description_too_short',
          page.url,
          `Meta description is only ${page.seo.metaDescriptionLength} characters`,
          {
            description: page.seo.metaDescription,
            length: page.seo.metaDescriptionLength,
          }
        )
      );
    } else if (page.seo.metaDescriptionLength > 160) {
      issues.push(
        createIssueFromCode(
          'meta_description_too_long',
          page.url,
          `Meta description is ${page.seo.metaDescriptionLength} characters`,
          {
            description: page.seo.metaDescription,
            length: page.seo.metaDescriptionLength,
          }
        )
      );
    }

    // H1 checks
    if (page.seo.h1Count === 0) {
      issues.push(
        createIssueFromCode('missing_h1', page.url, 'No H1 heading found on this page', {
          selector: 'h1',
          result: 'not_found',
        })
      );
    } else if (page.seo.h1Count > 1) {
      issues.push(
        createIssueFromCode(
          'multiple_h1',
          page.url,
          `Found ${page.seo.h1Count} H1 headings on this page`,
          { count: page.seo.h1Count, h1Texts: page.seo.h1Texts }
        )
      );
    }

    // Canonical check
    if (!page.seo.canonical) {
      issues.push(
        createIssueFromCode('missing_canonical', page.url, 'No canonical URL specified', {
          selector: 'link[rel="canonical"]',
          result: 'not_found',
        })
      );
    }

    // Open Graph checks
    if (!page.seo.ogTitle) {
      issues.push(
        createIssueFromCode('missing_og_title', page.url, 'No og:title meta tag found', {
          selector: 'meta[property="og:title"]',
          result: 'not_found',
        })
      );
    }

    if (!page.seo.ogDescription) {
      issues.push(
        createIssueFromCode(
          'missing_og_description',
          page.url,
          'No og:description meta tag found',
          { selector: 'meta[property="og:description"]', result: 'not_found' }
        )
      );
    }

    if (!page.seo.ogImage) {
      issues.push(
        createIssueFromCode('missing_og_image', page.url, 'No og:image meta tag found', {
          selector: 'meta[property="og:image"]',
          result: 'not_found',
        })
      );
    }

    // Twitter card check
    if (!page.seo.twitterCard) {
      issues.push(
        createIssueFromCode(
          'missing_twitter_card',
          page.url,
          'No Twitter card meta tag found',
          { selector: 'meta[name="twitter:card"]', result: 'not_found' }
        )
      );
    }

    // Favicon check (only for homepage)
    if (!page.seo.favicon && page.url === rootUrl) {
      issues.push(
        createIssueFromCode('missing_favicon', page.url, 'No favicon link found', {
          selector: 'link[rel="icon"]',
          result: 'not_found',
        })
      );
    }

    // Viewport check
    if (!page.seo.viewport) {
      issues.push(
        createIssueFromCode('missing_viewport', page.url, 'No viewport meta tag found', {
          selector: 'meta[name="viewport"]',
          result: 'not_found',
        })
      );
    }

    // Robots noindex warning
    if (page.seo.robotsNoindex) {
      issues.push(
        createIssueFromCode(
          'robots_noindex',
          page.url,
          'Page has noindex directive - will not appear in search results',
          { robotsMeta: page.seo.robotsMeta }
        )
      );
    }

    // Image alt text issues
    if (page.seo.imgMissingAlt > 0) {
      issues.push(
        createIssueFromCode(
          'image_missing_alt',
          page.url,
          `${page.seo.imgMissingAlt} image(s) missing alt text`,
          {
            count: page.seo.imgMissingAlt,
            total: page.seo.imageCount,
          }
        )
      );
    }
  }

  // Check broken links
  for (const link of linkResults) {
    if (link.isBroken && link.linkType !== 'asset') {
      const isInternal = link.linkType === 'internal';
      const issueCode = isInternal ? 'broken_internal_link' : 'broken_external_link';

      issues.push(
        createIssueFromCode(
          issueCode,
          link.sourceUrl,
          `Link to ${link.targetUrl} returned ${link.status || 'error'}`,
          {
            sourceUrl: link.sourceUrl,
            anchorText: link.anchorText,
            targetUrl: link.targetUrl,
            statusCode: link.status,
            error: link.error,
          }
        )
      );
    } else if (link.isRedirect && link.linkType === 'internal') {
      issues.push(
        createIssueFromCode(
          'redirect_link',
          link.sourceUrl,
          `Link redirects from ${link.targetUrl} to ${link.finalUrl}`,
          {
            sourceUrl: link.sourceUrl,
            anchorText: link.anchorText,
            targetUrl: link.targetUrl,
            finalUrl: link.finalUrl,
          }
        )
      );
    }
  }

  // Form checks
  for (const formCheck of formChecks) {
    if (!formCheck.hasAction) {
      issues.push(
        createIssueFromCode(
          'form_missing_action',
          formCheck.pageUrl,
          `Form ${formCheck.formIndex + 1} is missing an action attribute`,
          { formIndex: formCheck.formIndex, form: formCheck }
        )
      );
    }

    if (!formCheck.method) {
      issues.push(
        createIssueFromCode(
          'form_missing_method',
          formCheck.pageUrl,
          `Form ${formCheck.formIndex + 1} is missing a method attribute`,
          { formIndex: formCheck.formIndex, form: formCheck }
        )
      );
    }

    if (formCheck.missingLabelCount > 0) {
      issues.push(
        createIssueFromCode(
          'form_inputs_missing_labels',
          formCheck.pageUrl,
          `Form ${formCheck.formIndex + 1} has ${formCheck.missingLabelCount} input(s) without labels`,
          {
            formIndex: formCheck.formIndex,
            missingLabelCount: formCheck.missingLabelCount,
            form: formCheck,
          }
        )
      );
    }
  }

  return issues;
}

// Calculate score with detailed breakdown
function calculateScore(issues: Issue[]): number {
  let score = 100;

  const critical = issues.filter((i) => i.severity === 'critical').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const info = issues.filter((i) => i.severity === 'info').length;

  // Critical issues: -15 points each (max -60)
  score -= Math.min(60, critical * 15);

  // Warnings: -4 points each (max -36)
  score -= Math.min(36, warnings * 4);

  // Info: -1 point each (max -4)
  score -= Math.min(4, info * 1);

  return Math.max(0, score);
}

// Main scan function with full forensic capabilities
export async function runScan(
  targetUrl: string,
  depth: 'quick' | 'standard' = 'quick',
  opts?: { onProgress?: ScanProgressEmitter }
): Promise<ScanResult> {
  const startTime = Date.now();
  const emit: ScanProgressEmitter = (evt) => {
    try {
      opts?.onProgress?.(evt);
    } catch {
      // never let progress reporting break scan execution
    }
  };

  // Normalize and validate URL
  emit({ type: 'stage_start', stageId: 'init', message: 'Normalizing URL' });
  const rootUrl = normalizeUrl(targetUrl);
  const parsedUrl = new URL(rootUrl);

  if (isPrivateOrLocal(parsedUrl.hostname)) {
    emit({ type: 'stage_end', stageId: 'init', status: 'failed', message: 'Blocked private/local URL' });
    throw new Error('Private and local URLs are not allowed for security reasons');
  }
  emit({ type: 'stage_end', stageId: 'init', status: 'completed', metrics: { normalizedUrl: rootUrl, scanDepth: depth } });

  const pages: PageData[] = [];
  const allLinks: LinkCheck[] = [];
  const formChecks: FormCheck[] = [];
  const consoleEvents: ConsoleEvent[] = [];
  const discoveredUrls = new Set<string>();
  const skippedUrls = new Set<string>();

  // Check robots.txt and sitemap
  emit({ type: 'stage_start', stageId: 'score', message: 'Checking robots.txt and sitemap.xml' });
  const robotsData = await checkRobotsTxt(rootUrl);
  let sitemapData: SitemapData | undefined;

  if (robotsData.sitemapUrls.length > 0) {
    sitemapData = await checkSitemap(robotsData.sitemapUrls[0]);
  } else {
    // Try common sitemap locations
    const commonSitemapUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sitemap.xml`;
    sitemapData = await checkSitemap(commonSitemapUrl);
  }
  emit({
    type: 'stage_end',
    stageId: 'score',
    status: 'completed',
    metrics: { robotsFound: robotsData.robotsFound, sitemapFound: sitemapData?.sitemapFound || false },
  });

  // Fetch homepage
  emit({ type: 'stage_start', stageId: 'fetch', message: 'Fetching homepage' });
  try {
    const homepage = await fetchPage(rootUrl);
    const seo = analyzeSeo(rootUrl, homepage.html);
    const forms = analyzeForms(rootUrl, homepage.html);
    formChecks.push(...forms);

    // Count links on the page
    const pageLinks = extractLinks(rootUrl, homepage.html);
    const internalLinksCount = pageLinks.filter((l) =>
      isSameOrigin(rootUrl, l.href)
    ).length;
    const externalLinksCount = pageLinks.length - internalLinksCount;

    pages.push({
      url: rootUrl,
      normalizedUrl: rootUrl,
      finalUrl: homepage.finalUrl,
      sourceUrl: '',
      sourceAnchorText: 'root',
      crawlDepth: 0,
      includedReason: 'homepage',
      statusCode: homepage.status,
      responseTimeMs: homepage.responseTimeMs,
      contentType: homepage.contentType,
      html: homepage.html,
      seo,
      internalLinksCount,
      externalLinksCount,
      formCount: forms.length,
    });

    discoveredUrls.add(rootUrl);
    emit({
      type: 'stage_end',
      stageId: 'fetch',
      status: homepage.status >= 200 && homepage.status < 400 ? 'completed' : 'warning',
      metrics: { statusCode: homepage.status, responseTimeMs: homepage.responseTimeMs, contentType: homepage.contentType },
    });

    // Discover internal links for standard scan
    if (depth === 'standard' && homepage.status === 200) {
      emit({ type: 'stage_start', stageId: 'discover', message: 'Discovering public routes' });
      const links = pageLinks
        .filter((link) => isSameOrigin(rootUrl, link.href))
        .filter((link) => link.href !== rootUrl);

      for (const link of links) {
        if (!discoveredUrls.has(link.href) && discoveredUrls.size < 25) {
          discoveredUrls.add(link.href);
        } else if (discoveredUrls.size >= 25) {
          skippedUrls.add(link.href);
        }
      }
      emit({
        type: 'stage_end',
        stageId: 'discover',
        status: 'completed',
        metrics: { discoveredPagesCount: discoveredUrls.size, skippedPagesCount: skippedUrls.size },
      });

      // Fetch additional pages (up to 24 more, 25 total including homepage)
      const urlsToFetch = Array.from(discoveredUrls).slice(1, 25);

      emit({ type: 'stage_start', stageId: 'crawl', message: 'Scanning pages' });
      for (const url of urlsToFetch) {
        try {
          const pageData = await fetchPage(url, rootUrl, 'discovered from homepage');
          const pageSeo = analyzeSeo(url, pageData.html);
          const pageForms = analyzeForms(url, pageData.html);
          formChecks.push(...pageForms);

          const pagePageLinks = extractLinks(url, pageData.html);
          const pageInternalLinksCount = pagePageLinks.filter((l) =>
            isSameOrigin(rootUrl, l.href)
          ).length;
          const pageExternalLinksCount = pagePageLinks.length - pageInternalLinksCount;

          pages.push({
            url,
            normalizedUrl: url,
            finalUrl: pageData.finalUrl,
            sourceUrl: rootUrl,
            sourceAnchorText: 'discovered from homepage',
            crawlDepth: 1,
            includedReason: 'internal link from homepage',
            statusCode: pageData.status,
            responseTimeMs: pageData.responseTimeMs,
            contentType: pageData.contentType,
            html: pageData.html,
            seo: pageSeo,
            internalLinksCount: pageInternalLinksCount,
            externalLinksCount: pageExternalLinksCount,
            formCount: pageForms.length,
          });
        } catch (error) {
          // Add page with error status
          pages.push({
            url,
            normalizedUrl: url,
            finalUrl: url,
            sourceUrl: rootUrl,
            sourceAnchorText: 'discovered from homepage',
            crawlDepth: 1,
            includedReason: 'internal link from homepage',
            excludedReason: error instanceof Error ? error.message : 'fetch failed',
            statusCode: 0,
            responseTimeMs: 0,
            contentType: 'unknown',
            html: '',
            seo: {
              title: '',
              titleLength: 0,
              metaDescription: '',
              metaDescriptionLength: 0,
              h1Count: 0,
              h1Texts: [],
              h2Count: 0,
              canonical: false,
              canonicalUrl: '',
              ogTitle: false,
              ogTitleText: '',
              ogDescription: false,
              ogDescriptionText: '',
              ogImage: false,
              ogImageUrl: '',
              twitterCard: false,
              twitterCardType: '',
              favicon: false,
              faviconUrl: '',
              viewport: false,
              robotsNoindex: false,
              robotsMeta: '',
              imgMissingAlt: 0,
              imageCount: 0,
            },
            internalLinksCount: 0,
            externalLinksCount: 0,
            formCount: 0,
          });
        }

        emit({
          type: 'stage_progress',
          stageId: 'crawl',
          metrics: { pagesScanned: pages.length, totalPlanned: discoveredUrls.size },
        });
      }
      emit({
        type: 'stage_end',
        stageId: 'crawl',
        status: 'completed',
        metrics: { pagesScanned: pages.length, discoveredPagesCount: discoveredUrls.size, skippedPagesCount: skippedUrls.size },
      });
    } else {
      emit({ type: 'stage_end', stageId: 'discover', status: 'skipped', message: 'Quick pass scans homepage only' });
      emit({ type: 'stage_end', stageId: 'crawl', status: 'skipped', message: 'Quick pass scans homepage only' });
    }
  } catch (error) {
    // Homepage failed to load
    pages.push({
      url: rootUrl,
      normalizedUrl: rootUrl,
      finalUrl: rootUrl,
      sourceUrl: '',
      sourceAnchorText: 'root',
      crawlDepth: 0,
      includedReason: 'homepage',
      excludedReason: error instanceof Error ? error.message : 'fetch failed',
      statusCode: 0,
      responseTimeMs: 0,
      contentType: 'unknown',
      html: '',
      seo: {
        title: '',
        titleLength: 0,
        metaDescription: '',
        metaDescriptionLength: 0,
        h1Count: 0,
        h1Texts: [],
        h2Count: 0,
        canonical: false,
        canonicalUrl: '',
        ogTitle: false,
        ogTitleText: '',
        ogDescription: false,
        ogDescriptionText: '',
        ogImage: false,
        ogImageUrl: '',
        twitterCard: false,
        twitterCardType: '',
        favicon: false,
        faviconUrl: '',
        viewport: false,
        robotsNoindex: false,
        robotsMeta: '',
        imgMissingAlt: 0,
        imageCount: 0,
      },
      internalLinksCount: 0,
      externalLinksCount: 0,
      formCount: 0,
    });
    emit({ type: 'stage_end', stageId: 'fetch', status: 'failed', message: error instanceof Error ? error.message : 'fetch failed' });
    emit({ type: 'stage_end', stageId: 'discover', status: 'skipped' });
    emit({ type: 'stage_end', stageId: 'crawl', status: 'skipped' });
  }

  // Extract and check links from all pages
  emit({ type: 'stage_start', stageId: 'links', message: 'Checking links' });
  const allLinksToCheck = new Map<
    string,
    { sourceUrl: string; anchorText: string; rawHref: string }
  >();

  for (const page of pages) {
    if (page.statusCode === 200) {
      const pageLinks = extractLinks(page.url, page.html);
      for (const link of pageLinks.slice(0, 100)) {
        // Limit links per page
        if (!allLinksToCheck.has(link.href)) {
          allLinksToCheck.set(link.href, {
            sourceUrl: page.url,
            anchorText: link.anchorText,
            rawHref: link.rawHref,
          });
        }
      }
    }
  }

  // Check links (limit to 200 total)
  const linksToCheck = Array.from(allLinksToCheck.entries()).slice(0, 200);
  let checked = 0;
  for (const [url, linkInfo] of linksToCheck) {
    const result = await checkLink(
      linkInfo.sourceUrl,
      url,
      linkInfo.anchorText,
      linkInfo.rawHref,
      rootUrl
    );
    allLinks.push(result);
    checked++;
    if (checked % 10 === 0 || checked === linksToCheck.length) {
      emit({ type: 'stage_progress', stageId: 'links', metrics: { linksChecked: checked, linksTotal: linksToCheck.length } });
    }
  }
  emit({ type: 'stage_end', stageId: 'links', status: 'completed', metrics: { linksChecked: linksToCheck.length, linksTotal: linksToCheck.length } });

  // Browser checks status (not implemented in current version)
  emit({ type: 'stage_end', stageId: 'browser', status: 'skipped', message: 'Browser checks not enabled (Playwright/Puppeteer)' });
  const browserChecks: BrowserChecksData = {
    browserChecksStatus: 'skipped',
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedNetworkRequests: [],
  };

  // Generate issues using knowledge base
  emit({ type: 'stage_start', stageId: 'seo', message: 'Analyzing metadata' });
  emit({ type: 'stage_start', stageId: 'social', message: 'Analyzing share preview' });
  emit({ type: 'stage_start', stageId: 'forms', message: 'Analyzing forms' });
  const issues = generateEnhancedIssues(rootUrl, pages, allLinks, formChecks);
  emit({ type: 'stage_end', stageId: 'forms', status: 'completed', metrics: { formsFoundCount: formChecks.length } });
  emit({ type: 'stage_end', stageId: 'seo', status: 'completed', metrics: { pagesAnalyzed: pages.length } });
  emit({ type: 'stage_end', stageId: 'social', status: 'completed', metrics: { pagesAnalyzed: pages.length } });

  // Add robots.txt and sitemap issues if missing
  if (!robotsData.robotsFound) {
    issues.push(
      createIssueFromCode(
        'missing_robots_txt',
        rootUrl,
        'No robots.txt file found at the root of the site',
        { robotsUrl: robotsData.robotsUrl }
      )
    );
  }

  if (!sitemapData?.sitemapFound) {
    issues.push(
      createIssueFromCode(
        'missing_sitemap',
        rootUrl,
        'No sitemap.xml found',
        { sitemapUrl: sitemapData?.sitemapUrl || '' }
      )
    );
  }

  // Calculate score
  emit({ type: 'stage_start', stageId: 'report', message: 'Computing launch decision' });
  const score = calculateScore(issues);

  // Calculate summary statistics
  const internalLinksCount = allLinks.filter((l) => l.linkType === 'internal').length;
  const externalLinksCount = allLinks.filter((l) => l.linkType === 'external').length;
  const brokenInternalLinksCount = allLinks.filter(
    (l) => l.linkType === 'internal' && l.isBroken
  ).length;
  const brokenExternalLinksCount = allLinks.filter(
    (l) => l.linkType === 'external' && l.isBroken
  ).length;
  const redirectsCount = allLinks.filter((l) => l.isRedirect).length;
  const ignoredLinksCount = allLinks.filter(
    (l) => l.checkedMethod === 'skipped'
  ).length;

  const durationMs = Date.now() - startTime;

  // Calculate traditional score for backwards compatibility
  const legacyScore = calculateScore(issues);

  // Build scan result object for launch readiness calculation
  const scanResultForReadiness = {
    target_url: rootUrl,
    scan_depth: depth, // Use 'depth' parameter from function signature
    pages_count: pages.length,
    issues,
    discovered_pages_count: discoveredUrls.size,
    skipped_pages_count: skippedUrls.size,
    internal_links_count: internalLinksCount,
    external_links_count: externalLinksCount,
    broken_internal_links_count: brokenInternalLinksCount,
    broken_external_links_count: brokenExternalLinksCount,
    redirects_count: redirectsCount,
    ignored_links_count: ignoredLinksCount,
    forms_found_count: formChecks.length,
    console_errors_count: consoleEvents.filter((e) => e.eventType === 'error').length,
    browser_checks_status: browserChecks.browserChecksStatus,
    robots_found: robotsData.robotsFound,
    sitemap_found: sitemapData?.sitemapFound || false,
    blocked_requests_count: 0, // TODO: Track this
    skipped_checks_count: 0, // TODO: Track this
  };

  // Calculate launch readiness
  const launchReadiness = calculateLaunchReadiness(scanResultForReadiness);
  emit({
    type: 'stage_end',
    stageId: 'report',
    status: 'completed',
    metrics: { launchScore: score, issuesCount: issues.length, coverage: launchReadiness.scanCoverage, decision: launchReadiness.launchDecision },
  });

  return {
    rootUrl,
    pages,
    linkResults: allLinks,
    issues,
    score: legacyScore, // Keep for backwards compatibility
    launchReadiness, // NEW: Launch readiness scoring
    durationMs,
    consoleEvents,
    formChecks,
    robotsData,
    sitemapData,
    browserChecks,
    discoveredPagesCount: discoveredUrls.size,
    skippedPagesCount: skippedUrls.size,
    internalLinksCount,
    externalLinksCount,
    brokenInternalLinksCount,
    brokenExternalLinksCount,
    redirectsCount,
    ignoredLinksCount,
    formsFoundCount: formChecks.length,
    consoleErrorsCount: consoleEvents.filter((e) => e.eventType === 'error').length,
  };
}
