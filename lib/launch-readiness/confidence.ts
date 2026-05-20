/**
 * Result Confidence Calculator
 * 
 * Determines how reliable the scan result is based on evidence quality,
 * target fit, coverage, and blockage levels.
 */

import { ResultConfidence, ConfidenceDetails, TargetFit } from './types';
import { CoverageDetails } from './types';

export function calculateConfidence(
  coverage: CoverageDetails,
  targetFit: TargetFit,
  scanResult: any
): ConfidenceDetails {
  // Assess coverage factor
  const coverageFactor = assessCoverageFactor(coverage.coveragePercentage);
  
  // Assess target fit factor
  const targetFitFactor = assessTargetFitFactor(targetFit);
  
  // Assess evidence quality
  const evidenceQualityFactor = assessEvidenceQuality(scanResult, coverage);
  
  // Assess blockage level
  const blockageFactor = assessBlockageLevel(scanResult);
  
  // Determine overall confidence
  const overallConfidence = determineOverallConfidence({
    coverage: coverageFactor,
    targetFit: targetFitFactor,
    evidenceQuality: evidenceQualityFactor,
    blockageLevel: blockageFactor,
  });
  
  // Generate summary
  const summary = generateConfidenceSummary({
    coverage: coverageFactor,
    targetFit: targetFitFactor,
    evidenceQuality: evidenceQualityFactor,
    blockageLevel: blockageFactor,
    overall: overallConfidence,
  });
  
  return {
    factors: {
      coverage: coverageFactor,
      targetFit: targetFitFactor,
      evidenceQuality: evidenceQualityFactor,
      blockageLevel: blockageFactor,
    },
    overallConfidence,
    summary,
  };
}

function assessCoverageFactor(coveragePercentage: number): 'high' | 'medium' | 'low' {
  if (coveragePercentage >= 80) return 'high';
  if (coveragePercentage >= 50) return 'medium';
  return 'low';
}

function assessTargetFitFactor(targetFit: TargetFit): 'high' | 'medium' | 'low' {
  if (targetFit === 'ideal') return 'high';
  if (targetFit === 'acceptable') return 'medium';
  return 'low';
}

function assessEvidenceQuality(scanResult: any, coverage: CoverageDetails): 'high' | 'medium' | 'low' {
  const verifiedCount = coverage.categories.filter(c => c.status === 'verified').length;
  const notCapturedCount = coverage.categories.filter(c => c.status === 'not_captured').length;
  const failedCount = coverage.categories.filter(c => c.status === 'failed').length;
  
  const totalCategories = coverage.categories.length;
  const reliableRatio = verifiedCount / totalCategories;
  const unreliableRatio = (notCapturedCount + failedCount) / totalCategories;
  
  if (reliableRatio >= 0.7 && unreliableRatio < 0.2) return 'high';
  if (reliableRatio >= 0.4 && unreliableRatio < 0.4) return 'medium';
  return 'low';
}

function assessBlockageLevel(scanResult: any): 'low' | 'medium' | 'high' {
  const blockedCount = scanResult.blocked_requests_count || 0;
  const totalRequests = (scanResult.internal_links_count || 0) + (scanResult.external_links_count || 0);
  
  if (totalRequests === 0) return 'low';
  
  const blockageRate = blockedCount / totalRequests;
  
  if (blockageRate < 0.1) return 'low';
  if (blockageRate < 0.3) return 'medium';
  return 'high';
}

function determineOverallConfidence(factors: {
  coverage: 'high' | 'medium' | 'low';
  targetFit: 'high' | 'medium' | 'low';
  evidenceQuality: 'high' | 'medium' | 'low';
  blockageLevel: 'low' | 'medium' | 'high';
}): ResultConfidence {
  // Any low factor makes confidence limited
  if (
    factors.coverage === 'low' ||
    factors.targetFit === 'low' ||
    factors.evidenceQuality === 'low' ||
    factors.blockageLevel === 'high'
  ) {
    return 'limited';
  }
  
  // All high factors (with low blockage) makes confidence high
  if (
    factors.coverage === 'high' &&
    factors.targetFit === 'high' &&
    factors.evidenceQuality === 'high' &&
    factors.blockageLevel === 'low'
  ) {
    return 'high';
  }
  
  // Otherwise medium
  return 'medium';
}

function generateConfidenceSummary(data: {
  coverage: 'high' | 'medium' | 'low';
  targetFit: 'high' | 'medium' | 'low';
  evidenceQuality: 'high' | 'medium' | 'low';
  blockageLevel: 'low' | 'medium' | 'high';
  overall: ResultConfidence;
}): string {
  const reasons: string[] = [];
  
  if (data.coverage === 'high') {
    reasons.push('high scan coverage');
  } else if (data.coverage === 'medium') {
    reasons.push('moderate scan coverage');
  } else {
    reasons.push('limited scan coverage');
  }
  
  if (data.targetFit === 'high') {
    reasons.push('ideal target fit');
  } else if (data.targetFit === 'medium') {
    reasons.push('acceptable target fit');
  } else {
    reasons.push('limited target fit');
  }
  
  if (data.evidenceQuality === 'low') {
    reasons.push('some checks could not be captured');
  }
  
  if (data.blockageLevel === 'high') {
    reasons.push('many requests were blocked');
  } else if (data.blockageLevel === 'medium') {
    reasons.push('some requests were blocked');
  }
  
  const prefix = data.overall === 'high' 
    ? 'High confidence based on'
    : data.overall === 'medium'
    ? 'Medium confidence based on'
    : 'Limited confidence due to';
  
  return `${prefix} ${reasons.join(', ')}.`;
}
