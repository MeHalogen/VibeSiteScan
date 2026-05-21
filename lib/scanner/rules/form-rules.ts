/**
 * Enhanced Form Rules — Rule Engine
 *
 * Analyzes detected forms for launch readiness issues:
 * - Missing action/method
 * - No email input type validation
 * - No spam protection signal
 * - No success state detectable
 * - Password fields with no security signals
 */

import * as cheerio from 'cheerio';

export interface DetectedForm {
  pageUrl: string;
  path: string;
  formIndex: number;
  action?: string;
  method?: string;
  fields: Array<{
    name?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    autocomplete?: string;
  }>;
  hasEmailField: boolean;
  hasPasswordField: boolean;
  hasRequiredFields: boolean;
  hasSubmitButton: boolean;
  hasSpamProtectionSignal: boolean;
  spamProtectionType?: string;
  hasSuccessStateSignal: boolean;
  successStateType?: string;
}

export interface FormFinding {
  id: string;
  ruleId: string;
  category: 'forms';
  severity: 'warning' | 'info';
  title: string;
  description: string;
  whyItMatters: string;
  pageUrl: string;
  path: string;
  evidence: Record<string, any>;
  fixSummary: string;
  fixPrompt: string;
}

// ─── Spam protection signals ──────────────────────────────────────────────────

const SPAM_PROTECTION_SIGNALS = [
  // Cloudflare Turnstile
  { pattern: /turnstile|cf-turnstile/i, label: 'Cloudflare Turnstile' },
  // Google reCAPTCHA
  { pattern: /recaptcha|g-recaptcha/i, label: 'Google reCAPTCHA' },
  // hCaptcha
  { pattern: /hcaptcha|h-captcha/i, label: 'hCaptcha' },
  // Honeypot
  { pattern: /honeypot|hp-field|bot-check|antispam/i, label: 'Honeypot field' },
  // Generic CAPTCHA
  { pattern: /captcha/i, label: 'CAPTCHA' },
  // Netlify spam filter
  { pattern: /netlify|data-netlify-honeypot/i, label: 'Netlify spam protection' },
  // Formspree
  { pattern: /formspree/i, label: 'Formspree spam protection' },
];

// ─── Success state signals ────────────────────────────────────────────────────

const SUCCESS_STATE_SIGNALS = [
  { pattern: /thank\s+you/i, label: 'Thank you message' },
  { pattern: /success/i, label: 'Success indicator' },
  { pattern: /submitted\b/i, label: 'Submitted state' },
  { pattern: /message\s+sent/i, label: 'Message sent indicator' },
  { pattern: /we.ll\s+(be\s+in\s+touch|get\s+back|contact)/i, label: 'Follow-up message' },
  { pattern: /confirmation/i, label: 'Confirmation message' },
  { pattern: /received/i, label: 'Receipt confirmation' },
];

// ─── Form extractor ───────────────────────────────────────────────────────────

function getPath(url: string): string {
  try { return new URL(url).pathname; } catch { return url; }
}

export function extractDetectedForms(url: string, html: string): DetectedForm[] {
  const $ = cheerio.load(html);
  const forms: DetectedForm[] = [];
  const path = getPath(url);

  // Detect spam protection at page level (not just per-form)
  const pageHtmlLower = html.toLowerCase();
  let pageSpamProtection: { detected: boolean; type?: string } = { detected: false };
  for (const sp of SPAM_PROTECTION_SIGNALS) {
    if (sp.pattern.test(html)) {
      pageSpamProtection = { detected: true, type: sp.label };
      break;
    }
  }

  // Detect success state at page level
  const pageText = $.text();
  let pageSuccessState: { detected: boolean; type?: string } = { detected: false };
  for (const ss of SUCCESS_STATE_SIGNALS) {
    if (ss.pattern.test(pageText)) {
      pageSuccessState = { detected: true, type: ss.label };
      break;
    }
  }

  $('form').each((formIndex, formEl) => {
    const $form = $(formEl);
    const formHtml = $.html(formEl) || '';

    const action = $form.attr('action') || undefined;
    const method = ($form.attr('method') || 'get').toLowerCase();

    const fields: DetectedForm['fields'] = [];
    let hasEmailField = false;
    let hasPasswordField = false;
    let hasRequiredFields = false;
    let hasSubmitButton = false;

    $form.find('input, textarea, select').each((_, inputEl) => {
      const $input = $(inputEl);
      const type = ($input.attr('type') || 'text').toLowerCase();
      const name = $input.attr('name') || undefined;
      const placeholder = $input.attr('placeholder') || undefined;
      const required = $input.attr('required') !== undefined;
      const autocomplete = $input.attr('autocomplete') || undefined;

      if (type === 'email') hasEmailField = true;
      if (type === 'password') hasPasswordField = true;
      if (required) hasRequiredFields = true;
      if (type === 'submit') hasSubmitButton = true;

      if (type !== 'hidden' && type !== 'submit') {
        fields.push({ name, type, placeholder, required, autocomplete });
      }
    });

    // Also check for button submit
    if ($form.find('button[type="submit"], button:not([type])').length > 0) {
      hasSubmitButton = true;
    }

    // Spam protection — check form's own HTML first, fallback to page-level
    let hasSpamProtectionSignal = false;
    let spamProtectionType: string | undefined;
    for (const sp of SPAM_PROTECTION_SIGNALS) {
      if (sp.pattern.test(formHtml)) {
        hasSpamProtectionSignal = true;
        spamProtectionType = sp.label;
        break;
      }
    }
    if (!hasSpamProtectionSignal && pageSpamProtection.detected) {
      hasSpamProtectionSignal = true;
      spamProtectionType = pageSpamProtection.type;
    }

    // Success state — use page-level signal
    const hasSuccessStateSignal = pageSuccessState.detected;
    const successStateType = pageSuccessState.type;

    forms.push({
      pageUrl: url,
      path,
      formIndex,
      action,
      method,
      fields,
      hasEmailField,
      hasPasswordField,
      hasRequiredFields,
      hasSubmitButton,
      hasSpamProtectionSignal,
      spamProtectionType,
      hasSuccessStateSignal,
      successStateType,
    });
  });

  return forms;
}

// ─── Generate form findings ───────────────────────────────────────────────────

export function generateFormFindings(forms: DetectedForm[]): FormFinding[] {
  const findings: FormFinding[] = [];

  for (const form of forms) {
    const formLabel = `Form ${form.formIndex + 1} on ${form.path}`;

    // Missing action
    if (!form.action) {
      findings.push({
        id: `form_no_action_${form.pageUrl}_${form.formIndex}`,
        ruleId: 'form_without_action',
        category: 'forms',
        severity: 'warning',
        title: `Form has no action attribute`,
        description: `${formLabel} has no action attribute. Without an action, form submission may fail or silently do nothing.`,
        whyItMatters: 'Forms without an action may not submit data correctly, leaving users confused about whether their submission worked.',
        pageUrl: form.pageUrl,
        path: form.path,
        evidence: { formIndex: form.formIndex, method: form.method, fields: form.fields.length },
        fixSummary: `Add an action attribute to the form pointing to the correct handler endpoint.`,
        fixPrompt: `The form at index ${form.formIndex} on ${form.path} has no action attribute. Add action="/api/submit" (or the correct endpoint) to the <form> tag. Ensure the endpoint handles the submission and returns a success response. Do not change unrelated styles.`,
      });
    }

    // Contact/email forms with no spam protection
    if (form.hasEmailField && !form.hasSpamProtectionSignal) {
      findings.push({
        id: `form_no_spam_${form.pageUrl}_${form.formIndex}`,
        ruleId: 'contact_form_no_spam_protection',
        category: 'forms',
        severity: 'info',
        title: `No spam protection signal detected on form`,
        description: `${formLabel} accepts email input but no spam protection (reCAPTCHA, Turnstile, honeypot) was detected in the page source.`,
        whyItMatters: 'Forms without spam protection are targets for automated bots. This may be normal if server-side spam filtering is in use, but it\'s worth verifying.',
        pageUrl: form.pageUrl,
        path: form.path,
        evidence: { formIndex: form.formIndex, hasEmailField: true, spamProtectionFound: false },
        fixSummary: 'Add spam protection (Cloudflare Turnstile, reCAPTCHA, or a honeypot field) to this form.',
        fixPrompt: `The form on ${form.path} has an email field but no visible spam protection. Add Cloudflare Turnstile or a honeypot input to reduce spam submissions. For Turnstile: add <div class="cf-turnstile" data-sitekey="YOUR_KEY"></div> inside the form. Do not change other form fields or styling.`,
      });
    }

    // No success state detectable
    if (form.hasSubmitButton && !form.hasSuccessStateSignal) {
      findings.push({
        id: `form_no_success_${form.pageUrl}_${form.formIndex}`,
        ruleId: 'form_no_success_state_detected',
        category: 'forms',
        severity: 'info',
        title: `No visible success state detected for form`,
        description: `${formLabel} has a submit button, but no success message ("Thank you", "Submitted", etc.) was detected in the static page source.`,
        whyItMatters: 'Users need confirmation that their submission worked. A missing success state causes confusion and repeat submissions.',
        pageUrl: form.pageUrl,
        path: form.path,
        evidence: { formIndex: form.formIndex, hasSubmitButton: true, successStateFound: false },
        fixSummary: 'Add a visible success state that appears after the form is submitted.',
        fixPrompt: `The form on ${form.path} appears to have no visible success state. After submission, show a clear message like "Thank you! We'll be in touch." Use conditional rendering to swap the form for the success message after a successful API response. Do not change unrelated UI.`,
      });
    }

    // Email field not typed as email
    for (const field of form.fields) {
      if (
        field.name?.toLowerCase().includes('email') &&
        field.type !== 'email'
      ) {
        findings.push({
          id: `form_email_type_${form.pageUrl}_${form.formIndex}_${field.name}`,
          ruleId: 'email_input_missing_type_email',
          category: 'forms',
          severity: 'info',
          title: `Email field not using type="email"`,
          description: `${formLabel} has a field named "${field.name}" but its type is "${field.type || 'text'}" instead of "email". This skips browser email validation.`,
          whyItMatters: 'Using type="email" enables browser-level validation and mobile keyboard optimization.',
          pageUrl: form.pageUrl,
          path: form.path,
          evidence: { formIndex: form.formIndex, fieldName: field.name, currentType: field.type },
          fixSummary: `Change the input type to "email" for the "${field.name}" field.`,
          fixPrompt: `Find the input field named "${field.name}" in the form on ${form.path}. Change its type from "${field.type || 'text'}" to "email". This enables browser email format validation. Do not change any other form fields or styles.`,
        });
      }
    }
  }

  return findings;
}
