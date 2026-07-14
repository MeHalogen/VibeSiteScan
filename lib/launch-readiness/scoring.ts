/**
 * Launch Readiness Scoring Engine
 * 
 * Core scoring logic that:
 * - Penalizes VERIFIED problems
 * - Does NOT penalize unknowns/skipped/not-captured
 * - Switches to diagnostic_only mode when appropriate
 * - Calculates coverage and confidence separately
 */

import {
  LaunchReadinessScore,
  ScoreMode,
  LaunchDecision,
  ScoringExplanation,
  EnhancedIssue,
  IssueConfidence,
  EvidenceStatus,
  IssueSeverity,
} from './types';
import { detectTargetFit } from './target-fit';
import { calculateCoverage } from './coverage';
import { calculateConfidence } from './confidence';

export function calculateLaunchReadiness(scanResult: any): LaunchReadinessScore {
  // Step 1: Detect target fit
  const targetFitDetection = detectTargetFit(scanResult);
  
  // Step 2: Calculate coverage
  const coverageDetails = calculateCoverage(scanResult);
  
  // Step 3: Calculate confidence
  const confidenceDetails = calculateConfidence(
    coverageDetails,
    targetFitDetection.targetFit,
    scanResult
  );
  
  // Step 4: Enhance issues with confidence and evidence status
  const enhancedIssues = enhanceIssues(scanResult.issues || [], scanResult);
  
  // Step 5: Determine score mode
  const scoreMode = determineScoreMode(
    targetFitDetection.targetFit,
    coverageDetails.coveragePercentage,
    confidenceDetails.overallConfidence
  );
  
  // Step 6: Calculate launch readiness score (or null if diagnostic_only)
  const scoringExplanation = calculateScore(enhancedIssues, scoreMode);
  
  // Step 7: Determine launch decision
  const launchDecision = determineLaunchDecision(
    enhancedIssues,
    scoringExplanation.finalScore,
    scoreMode
  );
  
  return {
    launchReadinessScore: scoringExplanation.finalScore,
    launchDecision,
    scanCoverage: coverageDetails.coveragePercentage,
    resultConfidence: confidenceDetails.overallConfidence,
    targetFit: targetFitDetection.targetFit,
    targetFitReason: targetFitDetection.reason,
    scoreMode,
    scoringExplanation,
    coverageDetails,
    confidenceDetails,
  };
}

function determineScoreMode(
  targetFit: 'ideal' | 'acceptable' | 'limited',
  coveragePercentage: number,
  confidence: 'high' | 'medium' | 'limited'
): ScoreMode {
  // Diagnostic only mode
  if (
    targetFit === 'limited' ||
    coveragePercentage < 40 ||
    confidence === 'limited'
  ) {
    return 'diagnostic_only';
  }
  
  // Limited mode
  if (
    coveragePercentage < 60 ||
    (targetFit === 'acceptable' && confidence === 'medium')
  ) {
    return 'limited';
  }
  
  // Normal mode
  return 'normal';
}

function enhanceIssues(issues: any[], scanResult: any): EnhancedIssue[] {
  return issues.map(issue => enhanceIssue(issue, scanResult));
}

function enhanceIssue(issue: any, scanResult: any): EnhancedIssue {
  // Determine confidence and evidence status
  const { confidence, evidenceStatus } = determineIssueConfidence(issue, scanResult);
  
  // Map severity to display severity
  const displaySeverity = mapToDisplaySeverity(issue.severity);
  
  // Determine if this affects readiness
  const affectsReadiness = evidenceStatus === 'verified' || evidenceStatus === 'potential';
  
  // Determine if this affects coverage
  const affectsCoverage = evidenceStatus === 'skipped' || evidenceStatus === 'not_captured';
  
  // Calculate scoring penalty
  const scoringPenalty = calculateIssuePenalty(displaySeverity, confidence, evidenceStatus);
  
  // Generate scoring reason
  const scoringReason = generateScoringReason(displaySeverity, confidence, evidenceStatus, scoringPenalty);
  
  return {
    ...issue,
    confidence,
    evidenceStatus,
    affectsReadiness,
    affectsCoverage,
    scoringPenalty,
    scoringReason,
    displaySeverity,
  };
}

function determineIssueConfidence(issue: any, scanResult: any): {
  confidence: IssueConfidence;
  evidenceStatus: EvidenceStatus;
} {
  const code = issue.issue_code || '';
  
  // Verified high-confidence issues
  const verifiedHighConfidence = [
    'homepage_unreachable',
    'homepage_error',
    'broken_internal_link',
    'missing_title',
    'missing_h1',
    'https_not_enabled',
    'noindex_on_homepage',
    'form_missing_labels',
    'console_error',
  ];
  
  if (verifiedHighConfidence.some(v => code.includes(v))) {
    return { confidence: 'high', evidenceStatus: 'verified' };
  }
  
  // Potential medium-confidence issues
  const potentialMediumConfidence = [
    'missing_og_',
    'missing_twitter_',
    'missing_canonical',
    'missing_meta_description',
    'missing_favicon',
    'duplicate_',
  ];
  
  if (potentialMediumConfidence.some(v => code.includes(v))) {
    return { confidence: 'medium', evidenceStatus: 'potential' };
  }
  
  // Skipped checks
  if (code.includes('skipped') || issue.message?.includes('skipped')) {
    return { confidence: 'high', evidenceStatus: 'skipped' };
  }
  
  // Not captured checks
  if (code.includes('not_captured') || issue.message?.includes('could not capture')) {
    return { confidence: 'low', evidenceStatus: 'not_captured' };
  }
  
  // Default: medium confidence, verified
  return { confidence: 'medium', evidenceStatus: 'verified' };
}

function mapToDisplaySeverity(severity: 'critical' | 'warning' | 'minor' | 'info'): IssueSeverity {
  switch (severity) {
    case 'critical': return 'blocker';
    case 'warning': return 'needs_fix';
    case 'minor': return 'polish';
    case 'info': return 'info';
    default: return 'info';
  }
}

function calculateIssuePenalty(
  severity: IssueSeverity,
  confidence: IssueConfidence,
  evidenceStatus: EvidenceStatus
): number {
  // NO PENALTY for skipped or not captured
  if (evidenceStatus === 'skipped' || evidenceStatus === 'not_captured') {
    return 0;
  }
  
  // Base penalties by severity
  let basePenalty = 0;
  switch (severity) {
    case 'blocker': basePenalty = 25; break;
    case 'needs_fix': basePenalty = 8; break;
    case 'polish': basePenalty = 2; break;
    case 'info': basePenalty = 0; break;
  }
  
  // Adjust by confidence
  if (confidence === 'medium' && evidenceStatus === 'potential') {
    basePenalty *= 0.6; // Reduce penalty for potential issues
  } else if (confidence === 'low') {
    basePenalty *= 0.3; // Minimal penalty for low confidence
  }
  
  return Math.round(basePenalty);
}

function generateScoringReason(
  severity: IssueSeverity,
  confidence: IssueConfidence,
  evidenceStatus: EvidenceStatus,
  penalty: number
): string {
  if (evidenceStatus === 'skipped') {
    return 'Skipped check. No readiness penalty applied. Reduces coverage only.';
  }
  
  if (evidenceStatus === 'not_captured') {
    return 'Could not capture. No readiness penalty applied. Reduces confidence.';
  }
  
  if (evidenceStatus === 'verified') {
    return `Verified ${severity}. -${penalty} points.`;
  }
  
  if (evidenceStatus === 'potential') {
    return `Potential ${severity} (${confidence} confidence). -${penalty} points.`;
  }
  
  return `${severity} issue. -${penalty} points.`;
}

function calculateScore(
  enhancedIssues: EnhancedIssue[],
  scoreMode: ScoreMode
): ScoringExplanation {
  // Diagnostic only mode - no numeric score
  if (scoreMode === 'diagnostic_only') {
    return {
      baseScore: 100,
      verifiedBlockers: enhancedIssues.filter(i => i.displaySeverity === 'blocker' && i.evidenceStatus === 'verified').length,
      verifiedBlockerPenalty: 0,
      verifiedNeedsFix: enhancedIssues.filter(i => i.displaySeverity === 'needs_fix' && i.evidenceStatus === 'verified').length,
      verifiedNeedsFixPenalty: 0,
      verifiedPolish: enhancedIssues.filter(i => i.displaySeverity === 'polish' && i.evidenceStatus === 'verified').length,
      verifiedPolishPenalty: 0,
      potentialIssues: enhancedIssues.filter(i => i.evidenceStatus === 'potential').length,
      potentialIssuesPenalty: 0,
      skippedChecks: enhancedIssues.filter(i => i.evidenceStatus === 'skipped').length,
      notCapturedChecks: enhancedIssues.filter(i => i.evidenceStatus === 'not_captured').length,
      finalScore: null,
      message: 'Launch Readiness is not scored because scan coverage or target fit is limited. Verified findings are shown below.',
    };
  }
  
  // Calculate penalties
  const blockers = enhancedIssues.filter(i => i.displaySeverity === 'blocker' && i.affectsReadiness);
  const needsFix = enhancedIssues.filter(i => i.displaySeverity === 'needs_fix' && i.affectsReadiness);
  const polish = enhancedIssues.filter(i => i.displaySeverity === 'polish' && i.affectsReadiness);
  const potential = enhancedIssues.filter(i => i.evidenceStatus === 'potential');

  // Group by DISTINCT problem type. A single problem repeated across many pages
  // (e.g. every page missing a meta description) is ONE thing to fix — it must
  // not be penalized once per page, or a fixable site floors at 0/100.
  // Each distinct type counts once, plus a small, capped breadth bump.
  const effectiveCount = (issues: EnhancedIssue[]): number => {
    const byCode = new Map<string, number>();
    for (const i of issues) {
      const key = (i as any).issue_code || (i as any).issueCode || i.message || 'unknown';
      byCode.set(key, (byCode.get(key) || 0) + 1);
    }
    let eff = 0;
    for (const count of Array.from(byCode.values())) {
      eff += Math.min(1 + (count - 1) * 0.1, 1.6);
    }
    return eff;
  };

  const blockerEff = effectiveCount(blockers);
  const needsFixEff = effectiveCount(needsFix);
  const polishEff = effectiveCount(polish);
  const potentialEff = effectiveCount(potential);

  // Blockers are serious → near-linear, each distinct blocker costs a lot.
  // Warnings/polish/potential SATURATE so a pile of minor issues can't alone
  // drive the score to 0; the curve maps "some" → 70s, "many" → 50s-60s.
  const blockerPenalty = Math.round(blockerEff * 25);
  const needsFixPenalty = Math.round(45 * (1 - Math.exp(-needsFixEff / 6)));
  const polishPenalty = Math.round(10 * (1 - Math.exp(-polishEff / 5)));
  const potentialPenalty = Math.round(15 * (1 - Math.exp(-potentialEff / 6)));

  const totalPenalty = blockerPenalty + needsFixPenalty + polishPenalty + potentialPenalty;
  let finalScore = Math.max(0, Math.min(100, 100 - totalPenalty));
  // Keep the number consistent with the verdict: a real blocker means "do not
  // ship", so the score should read like it (never a comfortable pass).
  if (blockers.length > 0) finalScore = Math.min(finalScore, 45);
  
  const skippedCount = enhancedIssues.filter(i => i.evidenceStatus === 'skipped').length;
  const notCapturedCount = enhancedIssues.filter(i => i.evidenceStatus === 'not_captured').length;
  
  return {
    baseScore: 100,
    verifiedBlockers: blockers.length,
    verifiedBlockerPenalty: blockerPenalty,
    verifiedNeedsFix: needsFix.length,
    verifiedNeedsFixPenalty: needsFixPenalty,
    verifiedPolish: polish.length,
    verifiedPolishPenalty: polishPenalty,
    potentialIssues: potential.length,
    potentialIssuesPenalty: potentialPenalty,
    skippedChecks: skippedCount,
    notCapturedChecks: notCapturedCount,
    finalScore,
    message: skippedCount + notCapturedCount > 0
      ? `Skipped or unavailable checks (${skippedCount + notCapturedCount}) reduce coverage/confidence, not Launch Readiness.`
      : 'All applicable checks were verified.',
  };
}

function determineLaunchDecision(
  enhancedIssues: EnhancedIssue[],
  score: number | null,
  scoreMode: ScoreMode
): LaunchDecision {
  // Diagnostic only
  if (scoreMode === 'diagnostic_only') {
    return 'diagnostic_only';
  }
  
  // Check for verified blockers
  const verifiedBlockers = enhancedIssues.filter(
    i => i.displaySeverity === 'blocker' && i.evidenceStatus === 'verified'
  );
  
  if (verifiedBlockers.length > 0) {
    return 'do_not_ship_yet';
  }
  
  // Check for verified needs-fix items
  const verifiedNeedsFix = enhancedIssues.filter(
    i => i.displaySeverity === 'needs_fix' && i.evidenceStatus === 'verified'
  );
  
  if (verifiedNeedsFix.length > 3 || (score !== null && score < 70)) {
    return 'fix_before_sharing';
  }
  
  // Safe to share
  return 'safe_to_share';
}

export { enhanceIssues, type EnhancedIssue };
