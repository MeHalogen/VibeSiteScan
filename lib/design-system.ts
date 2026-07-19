/**
 * VibeSiteScan Design System
 * Professional forensic audit tool design
 */

export const colors = {
  // Base
  bgBase: '#0A0E1A',
  surface: '#111827',
  surfaceElevated: '#1A2233',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderEmphasis: 'rgba(255,255,255,0.14)',
  
  // Primary (Teal)
  tealPrimary: '#1D9E75',
  tealMuted: '#0F6E56',
  tealGlow: 'rgba(29,158,117,0.15)',
  
  // Status
  red: '#E24B4A',
  amber: '#EF9F27',
  blue: '#378ADD',
  
  // Text
  textPrimary: '#F0F4FF',
  textSecondary: 'rgba(240,244,255,0.55)',
  textTertiary: 'rgba(240,244,255,0.3)',
};

export const typography = {
  // Font families
  mono: 'var(--font-geist-mono)',
  sans: 'var(--font-geist-sans)',
  
  // Font sizes
  h1: '32px',
  h2: '24px',
  statLarge: '48px',
  statMedium: '28px',
  body: '14px',
  small: '12px',
  tiny: '11px',
  label: '10px',
  
  // Font weights
  normal: '400',
  medium: '500',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const radius = {
  default: '6px',
  card: '10px',
  pill: '99px',
};

export const animations = {
  fast: '150ms',
  medium: '250ms',
  slow: '300ms',
  scoreFill: '800ms',
};

// Stage status colors
export const stageStatus = {
  idle: colors.textTertiary,
  running: colors.blue,
  done: colors.tealPrimary,
  warning: colors.amber,
  fail: colors.red,
};

// Score tier colors and labels
export const scoreTiers = {
  critical: { min: 0, max: 39, color: colors.red, label: 'CRITICAL' },
  needsWork: { min: 40, max: 69, color: colors.amber, label: 'NEEDS WORK' },
  almost: { min: 70, max: 89, color: colors.blue, label: 'ALMOST' },
  certified: { min: 90, max: 100, color: colors.tealPrimary, label: 'CERTIFIED' },
};

export function getScoreTier(score: number) {
  if (score < 40) return scoreTiers.critical;
  if (score < 70) return scoreTiers.needsWork;
  if (score < 90) return scoreTiers.almost;
  return scoreTiers.certified;
}

// Pipeline stage weights for progress calculation (rough relative durations)
export const stageWeights: Record<string, number> = {
  init: 3,
  score: 4,
  fetch: 8,
  discover: 8,
  crawl: 16,
  links: 14,
  browser: 10,
  seo: 6,
  social: 4,
  forms: 4,
  exposure: 4,
  ai_leftovers: 3,
  keys: 4,
  form_analysis: 3,
  security: 6,
  performance: 5,
  report: 6,
};

const DEFAULT_STAGE_WEIGHT = 5;

/**
 * Weighted scan progress. The denominator is derived from the stages actually
 * passed in (not the static weight map), so the math stays correct if the
 * stage list changes. Skipped stages count as resolved — a quick scan that
 * skips the crawl still reaches 100%.
 */
export function calculateProgress(stages: Array<{ id: string; status: string }>): number {
  if (stages.length === 0) return 0;
  let totalWeight = 0;
  let resolvedWeight = 0;
  for (const stage of stages) {
    const weight = stageWeights[stage.id] ?? DEFAULT_STAGE_WEIGHT;
    totalWeight += weight;
    const resolved =
      stage.status === 'completed' ||
      stage.status === 'warning' ||
      stage.status === 'done' ||
      stage.status === 'failed' ||
      stage.status === 'skipped';
    if (resolved) resolvedWeight += weight;
  }
  return Math.round((resolvedWeight / totalWeight) * 100);
}
