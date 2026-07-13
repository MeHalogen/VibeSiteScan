/**
 * VibeSiteScan Certification — the "green light" and the slab grading.
 *
 * SINGLE SOURCE OF TRUTH. The gate (PASS / CONDITIONAL / FAIL / UNVERIFIED)
 * and the per-pillar A–F grades are computed here, deterministically, from the
 * genuine launch-readiness result + the real issue list. No randomness, no
 * cosmetic fudging — the same scan always yields the same certificate.
 *
 * Gate policy (strict, chosen by product):
 *   PASS         → coverage ≥ 60, ZERO critical issues, ZERO security blockers,
 *                  ZERO security warnings, and score ≥ 80. This is the stamp:
 *                  it means "security-clean and launch-ready".
 *   CONDITIONAL  → scanned and no hard blockers, but has needs-fix items,
 *                  security warnings, or coverage 40–60. Ship at your own call.
 *   FAIL         → any critical issue, any security blocker, or score < 60.
 *   UNVERIFIED   → we could not verify enough of the site to make a claim
 *                  (coverage < 40 or diagnostic-only). Not a judgement of the
 *                  site — a statement about what we could see.
 */

export type CertificationGate = 'pass' | 'conditional' | 'fail' | 'unverified';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface PillarGrade {
  key: string;
  label: string;
  /** null when the pillar could not be assessed (no coverage, not applicable). */
  grade: Grade | null;
  /** 0–100 sub-score, null when not assessed. */
  subScore: number | null;
  blockers: number;
  warnings: number;
  infos: number;
  /** Most severe issue title in this pillar, for a one-line summary. */
  topIssue?: string;
  notAssessedReason?: string;
}

export interface Certification {
  gate: CertificationGate;
  /** Overall A–F grade (null when unverified). */
  overallGrade: Grade | null;
  /** Short, honest headline reason for the gate. */
  headline: string;
  /** Bullet reasons that determined the gate. */
  reasons: string[];
  pillars: PillarGrade[];
  scannedAt: string;
  coverage: number;
  score: number | null;
  /** Counts that drove the gate, surfaced for transparency. */
  criticalCount: number;
  securityBlockers: number;
  securityWarnings: number;
}

interface IssueLike {
  issueCode?: string;
  severity?: 'critical' | 'warning' | 'info' | string;
  category?: string;
  title?: string;
}

interface CoverageCategoryLike {
  name: string;
  status: string;
}

interface LaunchReadinessLike {
  launchReadinessScore: number | null;
  scanCoverage: number;
  scoreMode?: string;
  launchDecision?: string;
  coverageDetails?: { categories?: CoverageCategoryLike[] };
}

// ── Pillar definitions ────────────────────────────────────────────────────────

const INDEXING_CODES = new Set([
  'missing_robots_txt',
  'missing_sitemap',
  'missing_canonical',
  'noindex_on_homepage',
  'noindex_detected',
  'robots_noindex',
]);

interface PillarDef {
  key: string;
  label: string;
  /** Coverage category names that indicate this pillar was assessed. */
  coverageNames: string[];
  /** Returns true if an issue belongs to this pillar. */
  match: (issue: IssueLike) => boolean;
  /** If false, a pillar with no coverage is marked not-applicable rather than A. */
  gradeWhenEmpty: boolean;
}

const PILLARS: PillarDef[] = [
  {
    key: 'security',
    label: 'Security',
    coverageNames: ['Security Headers & Transport'],
    match: (i) => i.category === 'security',
    gradeWhenEmpty: true,
  },
  {
    key: 'seo',
    label: 'SEO & Metadata',
    coverageNames: ['Metadata Checks'],
    match: (i) => i.category === 'seo' && !INDEXING_CODES.has(i.issueCode || ''),
    gradeWhenEmpty: true,
  },
  {
    key: 'share',
    label: 'Share Preview',
    coverageNames: ['Share Preview Checks'],
    match: (i) => i.category === 'social',
    gradeWhenEmpty: true,
  },
  {
    key: 'links',
    label: 'Links & Routes',
    coverageNames: ['Internal Link Checks', 'External Link Checks'],
    match: (i) => i.category === 'links',
    gradeWhenEmpty: true,
  },
  {
    key: 'performance',
    label: 'Performance',
    coverageNames: ['Performance Signals'],
    match: (i) => i.category === 'performance',
    gradeWhenEmpty: true,
  },
  {
    key: 'indexing',
    label: 'Indexing',
    coverageNames: ['Indexing Checks', 'Sitemap & Robots Checks'],
    match: (i) => INDEXING_CODES.has(i.issueCode || ''),
    gradeWhenEmpty: true,
  },
  {
    key: 'content',
    label: 'Forms & Content',
    coverageNames: ['Form Structure Checks', 'Image & Accessibility Basics'],
    match: (i) =>
      ['forms', 'accessibility', 'branding', 'mobile', 'technical'].includes(i.category || ''),
    gradeWhenEmpty: false, // no forms/content found → not applicable, not an automatic A
  },
];

const SEVERITY_PENALTY: Record<string, number> = { critical: 45, warning: 12, info: 3 };

function letterFromScore(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function coverageAssessed(
  names: string[],
  categories: CoverageCategoryLike[]
): boolean {
  return names.some((n) => {
    const cat = categories.find((c) => c.name === n);
    return cat && (cat.status === 'verified' || cat.status === 'partial');
  });
}

function gradePillar(
  def: PillarDef,
  issues: IssueLike[],
  categories: CoverageCategoryLike[]
): PillarGrade {
  const mine = issues.filter(def.match);
  const blockers = mine.filter((i) => i.severity === 'critical').length;
  const warnings = mine.filter((i) => i.severity === 'warning').length;
  const infos = mine.filter((i) => i.severity === 'info').length;
  const assessed = coverageAssessed(def.coverageNames, categories);

  // Not assessed: no coverage signal and (for non-always pillars) no issues.
  if (!assessed && (!def.gradeWhenEmpty || mine.length === 0)) {
    return {
      key: def.key,
      label: def.label,
      grade: null,
      subScore: null,
      blockers,
      warnings,
      infos,
      notAssessedReason:
        def.key === 'content' || def.key === 'links'
          ? 'Nothing of this type found on the scanned pages'
          : 'Not enough could be verified',
    };
  }

  const penalty =
    blockers * SEVERITY_PENALTY.critical +
    warnings * SEVERITY_PENALTY.warning +
    infos * SEVERITY_PENALTY.info;
  let subScore = Math.max(0, Math.min(100, 100 - penalty));
  // A pillar with a verified critical can never grade above D-.
  if (blockers > 0) subScore = Math.min(subScore, 55);

  const topIssue =
    mine.find((i) => i.severity === 'critical')?.title ||
    mine.find((i) => i.severity === 'warning')?.title ||
    mine[0]?.title;

  return {
    key: def.key,
    label: def.label,
    grade: letterFromScore(subScore),
    subScore,
    blockers,
    warnings,
    infos,
    topIssue,
  };
}

export function certifyLaunch(
  launchReadiness: LaunchReadinessLike,
  issues: IssueLike[],
  scannedAt: string = new Date().toISOString()
): Certification {
  const categories = launchReadiness.coverageDetails?.categories || [];
  const coverage = launchReadiness.scanCoverage ?? 0;
  const score = launchReadiness.launchReadinessScore;
  const diagnostic =
    launchReadiness.scoreMode === 'diagnostic_only' ||
    launchReadiness.launchDecision === 'diagnostic_only';

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const securityBlockers = issues.filter(
    (i) => i.category === 'security' && i.severity === 'critical'
  ).length;
  const securityWarnings = issues.filter(
    (i) => i.category === 'security' && i.severity === 'warning'
  ).length;

  const pillars = PILLARS.map((p) => gradePillar(p, issues, categories));

  // ── Gate (strict policy) ──
  let gate: CertificationGate;
  const reasons: string[] = [];

  if (diagnostic || coverage < 40) {
    gate = 'unverified';
    // Say the REAL reason. Low coverage and target-fit are different causes and
    // conflating them ("only 93% verified" when 93% is high) destroys trust.
    if (coverage < 40) {
      reasons.push(`Only ${coverage}% of the checklist could be verified — not enough to certify.`);
    } else {
      reasons.push(
        'This site is outside our target profile (large or complex), so we issue a diagnostic only, not a certificate — it is not a judgement of the site.'
      );
    }
  } else if (criticalCount > 0 || securityBlockers > 0 || (score !== null && score < 60)) {
    gate = 'fail';
    if (securityBlockers > 0)
      reasons.push(`${securityBlockers} critical security blocker(s) present.`);
    if (criticalCount > 0) reasons.push(`${criticalCount} critical issue(s) must be fixed.`);
    if (score !== null && score < 60) reasons.push(`Launch score ${score}/100 is below the pass line.`);
  } else if (
    coverage >= 60 &&
    criticalCount === 0 &&
    securityBlockers === 0 &&
    securityWarnings === 0 &&
    (score === null || score >= 80)
  ) {
    gate = 'pass';
    reasons.push('No critical issues and no security gaps. Security-clean and launch-ready.');
  } else {
    gate = 'conditional';
    if (securityWarnings > 0)
      reasons.push(`${securityWarnings} security warning(s) (e.g. missing headers) to address.`);
    if (score !== null && score < 80)
      reasons.push(`Launch score ${score}/100 — some items need fixing before a clean pass.`);
    if (coverage < 60)
      reasons.push(`Coverage ${coverage}% — a deeper scan would raise confidence.`);
    if (reasons.length === 0) reasons.push('Scanned successfully; a few items need attention.');
  }

  const headline =
    gate === 'pass'
      ? 'VibeSiteScan Verified'
      : gate === 'conditional'
        ? 'Conditional — fix before you rely on it'
        : gate === 'fail'
          ? 'Not Verified — blockers found'
          : 'Unverified — insufficient coverage';

  const overallGrade = gate === 'unverified' || score === null ? null : letterFromScore(score);

  return {
    gate,
    overallGrade,
    headline,
    reasons,
    pillars,
    scannedAt,
    coverage,
    score,
    criticalCount,
    securityBlockers,
    securityWarnings,
  };
}
