/**
 * Launch Readiness Scoring System
 * 
 * LaunchScan measures public launch hygiene for fast-shipped websites.
 * It is NOT an SEO ranking, brand quality score, performance score, or enterprise website benchmark.
 */

export type TargetFit = 'ideal' | 'acceptable' | 'limited';
export type ScoreMode = 'normal' | 'limited' | 'diagnostic_only';
export type LaunchDecision = 'safe_to_share' | 'fix_before_sharing' | 'do_not_ship_yet' | 'diagnostic_only';
export type ResultConfidence = 'high' | 'medium' | 'limited';
export type IssueConfidence = 'high' | 'medium' | 'low';
export type EvidenceStatus = 'verified' | 'potential' | 'skipped' | 'not_captured';
export type IssueSeverity = 'blocker' | 'needs_fix' | 'polish' | 'info';

export interface LaunchReadinessScore {
  // Core metrics
  launchReadinessScore: number | null; // null when diagnostic_only
  launchDecision: LaunchDecision;
  scanCoverage: number; // percentage 0-100
  resultConfidence: ResultConfidence;
  
  // Context
  targetFit: TargetFit;
  targetFitReason: string;
  scoreMode: ScoreMode;
  
  // Explanations
  scoringExplanation: ScoringExplanation;
  coverageDetails: CoverageDetails;
  confidenceDetails: ConfidenceDetails;
}

export interface ScoringExplanation {
  baseScore: number;
  verifiedBlockers: number;
  verifiedBlockerPenalty: number;
  verifiedNeedsFix: number;
  verifiedNeedsFixPenalty: number;
  verifiedPolish: number;
  verifiedPolishPenalty: number;
  potentialIssues: number;
  potentialIssuesPenalty: number;
  skippedChecks: number;
  notCapturedChecks: number;
  finalScore: number | null;
  message: string;
}

export interface CoverageCategory {
  name: string;
  status: 'verified' | 'partial' | 'skipped' | 'failed' | 'not_captured';
  weight: number;
  reason?: string;
  evidenceCount: number;
}

export interface CoverageDetails {
  categories: CoverageCategory[];
  totalWeight: number;
  verifiedWeight: number;
  coveragePercentage: number;
  summary: string;
}

export interface ConfidenceDetails {
  factors: {
    coverage: 'high' | 'medium' | 'low';
    targetFit: 'high' | 'medium' | 'low';
    evidenceQuality: 'high' | 'medium' | 'low';
    blockageLevel: 'low' | 'medium' | 'high';
  };
  overallConfidence: ResultConfidence;
  summary: string;
}

export interface EnhancedIssue {
  // Original issue fields
  issue_code: string;
  severity: 'critical' | 'warning' | 'minor' | 'info';
  message: string;
  page_url?: string;
  element?: string;
  recommendation?: string;
  
  // New readiness fields
  confidence: IssueConfidence;
  evidenceStatus: EvidenceStatus;
  affectsReadiness: boolean;
  affectsCoverage: boolean;
  scoringPenalty: number;
  scoringReason: string;
  displaySeverity: IssueSeverity;
}

export interface TargetFitDetection {
  targetFit: TargetFit;
  reason: string;
  signals: {
    isEnterpriseDomain: boolean;
    hasHighBlockageRate: boolean;
    hasBotProtection: boolean;
    hasLowCrawlability: boolean;
    hasLowCoverage: boolean;
    pageCount: number;
    blockedRequestCount: number;
    skippedCheckCount: number;
  };
}
