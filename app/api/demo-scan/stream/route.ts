import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { runScan } from '@/lib/scanner';
import type { ScanEvent } from '@/lib/scan-events';
import { demoStorePut } from '@/lib/demo-scan-store';
import { persistScanResult } from '@/lib/persistence';
import { registerScan, isStopRequested, clearScan } from '@/lib/scan-control';
import { checkQuota, consumeForScan } from '@/lib/credits';

/** URL-safe public token for the certificate page (/r/[token]). */
function makeShareToken(): string {
  return randomBytes(12).toString('base64url');
}

function readCookie(header: string | null, name: string): string {
  if (!header) return '';
  const m = header.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

const schema = z.object({
  url: z.string().url().or(z.string().min(3)),
  depth: z.enum(['quick', 'standard']).default('quick'),
});

function ndjsonLine(event: ScanEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  // Validate before opening the stream so bad input gets a real 400
  // instead of a 200 stream that dies with a generic error.
  let url: string;
  let depth: 'quick' | 'standard';
  try {
    const body = await request.json();
    ({ url, depth } = schema.parse(body));
  } catch (error: any) {
    const message =
      error instanceof z.ZodError
        ? 'Invalid scan request: provide a valid URL (e.g. https://example.com)'
        : 'Invalid scan request body';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  // Quota / credits gate. In dev (no Supabase) this is a no-op; with billing
  // configured it enforces plan depth + credit balance + the anonymous trial.
  // TODO(auth): userId comes from the Supabase session once auth is wired.
  const userId: string | null = null;
  const deviceId = readCookie(request.headers.get('cookie'), 'vss_device');
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const quota = await checkQuota({ userId, deviceId, ip, depth, url });
  if (!quota.ok) {
    return NextResponse.json(
      { success: false, error: quota.reason, code: quota.code, balance: quota.balance },
      { status: 402 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The client can disconnect at any point; enqueue then throws.
      // Track closure so a disconnect doesn't crash the scan mid-flight.
      let closed = false;
      const send = (event: ScanEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(ndjsonLine(event)));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed by the runtime
        }
      };

      const scanId = `demo-${Date.now()}`;
      registerScan(scanId);
      try {
        const shareToken = makeShareToken();

        // Announce the scanId first so the client can request a stop for it.
        send({ type: 'scan_started', scanId });

        // Reserve the credit now that the scan is actually starting.
        const charge = await consumeForScan({ userId, deviceId, ip, depth, url, scanId });
        if (charge.freeRescan) {
          send({ type: 'log', message: 'Free re-verify (scanned recently)', severity: 'info' });
        } else if (charge.charged > 0) {
          send({
            type: 'log',
            message: `${charge.charged} credit${charge.charged === 1 ? '' : 's'} used${charge.balance != null ? ` · ${charge.balance} left` : ''}`,
            severity: 'info',
          });
        }
        send({ type: 'log', message: `Starting scan`, severity: 'info' });

        const result = await runScan(url, depth, {
          onProgress: (evt) => send(evt),
          shouldStop: () => isStopRequested(scanId),
        });

        // Store full result server-side for report retrieval
        const scan = {
          id: scanId,
          share_token: shareToken,
          target_url: url,
          scan_depth: depth,
          status: result.partial ? 'stopped' : 'completed',
          partial: result.partial ?? false,
          stopped_at_stage: result.stoppedAtStage ?? null,
          launch_score: result.score,
          launch_readiness_score: result.launchReadiness?.launchReadinessScore,
          launch_decision: result.launchReadiness?.launchDecision,
          certification_gate: result.certification?.gate,
          overall_grade: result.certification?.overallGrade,
          certification_json: result.certification,
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

        // Durable persistence for the public certificate (/r/[token]).
        // Never breaks the scan — degrades to the in-memory record.
        try {
          const { backend, ephemeral } = await persistScanResult({
            scanId,
            shareToken,
            targetUrl: url,
            scan,
            result,
          });
          send({
            type: 'log',
            message:
              backend === 'supabase'
                ? 'Certificate saved (durable)'
                : `Certificate saved (in-memory${ephemeral ? ', resets on restart' : ''})`,
            severity: 'info',
          });
        } catch (err: any) {
          send({ type: 'log', message: 'Certificate storage skipped', severity: 'warning' });
        }

        send({
          type: 'log',
          message: result.partial ? `Scan stopped — partial report ready` : `Scan complete`,
          severity: result.partial ? 'warning' : 'success',
        });
        send({ type: 'result', scanId });
        close();
      } catch (error: any) {
        const message = error?.message || 'Failed to run scan';
        send({ type: 'error', message });
        close();
      } finally {
        clearScan(scanId);
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
