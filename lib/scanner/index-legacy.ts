import * as cheerio from 'cheerio';
import fetch from 'cross-fetch';
import { normalizeUrl, isPrivateOrLocal, isSameOrigin } from './utils';
import type { ScanResult, PageData, LinkCheck, Issue, SeoData, ConsoleEvent } from './types';

const USER_AGENT = 'VibeSiteScanBot/1.0 (+https://vibesitescan.app)';
const TIMEOUT = 15000;

async function fetchPage(url: string): Promise<{ finalUrl: string; html: string; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: controller.signal
    });
    
    const html = await response.text();
    return {
      finalUrl: response.url || url,
      html,
      status: response.status
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function analyzeSeo(url: string, html: string): SeoData {
  const $ = cheerio.load(html);
  
  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const h1Count = $('h1').length;
  const canonical = !!$('link[rel="canonical"]').attr('href');
  const ogTitle = !!$('meta[property="og:title"]').attr('content');
  const ogDescription = !!$('meta[property="og:description"]').attr('content');
  const ogImage = !!$('meta[property="og:image"]').attr('content');
  const twitterCard = !!$('meta[name="twitter:card"]').attr('content');
  const favicon = !!($('link[rel~="icon"]').length || $('link[rel="shortcut icon"]').length);
  const viewport = !!$('meta[name="viewport"]').attr('content');
  const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
  const robotsNoindex = robotsMeta.includes('noindex');
  const imgMissingAlt = $('img:not([alt])').length;
  
  return {
    title,
    metaDescription,
    h1Count,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    favicon,
    viewport,
    robotsNoindex,
    imgMissingAlt
  };
}

function extractLinks(baseUrl: string, html: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    
    // Skip non-http links
    if (href.startsWith('mailto:') || href.startsWith('tel:') || 
        href.startsWith('javascript:') || href.startsWith('#')) {
      return;
    }
    
    try {
      const absoluteUrl = new URL(href, baseUrl).toString();
      links.push(absoluteUrl);
    } catch {
      // Invalid URL, skip
    }
  });
  
  return Array.from(new Set(links));
}

async function checkLink(url: string): Promise<LinkCheck> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return {
        url,
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        redirected: response.url !== url
      };
    } catch (headError) {
      // Fallback to GET if HEAD fails
      clearTimeout(timeoutId);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller2.signal
      });
      
      clearTimeout(timeoutId2);
      
      return {
        url,
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        redirected: response.url !== url
      };
    }
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      redirected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function analyzeForms(html: string): { formCount: number; issues: string[] } {
  const $ = cheerio.load(html);
  const forms = $('form');
  const issues: string[] = [];
  let formCount = 0;
  
  forms.each((_, form) => {
    formCount++;
    const $form = $(form);
    const action = $form.attr('action');
    const method = $form.attr('method');
    
    if (!action) {
      issues.push(`Form ${formCount} missing action attribute`);
    }
    
    if (!method) {
      issues.push(`Form ${formCount} missing method attribute`);
    }
    
    const inputs = $form.find('input, textarea, select');
    inputs.each((_, input) => {
      const $input = $(input);
      const id = $input.attr('id');
      const ariaLabel = $input.attr('aria-label');
      const type = $input.attr('type');
      
      if (type !== 'hidden' && !id && !ariaLabel) {
        const name = $input.attr('name') || 'unnamed';
        issues.push(`Input "${name}" in form ${formCount} missing label`);
      }
    });
  });
  
  return { formCount, issues };
}

function generateIssues(rootUrl: string, pages: PageData[], linkResults: LinkCheck[]): Issue[] {
  const issues: Issue[] = [];
  const isHomepage = (url: string) => url === rootUrl;
  
  // Check each page
  for (const page of pages) {
    const isHome = isHomepage(page.url);
    
    // Critical: Page unavailable
    if (page.statusCode === 0 || (page.statusCode >= 400 && page.statusCode < 600)) {
      issues.push({
        severity: 'critical',
        category: 'availability',
        title: isHome ? 'Homepage inaccessible' : 'Page unavailable',
        description: `HTTP ${page.statusCode || 'timeout'}`,
        fix: 'Ensure the page is accessible and returns a 200 status code',
        page: page.url
      });
      continue;
    }
    
    // Title checks
    if (!page.seo.title) {
      issues.push({
        severity: isHome ? 'critical' : 'warning',
        category: 'seo',
        title: 'Missing title tag',
        description: 'No <title> tag found on this page',
        fix: 'Add a descriptive <title> tag between 30-60 characters',
        page: page.url
      });
    } else if (page.seo.title.length < 20) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too short',
        description: `Title is only ${page.seo.title.length} characters`,
        fix: 'Aim for 30-60 characters for optimal SEO',
        page: page.url
      });
    } else if (page.seo.title.length > 70) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too long',
        description: `Title is ${page.seo.title.length} characters`,
        fix: 'Keep titles under 60 characters to avoid truncation in search results',
        page: page.url
      });
    }
    
    // Meta description
    if (!page.seo.metaDescription) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Missing meta description',
        description: 'No meta description found',
        fix: 'Add a unique meta description around 120-160 characters',
        page: page.url
      });
    } else if (page.seo.metaDescription.length < 50) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Meta description too short',
        description: `Only ${page.seo.metaDescription.length} characters`,
        fix: 'Aim for 120-160 characters for better search snippets',
        page: page.url
      });
    }
    
    // H1 checks
    if (page.seo.h1Count === 0) {
      issues.push({
        severity: isHome ? 'critical' : 'warning',
        category: 'seo',
        title: 'Missing H1 heading',
        description: 'No H1 tag found on this page',
        fix: 'Add a single H1 heading that describes the page content',
        page: page.url
      });
    } else if (page.seo.h1Count > 1) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Multiple H1 headings',
        description: `Found ${page.seo.h1Count} H1 tags`,
        fix: 'Use only one H1 per page for better SEO structure',
        page: page.url
      });
    }
    
    // Open Graph
    if (!page.seo.ogTitle) {
      issues.push({
        severity: 'warning',
        category: 'social',
        title: 'Missing og:title',
        description: 'No Open Graph title found',
        fix: 'Add <meta property="og:title" content="..."> for better social sharing',
        page: page.url
      });
    }
    
    if (!page.seo.ogDescription) {
      issues.push({
        severity: 'warning',
        category: 'social',
        title: 'Missing og:description',
        description: 'No Open Graph description found',
        fix: 'Add <meta property="og:description" content="..."> for social media previews',
        page: page.url
      });
    }
    
    if (!page.seo.ogImage) {
      issues.push({
        severity: 'warning',
        category: 'social',
        title: 'Missing og:image',
        description: 'No Open Graph image found',
        fix: 'Add <meta property="og:image" content="..."> so shared links look professional',
        page: page.url
      });
    }
    
    if (!page.seo.twitterCard) {
      issues.push({
        severity: 'warning',
        category: 'social',
        title: 'Missing Twitter card',
        description: 'No Twitter card meta tag found',
        fix: 'Add <meta name="twitter:card" content="summary_large_image">',
        page: page.url
      });
    }
    
    // Mobile viewport
    if (!page.seo.viewport) {
      issues.push({
        severity: 'warning',
        category: 'mobile',
        title: 'Missing viewport meta tag',
        description: 'No viewport meta tag found',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
        page: page.url
      });
    }
    
    // Favicon
    if (!page.seo.favicon && isHome) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Missing favicon',
        description: 'No favicon link found',
        fix: 'Add a favicon for better branding in browser tabs',
        page: page.url
      });
    }
    
    // Robots noindex warning
    if (page.seo.robotsNoindex) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Page set to noindex',
        description: 'This page won\'t be indexed by search engines',
        fix: 'Remove noindex if you want this page to appear in search results',
        page: page.url
      });
    }
    
    // Canonical
    if (!page.seo.canonical) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Missing canonical tag',
        description: 'No canonical URL specified',
        fix: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues',
        page: page.url
      });
    }
    
    // Images without alt text
    if (page.seo.imgMissingAlt > 0) {
      issues.push({
        severity: 'warning',
        category: 'accessibility',
        title: `${page.seo.imgMissingAlt} image(s) missing alt text`,
        description: 'Images without alt attributes harm accessibility',
        fix: 'Add descriptive alt text to all images',
        page: page.url
      });
    }
    
    // Form issues
    const formAnalysis = analyzeForms(page.html);
    for (const formIssue of formAnalysis.issues) {
      issues.push({
        severity: 'warning',
        category: 'forms',
        title: 'Form validation issue',
        description: formIssue,
        fix: 'Ensure all forms have proper action, method, and labeled inputs',
        page: page.url
      });
    }
  }
  
  // Check broken links
  for (const link of linkResults) {
    if (!link.ok) {
      const isInternal = isSameOrigin(rootUrl, link.url);
      issues.push({
        severity: isInternal ? 'critical' : 'warning',
        category: 'links',
        title: 'Broken link',
        description: `${link.url} returned ${link.status || 'error'}`,
        fix: 'Update or remove the broken link',
        page: link.source,
        evidence: link.url
      });
    } else if (link.redirected) {
      issues.push({
        severity: 'info',
        category: 'links',
        title: 'Redirected link',
        description: `${link.url} redirects to another URL`,
        fix: 'Consider updating to the final URL to avoid redirect chains',
        page: link.source,
        evidence: link.url
      });
    }
  }
  
  return issues;
}

function calculateScore(issues: Issue[]): number {
  let score = 100;
  
  const critical = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  
  score -= Math.min(60, critical * 15);
  score -= Math.min(40, warnings * 4);
  
  return Math.max(0, score);
}

export async function runScan(
  targetUrl: string,
  depth: 'quick' | 'standard' = 'quick'
): Promise<ScanResult> {
  const startTime = Date.now();
  
  // Normalize and validate URL
  const rootUrl = normalizeUrl(targetUrl);
  const parsedUrl = new URL(rootUrl);
  
  if (isPrivateOrLocal(parsedUrl.hostname)) {
    throw new Error('Private and local URLs are not allowed for security reasons');
  }
  
  const pages: PageData[] = [];
  const allLinks: LinkCheck[] = [];
  const consoleEvents: ConsoleEvent[] = [];
  
  // Fetch homepage
  try {
    const homepage = await fetchPage(rootUrl);
    const seo = analyzeSeo(rootUrl, homepage.html);
    pages.push({
      url: rootUrl,
      statusCode: homepage.status,
      html: homepage.html,
      seo
    });
    
    // Discover internal links for standard scan
    if (depth === 'standard' && homepage.status === 200) {
      const links = extractLinks(rootUrl, homepage.html);
      const internalLinks = links
        .filter(link => isSameOrigin(rootUrl, link))
        .filter(link => link !== rootUrl)
        .slice(0, 24); // Limit to 24 additional pages (25 total with homepage)
      
      // Fetch additional pages
      for (const link of internalLinks) {
        try {
          const pageData = await fetchPage(link);
          const pageSeo = analyzeSeo(link, pageData.html);
          pages.push({
            url: link,
            statusCode: pageData.status,
            html: pageData.html,
            seo: pageSeo
          });
        } catch (error) {
          pages.push({
            url: link,
            statusCode: 0,
            html: '',
            seo: {
              title: '',
              metaDescription: '',
              h1Count: 0,
              canonical: false,
              ogTitle: false,
              ogDescription: false,
              ogImage: false,
              twitterCard: false,
              favicon: false,
              viewport: false,
              robotsNoindex: false,
              imgMissingAlt: 0
            }
          });
        }
      }
    }
  } catch (error) {
    pages.push({
      url: rootUrl,
      statusCode: 0,
      html: '',
      seo: {
        title: '',
        metaDescription: '',
        h1Count: 0,
        canonical: false,
        ogTitle: false,
        ogDescription: false,
        ogImage: false,
        twitterCard: false,
        favicon: false,
        viewport: false,
        robotsNoindex: false,
        imgMissingAlt: 0
      }
    });
  }
  
  // Extract and check links
  const allLinksToCheck = new Set<string>();
  const linkSources = new Map<string, string>();
  
  for (const page of pages) {
    if (page.statusCode === 200) {
      const pageLinks = extractLinks(page.url, page.html);
      for (const link of pageLinks) {
        allLinksToCheck.add(link);
        if (!linkSources.has(link)) {
          linkSources.set(link, page.url);
        }
      }
    }
  }
  
  // Check up to 100 unique links
  const linksArray = Array.from(allLinksToCheck).slice(0, 100);
  for (const link of linksArray) {
    const result = await checkLink(link);
    allLinks.push({
      ...result,
      source: linkSources.get(link)
    });
  }
  
  // Generate issues
  const issues = generateIssues(rootUrl, pages, allLinks);
  
  // Calculate score
  const score = calculateScore(issues);
  
  const durationMs = Date.now() - startTime;
  
  return {
    rootUrl,
    pages,
    linkResults: allLinks,
    issues,
    score,
    durationMs,
    consoleEvents
  };
}
