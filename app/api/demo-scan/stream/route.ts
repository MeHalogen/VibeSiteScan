import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runScan } from '@/lib/scanner';
import type { ScanEvent } from '@/lib/scan-events';
import { demoStorePut } from '@/lib/demo-scan-store';

const schema = z.object({
  url: z.string().url().or(z.string().min(3)),
  depth: z.enum(['quick', 'standard']).default('quick'),
});

function ndjsonLine(event: ScanEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const body = await request.json();
        const { url, depth } = schema.parse(body);

        const scanId = `demo-${Date.now()}`;

        const send = (event: ScanEvent) => controller.enqueue(encoder.encode(ndjsonLine(event)));

        send({ type: 'log', message: `Starting scan`, severity: 'info' });

        const result = await runScan(url, depth, {
          onProgress: (evt) => {
            if (evt.type === 'log') {
              send({ type: 'log', message: evt.message || '', severity: evt.severity });
              return;
            }

            if (evt.type === 'stage_start') {
              send({ type: 'stage_start', stageId: evt.stageId || 'init', message: evt.message, metrics: evt.metrics });
              return;
            }

            if (evt.type === 'stage_progress') {
              send({ type: 'stage_progress', stageId: evt.stageId || 'init', message: evt.message, metrics: evt.metrics });
              return;
            }

            if (evt.type === 'stage_end') {
              send({
                type: 'stage_end',
                stageId: evt.stageId || 'init',
                status: evt.status,
                message: evt.message,
                metrics: evt.metrics,
              });
            }
          },
        });

        // Store full result server-side for report retrieval
        const scan = {
          id: scanId,
          target_url: url,
          scan_depth: depth,
          status: 'completed',
          launch_score: result.score,
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
          critical_issues_count: result.issues.filter((i) => i.severity === 'critical').length,
          warning_issues_count: result.issues.filter((i) => i.severity === 'warning').length,
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
        };

        demoStorePut(scanId, scan, { ...result, scan });

        send({ type: 'log', message: `Scan complete`, severity: 'success' });
        send({ type: 'result', scanId });
        controller.close();
      } catch (error: any) {
        const message = error?.message || 'Failed to run scan';
        controller.enqueue(encoder.encode(ndjsonLine({ type: 'log', message, severity: 'error' })));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

