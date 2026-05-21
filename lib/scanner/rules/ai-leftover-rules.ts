/**
 * AI Leftover Detector — Rule Engine
 *
 * Scans visible page text and links for placeholder content commonly left
 * behind in AI-generated or template-based websites.
 *
 * 100% deterministic — no AI/LLM used.
 * Every finding includes the matched text as evidence.
 */

export interface AILeftoverFinding {
  id: string;
  ruleId: string;
  category: 'ai_leftovers';
  severity: 'warning' | 'info';
  title: string;
  description: string;
  whyItMatters: string;
  pageUrl: string;
  path: string;
  evidence: {
    matchedText: string;
    pattern: string;
    context?: string;
  };
  fixSummary: string;
  fixPrompt: string;
}

// ─── Pattern definitions ──────────────────────────────────────────────────────

interface TextPattern {
  id: string;
  pattern: RegExp;
  label: string;
  severity: 'warning' | 'info';
}

const TEXT_PATTERNS: TextPattern[] = [
  // Lorem ipsum
  { id: 'lorem_ipsum', pattern: /lorem\s+ipsum/i, label: 'Lorem ipsum placeholder text', severity: 'warning' },
  // Fake company names
  { id: 'fake_company_acme', pattern: /\bacme\s+(corp|inc|co|company|ltd)\b/i, label: 'Fake company name "Acme"', severity: 'warning' },
  { id: 'your_company', pattern: /\byour\s+(company|brand|business|startup|name|logo)\b/i, label: 'Placeholder "your company/brand"', severity: 'warning' },
  { id: 'company_name', pattern: /\[company\s*name\]/i, label: 'Bracket placeholder [Company Name]', severity: 'warning' },
  // Fake names
  { id: 'john_doe', pattern: /\bjohn\s+doe\b/i, label: 'Fake name "John Doe"', severity: 'warning' },
  { id: 'jane_doe', pattern: /\bjane\s+doe\b/i, label: 'Fake name "Jane Doe"', severity: 'warning' },
  // Fake emails
  { id: 'fake_email_your', pattern: /\byour@email\.com\b/i, label: 'Placeholder email "your@email.com"', severity: 'warning' },
  { id: 'fake_email_hello_example', pattern: /\bhello@example\.com\b/i, label: 'Placeholder email "hello@example.com"', severity: 'warning' },
  { id: 'fake_email_test', pattern: /\btest@(test|example|email)\.com\b/i, label: 'Test email address', severity: 'warning' },
  { id: 'fake_email_info_example', pattern: /\binfo@example\.(com|org|net)\b/i, label: 'Placeholder email "info@example.com"', severity: 'warning' },
  // Developer notes
  { id: 'todo_text', pattern: /\b(TODO|FIXME|HACK|XXX|PLACEHOLDER|REPLACE\s+THIS|INSERT\s+YOUR)\b/, label: 'Developer TODO/FIXME note in visible content', severity: 'warning' },
  // AI-generated patterns
  { id: 'as_an_ai', pattern: /\bas\s+an?\s+ai\s+(language\s+model|assistant|model)\b/i, label: '"As an AI" leftover text', severity: 'warning' },
  { id: 'generated_by_ai', pattern: /generated\s+by\s+(ai|artificial\s+intelligence|chatgpt|claude|gpt)/i, label: 'AI generation disclosure in content', severity: 'warning' },
  { id: 'replace_with', pattern: /\[?(replace|insert|add|put)\s+(your|this|here|content)\]?/i, label: 'Replace-this placeholder', severity: 'warning' },
  // Coming soon / unfinished
  { id: 'coming_soon_page', pattern: /coming\s+soon/i, label: '"Coming soon" on page content', severity: 'info' },
  { id: 'under_construction', pattern: /under\s+construction/i, label: '"Under construction" on page content', severity: 'warning' },
  // Placeholder content
  { id: 'sample_text', pattern: /\bsample\s+text\b/i, label: 'Sample text placeholder', severity: 'warning' },
  { id: 'dummy_text', pattern: /\bdummy\s+(text|content|data)\b/i, label: 'Dummy text placeholder', severity: 'warning' },
  { id: 'placeholder_text', pattern: /\bplaceholder\s+(text|content)\b/i, label: 'Placeholder text', severity: 'warning' },
  { id: 'untitled', pattern: /\buntitled\s+(page|project|site|app|website)\b/i, label: '"Untitled" project or page', severity: 'warning' },
  // Generic new project signals
  { id: 'new_project', pattern: /\bnew\s+(next\.?js|react|vite|svelte|vue)\s+(app|project)\b/i, label: 'Default framework project name', severity: 'warning' },
  { id: 'welcome_to_nextjs', pattern: /welcome\s+to\s+next\.?js/i, label: 'Default Next.js welcome text', severity: 'warning' },
  { id: 'create_next_app', pattern: /create[\s-]next[\s-]app/i, label: 'create-next-app boilerplate text', severity: 'warning' },
  // Testimonial placeholders
  { id: 'test_testimonial', pattern: /test(imonial)?\s+(text|quote|here|placeholder)/i, label: 'Placeholder testimonial', severity: 'warning' },
  { id: 'fake_testimonial', pattern: /"(This\s+product\s+is\s+(amazing|great|awesome)|Lorem\s+ipsum[^"]{0,50})"\s*[-—]\s*(John|Jane|User)\s+\w+/i, label: 'Template testimonial with fake name', severity: 'warning' },
];

// ─── Link placeholder patterns ────────────────────────────────────────────────

interface LinkPattern {
  id: string;
  pattern: RegExp;
  label: string;
}

const PLACEHOLDER_LINK_PATTERNS: LinkPattern[] = [
  { id: 'hash_only', pattern: /^#$/, label: 'href="#" placeholder link' },
  { id: 'example_domain', pattern: /^https?:\/\/(www\.)?example\.(com|org|net)/i, label: 'Links to example.com' },
  { id: 'placeholder_path', pattern: /\/placeholder(s)?(\/|$)/i, label: 'Links to /placeholder path' },
  { id: 'javascript_void', pattern: /^javascript:/i, label: 'javascript: placeholder link' },
  { id: 'your_link', pattern: /^https?:\/\/(your|my|insert)([\-_]?(link|url|website|domain))?/i, label: 'Placeholder URL "your-link.com"' },
];

// ─── Image alt placeholder patterns ──────────────────────────────────────────

const PLACEHOLDER_ALT_PATTERNS = [
  /^placeholder$/i,
  /^image$/i,
  /^img$/i,
  /^picture$/i,
  /^photo$/i,
  /^thumbnail$/i,
  /^avatar$/i,
  /^logo$/i,
  /^banner$/i,
  /^hero$/i,
  /^screenshot$/i,
  /^image\s+\d+$/i,
  /^img\s*\d+$/i,
  /^photo\s+of/i,
  /\[.*\]/,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getContext(text: string, match: RegExpMatchArray, windowSize = 60): string {
  const start = Math.max(0, (match.index ?? 0) - windowSize);
  const end = Math.min(text.length, (match.index ?? 0) + (match[0]?.length ?? 0) + windowSize);
  return '…' + text.slice(start, end).replace(/\s+/g, ' ').trim() + '…';
}

function getPath(url: string): string {
  try { return new URL(url).pathname; } catch { return url; }
}

// ─── Main detector function ───────────────────────────────────────────────────

export function detectAILeftovers(
  pages: Array<{
    url: string;
    html?: string;
    visibleText?: string;
    links?: Array<{ href: string; anchorText: string; rawHref: string }>;
  }>
): AILeftoverFinding[] {
  const findings: AILeftoverFinding[] = [];
  const seenIds = new Set<string>();

  for (const page of pages) {
    const path = getPath(page.url);
    // Build visible text from html if not pre-extracted
    const rawText = page.visibleText
      ?? (page.html ? page.html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
        : '');

    // ── Text pattern checks ──────────────────────────────────────────────────
    for (const tp of TEXT_PATTERNS) {
      const match = rawText.match(tp.pattern);
      if (!match) continue;

      const id = `ai_leftover_${tp.id}_${page.url}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      findings.push({
        id,
        ruleId: tp.id,
        category: 'ai_leftovers',
        severity: tp.severity,
        title: tp.label,
        description: `Found potential placeholder text on ${path}: "${match[0]}"`,
        whyItMatters:
          'AI-built sites often look finished while leaving template text behind. Placeholder content looks unprofessional and reduces trust.',
        pageUrl: page.url,
        path,
        evidence: {
          matchedText: match[0],
          pattern: tp.pattern.source,
          context: getContext(rawText, match),
        },
        fixSummary: `Replace the placeholder text "${match[0]}" on ${path} with real production copy.`,
        fixPrompt: `Find the placeholder text "${match[0]}" on the page at ${path}. Replace it with real production copy. Search the entire project for similar placeholder text and remove or replace all instances. Do not change unrelated UI or styles.`,
      });
    }

    // ── Link placeholder checks ──────────────────────────────────────────────
    if (page.html) {
      // Extract href values from the HTML for link checking
      const hrefRegex = /href=["']([^"']+)["']/gi;
      let hrefMatch: RegExpExecArray | null;
      while ((hrefMatch = hrefRegex.exec(page.html)) !== null) {
        const href = hrefMatch[1];
        for (const lp of PLACEHOLDER_LINK_PATTERNS) {
          if (!lp.pattern.test(href)) continue;

          const id = `ai_leftover_link_${lp.id}_${href}_${page.url}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          findings.push({
            id,
            ruleId: `placeholder_link_${lp.id}`,
            category: 'ai_leftovers',
            severity: 'warning',
            title: lp.label,
            description: `A link on ${path} points to a placeholder destination: "${href}"`,
            whyItMatters:
              'Placeholder links lead nowhere or to example destinations. Clicking them will confuse or embarrass users.',
            pageUrl: page.url,
            path,
            evidence: {
              matchedText: href,
              pattern: lp.pattern.source,
            },
            fixSummary: `Replace the placeholder link "${href}" on ${path} with the correct destination.`,
            fixPrompt: `Find the link pointing to "${href}" on ${path}. Replace it with the correct destination URL or remove the link if the destination is not ready yet. Do not break other links or change unrelated styles.`,
          });
        }
      }

      // ── Image alt placeholder checks ─────────────────────────────────────
      const imgAltRegex = /<img[^>]+alt=["']([^"']*)["'][^>]*>/gi;
      let imgMatch: RegExpExecArray | null;
      while ((imgMatch = imgAltRegex.exec(page.html)) !== null) {
        const alt = imgMatch[1];
        const isPlaceholder = PLACEHOLDER_ALT_PATTERNS.some((p) => p.test(alt));
        if (!isPlaceholder) continue;

        const id = `ai_leftover_img_alt_${alt}_${page.url}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        findings.push({
          id,
          ruleId: 'placeholder_image_alt',
          category: 'ai_leftovers',
          severity: 'info',
          title: `Placeholder image alt text: "${alt}"`,
          description: `An image on ${path} has a generic or placeholder alt attribute: "${alt}"`,
          whyItMatters:
            'Generic alt text like "placeholder" or "image" provides no accessibility or SEO value.',
          pageUrl: page.url,
          path,
          evidence: {
            matchedText: alt,
            pattern: 'placeholder alt text',
          },
          fixSummary: `Replace the generic alt text "${alt}" with a descriptive description of the image.`,
          fixPrompt: `Find the image with alt="${alt}" on ${path}. Replace the alt text with a meaningful description of what the image shows. This helps screen readers and search engines. Do not change the image src or surrounding layout.`,
        });
      }
    }
  }

  return findings;
}
