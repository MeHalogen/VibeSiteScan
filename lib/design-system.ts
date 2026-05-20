/**
 * LaunchScan Design System
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

// Pipeline stage weights for progress calculation
export const stageWeights = {
  init: 5,
  fetch: 10,
  discover: 12,
  crawl: 18,
  links: 15,
  seo: 8,
  social: 8,
  forms: 5,
  browser: 4,
  score: 5,
  report: 10,
};

export function calculateProgress(stages: Array<{ id: string; status: string }>): number {
  const totalWeight = Object.values(stageWeights).reduce((a, b) => a + b, 0);
  const completedWeight = stages.reduce((sum, stage) => {
    const weight = stageWeights[stage.id as keyof typeof stageWeights] || 0;
    const done =
      stage.status === 'completed' ||
      stage.status === 'warning' ||
      stage.status === 'done';
    return sum + (done ? weight : 0);
  }, 0);
  return Math.round((completedWeight / totalWeight) * 100);
}
