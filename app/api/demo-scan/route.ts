import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runScan } from '@/lib/scanner';

const demoScanSchema = z.object({
  url: z.string().url().or(z.string().min(3)),
  depth: z.enum(['quick', 'standard']).default('quick')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, depth } = demoScanSchema.parse(body);
    
    console.log('🔍 Running enhanced demo scan for:', url, 'Depth:', depth);
    
    // Run the enhanced scan directly without saving to database
    const result = await runScan(url, depth);
    
    console.log('✅ Demo scan complete!');
    console.log(`   Legacy Score: ${result.score}/100`);
    if (result.launchReadiness) {
      console.log(`   Launch Readiness: ${result.launchReadiness.launchReadinessScore !== null ? result.launchReadiness.launchReadinessScore + '/100' : 'Diagnostic Only'}`);
      console.log(`   Launch Decision: ${result.launchReadiness.launchDecision}`);
      console.log(`   Coverage: ${result.launchReadiness.scanCoverage}%`);
      console.log(`   Confidence: ${result.launchReadiness.resultConfidence}`);
      console.log(`   Target Fit: ${result.launchReadiness.targetFit}`);
    }
    console.log(`   Pages: ${result.pages.length}`);
    console.log(`   Issues: ${result.issues.length}`);
    console.log(`   Links: ${result.linkResults.length}`);
    console.log(`   Forms: ${result.formsFoundCount}`);
    console.log(`   Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    
    // Return the full enhanced scan result
    return NextResponse.json({ 
      success: true,
      scan: {
        id: 'demo-' + Date.now(), // Temporary ID for demo mode
        target_url: url,
        scan_depth: depth,
        status: 'completed',
        launch_score: result.score, // Legacy score
        // NEW: Launch readiness data
        launch_readiness_score: result.launchReadiness?.launchReadinessScore,
        launch_decision: result.launchReadiness?.launchDecision,
        scan_coverage: result.launchReadiness?.scanCoverage,
        result_confidence: result.launchReadiness?.resultConfidence,
        target_fit: result.launchReadiness?.targetFit,
        target_fit_reason: result.launchReadiness?.targetFitReason,
        score_mode: result.launchReadiness?.scoreMode,
        scoring_explanation_json: result.launchReadiness?.scoringExplanation,
        coverage_details_json: result.launchReadiness?.coverageDetails,
        confidence_details_json: result.launchReadiness?.confidenceDetails,
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: result.durationMs,
        pages_count: result.pages.length,
        issues_count: result.issues.length,
        critical_issues_count: result.issues.filter(i => i.severity === 'critical').length,
        warning_issues_count: result.issues.filter(i => i.severity === 'warning').length,
        // Enhanced stats
        discovered_pages_count: result.discoveredPagesCount,
        skipped_pages_count: result.skippedPagesCount,
        internal_links_count: result.internalLinksCount,
        external_links_count: result.externalLinksCount,
        broken_internal_links_count: result.brokenInternalLinksCount,
        broken_external_links_count: result.brokenExternalLinksCount,
        redirects_count: result.redirectsCount,
        ignored_links_count: result.ignoredLinksCount,
        forms_found_count: result.formsFoundCount,
        console_errors_count: result.consoleErrorsCount,
        browser_checks_status: result.browserChecks?.browserChecksStatus || 'skipped',
        robots_found: result.robotsData?.robotsFound || false,
        sitemap_found: result.sitemapData?.sitemapFound || false,
      },
      result // Full scan result with all forensic data
    });
  } catch (error) {
    console.error('❌ Demo scan error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run scan' 
      },
      { status: 400 }
    );
  }
}
