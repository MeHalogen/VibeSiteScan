/**
 * Client-Side Key & Secret Pattern Detector — Rule Engine
 *
 * Scans HTML source and inline script content for patterns that look like
 * API keys, secrets, tokens, or credentials.
 *
 * IMPORTANT: Values are always masked before being stored or shown.
 * We never store or log full secret values.
 *
 * Classification:
 *   high_confidence_secret → critical   (e.g. sk-..., PRIVATE_KEY, AWS_SECRET)
 *   possible_secret        → warning    (e.g. API_SECRET, TOKEN with value)
 *   public_client_key      → info/warning (e.g. NEXT_PUBLIC_, VITE_, publishable keys)
 */

export type KeyConfidence = 'high_confidence_secret' | 'possible_secret' | 'public_client_key';

export interface KeyPatternFinding {
  id: string;
  ruleId: string;
  category: 'key_patterns';
  severity: 'critical' | 'warning' | 'info';
  confidence: KeyConfidence;
  title: string;
  description: string;
  whyItMatters: string;
  pageUrl: string;
  path: string;
  evidence: {
    pattern: string;
    maskedValue: string;
    location: 'html' | 'inline_script' | 'script_src';
    context?: string;
  };
  fixSummary: string;
  fixPrompt: string;
}

// ─── Pattern definitions ──────────────────────────────────────────────────────

interface KeyPattern {
  id: string;
  pattern: RegExp;
  label: string;
  confidence: KeyConfidence;
  isPublicSafe?: boolean; // true = this might be intentionally public
}

const KEY_PATTERNS: KeyPattern[] = [
  // ── High confidence secrets ────────────────────────────────────────────────
  {
    id: 'openai_api_key',
    pattern: /sk-[a-zA-Z0-9\-_]{20,}/,
    label: 'OpenAI API Key',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'stripe_secret_key',
    pattern: /sk_(?:live|test)_[a-zA-Z0-9]{20,}/,
    label: 'Stripe Secret Key',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'aws_secret_key',
    pattern: /(?:AWS_SECRET_ACCESS_KEY|aws_secret_access_key)\s*[:=]\s*["']?([A-Za-z0-9\/+]{40})["']?/,
    label: 'AWS Secret Access Key',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'aws_access_key',
    pattern: /(?:AKIA|AIPA|ASIA|AROA)[A-Z0-9]{16}/,
    label: 'AWS Access Key ID',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'private_key_pem',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
    label: 'Private Key (PEM format)',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'supabase_service_role',
    pattern: /(?:SUPABASE_SERVICE_ROLE_KEY|service_role)\s*[:=]\s*["']?(eyJ[a-zA-Z0-9_\-.]{50,})["']?/,
    label: 'Supabase Service Role Key',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'resend_api_key',
    pattern: /re_[a-zA-Z0-9]{32,}/,
    label: 'Resend API Key',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'sendgrid_api_key',
    pattern: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/,
    label: 'SendGrid API Key',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'github_token',
    pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/,
    label: 'GitHub Personal Access Token',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'jwt_secret_assignment',
    pattern: /JWT_SECRET\s*[:=]\s*["']([^"']{8,})["']/i,
    label: 'JWT Secret Key assignment',
    confidence: 'high_confidence_secret',
  },
  {
    id: 'database_url',
    pattern: /(?:DATABASE_URL|DB_URL|MONGODB_URI|POSTGRES_URL|MYSQL_URL)\s*[:=]\s*["']?((?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis):\/\/[^"'\s]{10,})["']?/i,
    label: 'Database Connection URL',
    confidence: 'high_confidence_secret',
  },

  // ── Possible secrets ───────────────────────────────────────────────────────
  {
    id: 'generic_secret',
    pattern: /(?:SECRET_KEY|API_SECRET|APP_SECRET|PRIVATE_TOKEN|ACCESS_TOKEN|AUTH_TOKEN)\s*[:=]\s*["']([^"']{8,})["']/i,
    label: 'Generic secret/token assignment',
    confidence: 'possible_secret',
  },
  {
    id: 'generic_api_key',
    pattern: /(?:API_KEY|APIKEY)\s*[:=]\s*["']([^"']{16,})["']/i,
    label: 'Generic API Key assignment',
    confidence: 'possible_secret',
  },
  {
    id: 'bearer_token',
    pattern: /(?:Authorization|Bearer)\s*[:=]\s*["']?(Bearer\s+[a-zA-Z0-9\-_.]{20,})["']?/i,
    label: 'Bearer token in source',
    confidence: 'possible_secret',
  },

  // ── Public client keys (may be intentional) ────────────────────────────────
  {
    id: 'next_public_supabase_url',
    pattern: /NEXT_PUBLIC_SUPABASE_URL\s*[:=]\s*["']?(https:\/\/[a-zA-Z0-9]+\.supabase\.co)["']?/i,
    label: 'Next.js public Supabase URL',
    confidence: 'public_client_key',
    isPublicSafe: true,
  },
  {
    id: 'next_public_supabase_anon',
    pattern: /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*[:=]\s*["']?(eyJ[a-zA-Z0-9_\-.]{30,})["']?/i,
    label: 'Next.js public Supabase Anon Key',
    confidence: 'public_client_key',
    isPublicSafe: true,
  },
  {
    id: 'vite_firebase',
    pattern: /VITE_FIREBASE_API_KEY\s*[:=]\s*["']?([A-Za-z0-9\-_]{30,})["']?/i,
    label: 'Vite Firebase API Key',
    confidence: 'public_client_key',
    isPublicSafe: true,
  },
  {
    id: 'firebase_api_key',
    pattern: /apiKey:\s*["']([A-Za-z0-9\-_]{30,})["']/,
    label: 'Firebase Web API Key',
    confidence: 'public_client_key',
    isPublicSafe: true,
  },
  {
    id: 'stripe_publishable_key',
    pattern: /pk_(?:live|test)_[a-zA-Z0-9]{20,}/,
    label: 'Stripe Publishable Key',
    confidence: 'public_client_key',
    isPublicSafe: true,
  },
];

// ─── Value masker ─────────────────────────────────────────────────────────────

function maskValue(value: string): string {
  if (!value || value.length <= 8) return '***';
  const prefix = value.slice(0, 4);
  const suffix = value.slice(-4);
  return `${prefix}${'*'.repeat(Math.min(value.length - 8, 20))}${suffix}`;
}

// ─── Context extractor ────────────────────────────────────────────────────────

function extractContext(source: string, match: RegExpMatchArray, windowSize = 80): string {
  const idx = match.index ?? 0;
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(source.length, idx + (match[0]?.length ?? 0) + windowSize);
  return '…' + source.slice(start, end).replace(/\s+/g, ' ').trim() + '…';
}

// ─── Extract inline scripts ───────────────────────────────────────────────────

function extractInlineScripts(html: string): string[] {
  const scripts: string[] = [];
  const scriptRegex = /<script(?:\s[^>]*)?>([^]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    if (m[1]) scripts.push(m[1]);
  }
  return scripts;
}

// ─── Main detector ────────────────────────────────────────────────────────────

export function detectKeyPatterns(
  pages: Array<{ url: string; html?: string }>
): KeyPatternFinding[] {
  const findings: KeyPatternFinding[] = [];
  const seenSignatures = new Set<string>();

  for (const page of pages) {
    if (!page.html) continue;

    const path = (() => { try { return new URL(page.url).pathname; } catch { return page.url; } })();

    // ── Scan the full HTML source ─────────────────────────────────────────────
    for (const kp of KEY_PATTERNS) {
      const match = page.html.match(kp.pattern);
      if (!match) continue;

      // Extract the actual value — either full match or capture group 1
      const rawValue = match[1] ?? match[0];
      const maskedValue = maskValue(rawValue);

      // De-duplicate: same pattern + same masked value + same page
      const sig = `${kp.id}::${maskedValue}::${page.url}`;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);

      const severity: 'critical' | 'warning' | 'info' =
        kp.confidence === 'high_confidence_secret'
          ? 'critical'
          : kp.confidence === 'possible_secret'
          ? 'warning'
          : 'info';

      const description =
        kp.confidence === 'high_confidence_secret'
          ? `A potential secret-like value was found in client-side source on ${path}. Pattern matched: ${kp.label}. Value: ${maskedValue}. Review before sharing.`
          : kp.confidence === 'possible_secret'
          ? `A possible secret or token was found in client-side source on ${path}. Pattern matched: ${kp.label}. This may be a false positive — review carefully.`
          : `A public client key was found in client-side source on ${path}. Pattern matched: ${kp.label}. This may be intentional — verify your backend access rules (e.g. RLS, API restrictions).`;

      const whyItMatters =
        kp.confidence === 'high_confidence_secret'
          ? 'Secret keys in client-side code can be extracted by anyone. Rotate the key immediately if it is truly private.'
          : kp.confidence === 'possible_secret'
          ? 'Tokens or API keys in client-side source may allow unauthorized access depending on the service.'
          : 'Public client keys (like Firebase or Supabase anon keys) are often intentionally public, but they should be restricted by backend rules (Firebase security rules, Supabase Row Level Security, etc.).';

      const fixSummary =
        kp.confidence === 'high_confidence_secret'
          ? `Move ${kp.label} to server-side environment variables. Rotate the key if it may have been exposed.`
          : kp.confidence === 'possible_secret'
          ? `Review and move ${kp.label} to server-side environment variables.`
          : `Verify ${kp.label} has proper backend access restrictions (RLS, API key restrictions, etc.).`;

      const fixPrompt =
        kp.confidence === 'high_confidence_secret'
          ? `A potential secret was found in client-side code on ${path}. Pattern: ${kp.label}. Move this key to a server-side environment variable (e.g. .env.local, not NEXT_PUBLIC_). It should never appear in client-side JavaScript bundles. If this key has been exposed, rotate it immediately in your service provider dashboard. Do not commit secrets to version control.`
          : kp.confidence === 'possible_secret'
          ? `A possible token or secret was found in client-side source on ${path}. Pattern: ${kp.label}. Verify this is not a private key — if it is, move it to a server-side environment variable. If it must be used in the browser, ensure the service has restrictive access controls.`
          : `A public client key (${kp.label}) was found in client-side source on ${path}. This may be intentional, but verify your backend access rules are correct: Supabase RLS should be enabled, Firebase security rules should restrict access, API keys should have domain restrictions. Do not change anything without testing.`;

      findings.push({
        id: `key_${kp.id}_${page.url}`,
        ruleId: kp.id,
        category: 'key_patterns',
        severity,
        confidence: kp.confidence,
        title: kp.label,
        description,
        whyItMatters,
        pageUrl: page.url,
        path,
        evidence: {
          pattern: kp.id,
          maskedValue,
          location: 'html',
          context: extractContext(page.html, match),
        },
        fixSummary,
        fixPrompt,
      });
    }

    // ── Also scan inline scripts separately for better context ────────────────
    const scripts = extractInlineScripts(page.html);
    for (let si = 0; si < scripts.length; si++) {
      const script = scripts[si];
      for (const kp of KEY_PATTERNS) {
        const match = script.match(kp.pattern);
        if (!match) continue;

        const rawValue = match[1] ?? match[0];
        const maskedValue = maskValue(rawValue);
        const sig = `${kp.id}::${maskedValue}::${page.url}::script${si}`;
        if (seenSignatures.has(sig)) continue;
        seenSignatures.add(sig);

        // Only add if we haven't already flagged the same pattern on this page from full HTML scan
        const pageSig = `${kp.id}::${maskedValue}::${page.url}`;
        if (seenSignatures.has(pageSig)) continue;
        seenSignatures.add(pageSig);

        // (duplicate of above block — inline script path)
        const severity: 'critical' | 'warning' | 'info' =
          kp.confidence === 'high_confidence_secret' ? 'critical'
          : kp.confidence === 'possible_secret' ? 'warning'
          : 'info';

        findings.push({
          id: `key_inline_${kp.id}_${si}_${page.url}`,
          ruleId: kp.id,
          category: 'key_patterns',
          severity,
          confidence: kp.confidence,
          title: `${kp.label} (inline script)`,
          description: `Found in inline <script> tag on ${path}. Masked value: ${maskedValue}`,
          whyItMatters: 'Inline scripts are sent to every visitor\'s browser.',
          pageUrl: page.url,
          path,
          evidence: {
            pattern: kp.id,
            maskedValue,
            location: 'inline_script',
            context: extractContext(script, match),
          },
          fixSummary: `Move ${kp.label} out of inline scripts and into server-side code.`,
          fixPrompt: `A key pattern (${kp.label}) was found in an inline <script> tag on ${path}. Move this value to server-side environment variables and access it only through server-side API routes.`,
        });
      }
    }
  }

  return findings;
}
