/**
 * Issue Grouping & Action Generation
 * 
 * Groups duplicate/related issues into actionable fix cards
 * Perfect for AI-built websites with repeated metadata issues
 */

export interface Issue {
  issueCode: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  pageUrl?: string;
  context?: any;
}

export interface ActionCard {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  howToFix: string;
  affectedPages: string[];
  issueCount: number;
  severity: 'blocker' | 'needs-fix' | 'info';
  owner: string;
  effort: string;
  launchImpact: 'High' | 'Medium' | 'Low';
  canShipWithout: boolean;
  codeExample?: string;
}

/**
 * Group issues into actionable fix cards
 */
export function groupIssuesIntoActions(issues: Issue[]): ActionCard[] {
  const actions: ActionCard[] = [];
  
  // Group by issue code
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.issueCode]) {
      acc[issue.issueCode] = [];
    }
    acc[issue.issueCode].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  // Convert groups to action cards
  for (const [code, issueList] of Object.entries(grouped)) {
    const action = createActionCard(code, issueList);
    if (action) {
      actions.push(action);
    }
  }

  // Sort by impact: blockers first, then high impact, then count
  return actions.sort((a, b) => {
    if (a.severity !== b.severity) {
      const order = { blocker: 0, 'needs-fix': 1, info: 2 };
      return order[a.severity] - order[b.severity];
    }
    if (a.launchImpact !== b.launchImpact) {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.launchImpact] - order[b.launchImpact];
    }
    return b.issueCount - a.issueCount;
  });
}

/**
 * Create action card from grouped issues
 */
function createActionCard(code: string, issues: Issue[]): ActionCard | null {
  const pageUrls = issues.map(i => i.pageUrl).filter(Boolean) as string[];
  const affectedPages = Array.from(new Set(pageUrls));
  const count = issues.length;
  const severity = issues[0].severity;

  const templates: Record<string, Partial<ActionCard>> = {
    missing_og_image: {
      title: 'Add social share images (OG images)',
      description: `${count} page${count > 1 ? 's are' : ' is'} missing og:image tags`,
      whyItMatters: 'Your link will look unfinished when shared on LinkedIn, WhatsApp, Slack, Discord, or X. Missing images = low click-through.',
      howToFix: 'Add og:image meta tags to each page. Create a 1200x630px image for best results.',
      codeExample: `<meta property="og:image" content="https://yourdomain.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`,
      owner: 'Frontend / Marketing',
      effort: '15–30 minutes',
      launchImpact: 'High',
      canShipWithout: true,
    },
    missing_og_title: {
      title: 'Add social share titles (OG titles)',
      description: `${count} page${count > 1 ? 's are' : ' is'} missing og:title tags`,
      whyItMatters: 'Share previews will fallback to generic page titles or show incomplete information.',
      howToFix: 'Add og:title meta tags with compelling, platform-optimized titles.',
      codeExample: `<meta property="og:title" content="Your Page Title">`,
      owner: 'Frontend / Marketing',
      effort: '10–20 minutes',
      launchImpact: 'High',
      canShipWithout: true,
    },
    missing_og_description: {
      title: 'Add social share descriptions',
      description: `${count} page${count > 1 ? 's are' : ' is'} missing og:description tags`,
      whyItMatters: 'Share previews need descriptions to explain what users will see when they click.',
      howToFix: 'Add og:description meta tags with clear, engaging descriptions (150-200 chars).',
      codeExample: `<meta property="og:description" content="Clear description of your page content">`,
      owner: 'Frontend / Marketing',
      effort: '10–20 minutes',
      launchImpact: 'High',
      canShipWithout: true,
    },
    missing_canonical: {
      title: 'Add canonical tags',
      description: `${count} page${count > 1 ? 's are' : ' is'} missing canonical tags`,
      whyItMatters: 'Canonical tags prevent duplicate content issues and help search engines understand the primary version of your pages.',
      howToFix: 'Add canonical link tags pointing to the preferred URL for each page.',
      codeExample: `<link rel="canonical" href="https://yourdomain.com/page">`,
      owner: 'Frontend / SEO',
      effort: '10–15 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
    missing_meta_description: {
      title: 'Improve meta descriptions',
      description: `${count} page${count > 1 ? 's have' : ' has'} missing or poor meta descriptions`,
      whyItMatters: 'Meta descriptions appear in search results. Generic or missing descriptions reduce click-through from Google.',
      howToFix: 'Write unique, compelling meta descriptions for each page (150-160 chars).',
      codeExample: `<meta name="description" content="Your unique page description">`,
      owner: 'Content / SEO',
      effort: '20–40 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
    missing_sitemap: {
      title: 'Add sitemap.xml',
      description: 'No sitemap found',
      whyItMatters: 'Search engines use sitemaps to discover and index your pages efficiently.',
      howToFix: 'Generate and upload a sitemap.xml file to your root domain.',
      codeExample: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2026-05-19</lastmod>
  </url>
</urlset>`,
      owner: 'Frontend / DevOps',
      effort: '5–10 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
    missing_robots_txt: {
      title: 'Add robots.txt',
      description: 'No robots.txt found',
      whyItMatters: 'Robots.txt tells crawlers which parts of your site to index. Missing it may confuse search engines.',
      howToFix: 'Create a robots.txt file in your site root.',
      codeExample: `User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml`,
      owner: 'Frontend / DevOps',
      effort: '5 minutes',
      launchImpact: 'Low',
      canShipWithout: true,
    },
    missing_favicon: {
      title: 'Add favicon',
      description: 'No favicon found',
      whyItMatters: 'Browsers show a generic icon without a favicon. Looks unprofessional in tabs and bookmarks.',
      howToFix: 'Add a favicon.ico and link tag in your HTML head.',
      codeExample: `<link rel="icon" href="/favicon.ico">`,
      owner: 'Design / Frontend',
      effort: '10 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
    broken_internal_link: {
      title: 'Fix broken internal links',
      description: `${count} broken internal link${count > 1 ? 's' : ''}`,
      whyItMatters: 'Broken links create dead ends and frustrate users. Major red flag for launch readiness.',
      howToFix: 'Update or remove broken links. Verify all internal navigation works.',
      owner: 'Frontend',
      effort: '15–30 minutes',
      launchImpact: 'High',
      canShipWithout: false,
    },
    broken_external_link: {
      title: 'Fix broken external links',
      description: `${count} broken external link${count > 1 ? 's' : ''}`,
      whyItMatters: 'External broken links look sloppy and may indicate outdated content.',
      howToFix: 'Verify external URLs. Update or remove broken links.',
      owner: 'Content',
      effort: '10–20 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
    missing_viewport: {
      title: 'Add mobile viewport tag',
      description: `${count} page${count > 1 ? 's are' : ' is'} missing viewport configuration`,
      whyItMatters: 'Without viewport tags, your site won\'t display properly on mobile devices.',
      howToFix: 'Add viewport meta tag to all pages.',
      codeExample: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
      owner: 'Frontend',
      effort: '5 minutes',
      launchImpact: 'High',
      canShipWithout: false,
    },
    duplicate_title: {
      title: 'Fix duplicate page titles',
      description: `${count} pages share the same title`,
      whyItMatters: 'AI-generated sites often reuse the same title across all pages. Search engines and users need unique titles.',
      howToFix: 'Write unique, descriptive titles for each page.',
      owner: 'Content / SEO',
      effort: '20–40 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
    duplicate_meta_description: {
      title: 'Fix duplicate meta descriptions',
      description: `${count} pages share the same meta description`,
      whyItMatters: 'Duplicate descriptions reduce SEO effectiveness and make pages less discoverable.',
      howToFix: 'Write unique meta descriptions for each page.',
      owner: 'Content / SEO',
      effort: '20–40 minutes',
      launchImpact: 'Medium',
      canShipWithout: true,
    },
  };

  const template = templates[code];
  if (!template) {
    // Generic fallback
    return {
      id: code,
      title: issues[0].message,
      description: `${count} instance${count > 1 ? 's' : ''}`,
      whyItMatters: 'This may affect your launch readiness.',
      howToFix: 'Review and fix the affected pages.',
      affectedPages,
      issueCount: count,
      severity: severity === 'critical' ? 'blocker' : severity === 'warning' ? 'needs-fix' : 'info',
      owner: 'Team',
      effort: 'Unknown',
      launchImpact: 'Medium',
      canShipWithout: severity !== 'critical',
    };
  }

  return {
    id: code,
    affectedPages,
    issueCount: count,
    severity: severity === 'critical' ? 'blocker' : severity === 'warning' ? 'needs-fix' : 'info',
    ...template,
  } as ActionCard;
}

/**
 * Generate AI fix prompt from action cards
 */
export function generateAIFixPrompt(
  actions: ActionCard[],
  siteUrl: string,
  launchDecision: string
): string {
  const blockers = actions.filter(a => a.severity === 'blocker');
  const needsFix = actions.filter(a => a.severity === 'needs-fix');

  let prompt = `You are working on my website at ${siteUrl}. DO NOT redesign the UI or change the visual styling. Fix ONLY the launch readiness issues found by VibeSiteScan.\n\n`;
  
  prompt += `Launch Status: ${launchDecision}\n\n`;

  if (blockers.length > 0) {
    prompt += `CRITICAL BLOCKERS (fix these first):\n`;
    blockers.forEach((action, i) => {
      prompt += `${i + 1}. ${action.title}\n`;
      prompt += `   - ${action.description}\n`;
      prompt += `   - Affects: ${action.affectedPages.slice(0, 3).join(', ')}${action.affectedPages.length > 3 ? ` +${action.affectedPages.length - 3} more` : ''}\n`;
      if (action.codeExample) {
        prompt += `   - Add: ${action.codeExample.split('\n')[0]}\n`;
      }
      prompt += `\n`;
    });
  }

  if (needsFix.length > 0) {
    prompt += `NEEDS FIX BEFORE SHARING:\n`;
    needsFix.slice(0, 5).forEach((action, i) => {
      prompt += `${i + 1}. ${action.title}\n`;
      prompt += `   - ${action.description}\n`;
      prompt += `   - Affects: ${action.affectedPages.slice(0, 3).join(', ')}${action.affectedPages.length > 3 ? ` +${action.affectedPages.length - 3} more` : ''}\n`;
      if (action.codeExample) {
        prompt += `   - Example: ${action.codeExample.split('\n').slice(0, 2).join(' ')}\n`;
      }
      prompt += `\n`;
    });
  }

  prompt += `REQUIREMENTS:\n`;
  prompt += `- Preserve all existing UI and functionality\n`;
  prompt += `- Add metadata properly to HTML <head>\n`;
  prompt += `- Create OG images if missing (1200x630px recommended)\n`;
  prompt += `- Add sitemap.xml and robots.txt to public root\n`;
  prompt += `- Fix broken links\n`;
  prompt += `- Ensure mobile viewport is set\n`;
  prompt += `- Do not break existing features\n\n`;

  prompt += `After changes, explain:\n`;
  prompt += `1. What files were modified\n`;
  prompt += `2. What was added/fixed\n`;
  prompt += `3. What to verify manually\n`;

  return prompt;
}
