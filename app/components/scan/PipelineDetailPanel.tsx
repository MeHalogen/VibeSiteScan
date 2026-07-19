"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { colors } from '@/lib/design-system';

interface PipelineDetailPanelProps {
  stage: {
    id: string;
    label: string;
    status: 'idle' | 'running' | 'completed' | 'warning' | 'failed' | 'skipped';
    statusMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
    metrics?: Record<string, string | number | boolean | null>;
    evidenceLog?: Array<{
      timestamp: Date;
      severity: 'info' | 'success' | 'warning' | 'error';
      message: string;
    }>;
  };
  allStages?: Array<{
    id: string;
    metrics?: Record<string, string | number | boolean | null>;
  }>;
}

const STAGE_CHECKS: Record<string, string[]> = {
  init: ['URL normalization', 'HTTPS config', 'Domain reachability', 'Redirect chains'],
  fetch: ['Status 200 check', 'HTML parse', 'Link extraction', 'Page load time'],
  discover: ['Internal link crawl', 'Unique URL dedup', 'Depth mapping', 'Sitemap cross-ref'],
  crawl: ['Title/H1/canonical per page', 'Viewport meta', 'Indexing directives'],
  links: ['Each link HEAD request', 'Broken 404s', 'Redirect chains', 'External reachability'],
  seo: ['OG tags', 'Twitter cards', 'Canonical URLs', 'Description length'],
  social: ['Rendered OG card', 'Image dimensions', 'Missing fallbacks'],
  forms: ['Form detection', 'Label/input association', 'Action attributes'],
  browser: ['Console errors', 'JS failures', 'Mixed content warnings'],
  score: ['robots.txt', 'sitemap.xml', 'noindex directives', 'Crawl hints'],
  exposure: ['Public route map', 'Admin/debug route detection', 'Risk classification'],
  ai_leftovers: ['Placeholder copy', 'Lorem ipsum', 'Template artifacts'],
  keys: ['API key patterns', 'Firebase/Supabase config', 'Token-like strings in source'],
  form_analysis: ['Validation coverage', 'Submission wiring', 'Risky form patterns'],
  security: ['CSP / HSTS / clickjacking headers', 'Cookie flags', 'Mixed content & source maps', 'Vulnerable JS libraries'],
  performance: ['Server response (TTFB)', 'Compression & caching', 'Render-blocking scripts', 'Layout-shift risk'],
  report: ['Issue aggregation', 'Launch readiness', 'Coverage', 'Launch decision'],
};

type MetricRow = { label: string; value: string; highlight?: boolean };

function formatMetricValue(v: string | number | boolean | null | undefined): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function buildStageOutputs(
  stageId: string,
  metrics?: Record<string, string | number | boolean | null>
): MetricRow[] {
  if (!metrics || Object.keys(metrics).length === 0) return [];

  const rows: MetricRow[] = [];

  switch (stageId) {
    case 'init':
      if (metrics.normalizedUrl != null)
        rows.push({ label: 'Normalized URL', value: formatMetricValue(metrics.normalizedUrl) });
      if (metrics.scanDepth != null)
        rows.push({ label: 'Scan depth', value: formatMetricValue(metrics.scanDepth) });
      break;
    case 'fetch':
      if (metrics.statusCode != null)
        rows.push({
          label: 'HTTP status',
          value: formatMetricValue(metrics.statusCode),
          highlight: Number(metrics.statusCode) >= 400,
        });
      if (metrics.responseTimeMs != null)
        rows.push({
          label: 'Response time',
          value: `${metrics.responseTimeMs} ms`,
        });
      if (metrics.contentType != null)
        rows.push({ label: 'Content type', value: formatMetricValue(metrics.contentType) });
      break;
    case 'discover':
      if (metrics.discoveredPagesCount != null)
        rows.push({
          label: 'Routes discovered',
          value: formatMetricValue(metrics.discoveredPagesCount),
          highlight: true,
        });
      if (metrics.skippedPagesCount != null)
        rows.push({ label: 'Skipped (limit)', value: formatMetricValue(metrics.skippedPagesCount) });
      break;
    case 'crawl':
      if (metrics.pagesScanned != null)
        rows.push({
          label: 'Pages scanned',
          value: formatMetricValue(metrics.pagesScanned),
          highlight: true,
        });
      if (metrics.totalPlanned != null)
        rows.push({ label: 'Planned', value: formatMetricValue(metrics.totalPlanned) });
      if (metrics.discoveredPagesCount != null)
        rows.push({ label: 'Routes total', value: formatMetricValue(metrics.discoveredPagesCount) });
      break;
    case 'links':
      if (metrics.linksChecked != null && metrics.linksTotal != null)
        rows.push({
          label: 'Links checked',
          value: `${metrics.linksChecked} / ${metrics.linksTotal}`,
          highlight: true,
        });
      else if (metrics.linksChecked != null)
        rows.push({ label: 'Links checked', value: formatMetricValue(metrics.linksChecked), highlight: true });
      if (metrics.brokenInternalLinksCount != null)
        rows.push({
          label: 'Broken internal',
          value: formatMetricValue(metrics.brokenInternalLinksCount),
          highlight: Number(metrics.brokenInternalLinksCount) > 0,
        });
      if (metrics.brokenExternalLinksCount != null)
        rows.push({
          label: 'Broken external',
          value: formatMetricValue(metrics.brokenExternalLinksCount),
          highlight: Number(metrics.brokenExternalLinksCount) > 0,
        });
      break;
    case 'seo':
    case 'social':
      if (metrics.pagesAnalyzed != null)
        rows.push({ label: 'Pages analyzed', value: formatMetricValue(metrics.pagesAnalyzed), highlight: true });
      break;
    case 'forms':
      if (metrics.formsFoundCount != null)
        rows.push({
          label: 'Forms found',
          value: formatMetricValue(metrics.formsFoundCount),
          highlight: true,
        });
      break;
    case 'browser':
      if (metrics.browserChecksStatus != null)
        rows.push({ label: 'Browser checks', value: formatMetricValue(metrics.browserChecksStatus) });
      if (metrics.consoleErrors != null)
        rows.push({
          label: 'Console errors',
          value: formatMetricValue(metrics.consoleErrors),
          highlight: Number(metrics.consoleErrors) > 0,
        });
      if (metrics.networkErrors != null)
        rows.push({
          label: 'Failed requests',
          value: formatMetricValue(metrics.networkErrors),
          highlight: Number(metrics.networkErrors) > 0,
        });
      break;
    case 'exposure':
      if (metrics.publicRoutes != null)
        rows.push({ label: 'Public routes', value: formatMetricValue(metrics.publicRoutes) });
      if (metrics.riskyRoutes != null)
        rows.push({
          label: 'Risky routes',
          value: formatMetricValue(metrics.riskyRoutes),
          highlight: Number(metrics.riskyRoutes) > 0,
        });
      break;
    case 'ai_leftovers':
      if (metrics.aiLeftovers != null)
        rows.push({
          label: 'Leftover artifacts',
          value: formatMetricValue(metrics.aiLeftovers),
          highlight: Number(metrics.aiLeftovers) > 0,
        });
      break;
    case 'keys':
      if (metrics.keyPatterns != null)
        rows.push({
          label: 'Exposed secrets',
          value: formatMetricValue(metrics.keyPatterns),
          highlight: Number(metrics.keyPatterns) > 0,
        });
      break;
    case 'form_analysis':
      if (metrics.forms != null)
        rows.push({ label: 'Forms analyzed', value: formatMetricValue(metrics.forms) });
      if (metrics.formIssues != null)
        rows.push({
          label: 'Form issues',
          value: formatMetricValue(metrics.formIssues),
          highlight: Number(metrics.formIssues) > 0,
        });
      break;
    case 'security':
      if (metrics.securityFindings != null)
        rows.push({
          label: 'Findings',
          value: formatMetricValue(metrics.securityFindings),
          highlight: Number(metrics.securityFindings) > 0,
        });
      if (metrics.criticalFindings != null)
        rows.push({
          label: 'Critical',
          value: formatMetricValue(metrics.criticalFindings),
          highlight: Number(metrics.criticalFindings) > 0,
        });
      if (metrics.warningFindings != null)
        rows.push({ label: 'Warnings', value: formatMetricValue(metrics.warningFindings) });
      break;
    case 'performance':
      if (metrics.ttfbMs != null)
        rows.push({
          label: 'TTFB',
          value: `${metrics.ttfbMs} ms`,
          highlight: Number(metrics.ttfbMs) >= 1500,
        });
      if (metrics.performanceFindings != null)
        rows.push({
          label: 'Signals',
          value: formatMetricValue(metrics.performanceFindings),
          highlight: Number(metrics.performanceFindings) > 0,
        });
      break;
    case 'score':
      rows.push({
        label: 'robots.txt',
        value: metrics.robotsFound === true ? 'Found' : metrics.robotsFound === false ? 'Missing' : '—',
        highlight: metrics.robotsFound === false,
      });
      rows.push({
        label: 'sitemap.xml',
        value: metrics.sitemapFound === true ? 'Found' : metrics.sitemapFound === false ? 'Missing' : '—',
        highlight: metrics.sitemapFound === false,
      });
      break;
    case 'report':
      if (metrics.launchScore != null)
        rows.push({
          label: 'Launch score',
          value: `${metrics.launchScore}/100`,
          highlight: true,
        });
      if (metrics.coverage != null)
        rows.push({ label: 'Coverage', value: `${metrics.coverage}%`, highlight: true });
      if (metrics.decision != null)
        rows.push({
          label: 'Decision',
          value: String(metrics.decision).replace(/_/g, ' '),
          highlight: true,
        });
      if (metrics.issuesCount != null)
        rows.push({ label: 'Issues found', value: formatMetricValue(metrics.issuesCount) });
      break;
    default:
      for (const [key, val] of Object.entries(metrics)) {
        rows.push({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          value: formatMetricValue(val),
        });
      }
  }

  return rows;
}

export function PipelineDetailPanel({ stage, allStages }: PipelineDetailPanelProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stage.startedAt || stage.completedAt) {
      if (stage.completedAt && stage.startedAt) {
        setElapsedMs(stage.completedAt.getTime() - stage.startedAt.getTime());
      }
      return;
    }

    const interval = setInterval(() => {
      setElapsedMs(Date.now() - stage.startedAt!.getTime());
    }, 100);

    return () => clearInterval(interval);
  }, [stage.startedAt, stage.completedAt]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stage.evidenceLog?.length]);

  const stageOutputs = useMemo(
    () => buildStageOutputs(stage.id, stage.metrics),
    [stage.id, stage.metrics]
  );

  const snapshotOutputs = useMemo(() => {
    const crawl = allStages?.find((s) => s.id === 'crawl')?.metrics;
    const links = allStages?.find((s) => s.id === 'links')?.metrics;
    const report = allStages?.find((s) => s.id === 'report')?.metrics;
    const rows: MetricRow[] = [];
    if (crawl?.pagesScanned != null)
      rows.push({ label: 'Pages scanned', value: String(crawl.pagesScanned) });
    if (links?.linksChecked != null && links?.linksTotal != null)
      rows.push({
        label: 'Links',
        value: `${links.linksChecked} / ${links.linksTotal}`,
      });
    if (report?.launchScore != null)
      rows.push({ label: 'Readiness', value: `${report.launchScore}/100`, highlight: true });
    return rows;
  }, [allStages]);

  const getStatusText = () => {
    switch (stage.status) {
      case 'idle':
        return 'Queued';
      case 'running':
        return 'In progress';
      case 'completed':
        return 'Complete';
      case 'warning':
        return 'Complete with warnings';
      case 'failed':
        return 'Failed';
      case 'skipped':
        return 'Skipped';
    }
  };

  const formatElapsed = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return '#5DCAA5';
      case 'warning':
        return colors.amber;
      case 'error':
        return colors.red;
      default:
        return colors.textSecondary;
    }
  };

  const checks = STAGE_CHECKS[stage.id] ?? [];
  const showOutputs =
    stageOutputs.length > 0 &&
    (stage.status === 'running' || stage.status === 'completed' || stage.status === 'warning');

  // Logs arrive pre-filtered per stage (tagged with stageId upstream)
  const displayLog = stage.evidenceLog?.slice(-24) ?? [];

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'transparent' }}>
      <div className="px-6 py-5 border-b ops-hairline">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-[20px] font-medium" style={{ color: colors.textPrimary }}>
            {stage.label}
          </h2>
          {elapsedMs > 0 && (
            <div
              className="text-xs font-mono tabular-nums ops-tabular"
              style={{ color: colors.textTertiary }}
            >
              {formatElapsed(elapsedMs)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="ops-kicker">{getStatusText()}</span>
          {stage.status === 'running' && (
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: colors.tealPrimary }}
            />
          )}
        </div>
        {stage.statusMessage &&
          (stage.status === 'skipped' || stage.status === 'failed' || stage.status === 'warning') && (
            <div
              className="mt-2 text-[12px] leading-relaxed"
              style={{
                color:
                  stage.status === 'failed'
                    ? colors.red
                    : stage.status === 'warning'
                      ? colors.amber
                      : colors.textTertiary,
              }}
            >
              {stage.statusMessage}
            </div>
          )}
      </div>

      {showOutputs && (
        <div className="px-6 py-4 border-b ops-hairline">
          <div className="ops-kicker mb-3">Stage output</div>
          <div className="grid grid-cols-2 gap-2">
            {stageOutputs.map((row) => (
              <div
                key={row.label}
                className="rounded-lg px-3 py-2 border"
                style={{
                  borderColor: row.highlight
                    ? 'rgba(29,158,117,0.30)'
                    : 'rgba(255,255,255,0.08)',
                  backgroundColor: row.highlight
                    ? 'rgba(29,158,117,0.06)'
                    : 'rgba(0,0,0,0.15)',
                }}
              >
                <div className="ops-kicker mb-1" style={{ fontSize: '9px' }}>
                  {row.label}
                </div>
                <div
                  className="font-mono text-[12px] ops-tabular truncate"
                  style={{
                    color: row.highlight ? colors.tealPrimary : colors.textPrimary,
                  }}
                  title={row.value}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage.status === 'idle' && snapshotOutputs.length > 0 && (
        <div className="px-6 py-4 border-b ops-hairline">
          <div className="ops-kicker mb-3">Scan snapshot</div>
          <div className="flex flex-wrap gap-2">
            {snapshotOutputs.map((row) => (
              <span key={row.label} className="ops-pill ops-tabular">
                {row.label}: {row.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {checks.length > 0 &&
        (stage.status === 'running' ||
          stage.status === 'completed' ||
          stage.status === 'warning' ||
          stage.status === 'failed') && (
          <div className="px-6 py-4 border-b ops-hairline">
            <div className="ops-kicker mb-3">What this stage inspects</div>
            <div className="space-y-2">
              {checks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5"
                  style={{
                    animation:
                      stage.status === 'running'
                        ? `fade-in-stagger 0.3s ease ${idx * 0.06}s both`
                        : undefined,
                  }}
                >
                  <div
                    className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                  />
                  <div className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    {check}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="flex-1 px-6 py-4 min-h-0 flex flex-col">
        <div className="ops-kicker mb-3">Evidence stream</div>
        <div className="terminal-window flex-1 min-h-0 flex flex-col rounded overflow-hidden">
          <div className="terminal-bar shrink-0">
            <span className="terminal-dot bg-[#ff5f57]" />
            <span className="terminal-dot bg-[#febc2e]" />
            <span className="terminal-dot bg-[#28c840]" />
            <span className="ml-2 text-[10px] text-[#8b949e] uppercase tracking-widest">
              vibesitescan — {stage.label.toLowerCase()}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-[11.5px] min-h-[160px]">
          {displayLog.length > 0 ? (
            <>
              {displayLog.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 log-entry"
                  style={{ animation: 'slide-in-log 0.15s ease both' }}
                >
                  <span className="tabular-nums flex-shrink-0" style={{ color: 'rgba(240,244,255,0.25)' }}>
                    {log.timestamp.toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span style={{ color: getSeverityColor(log.severity) }}>{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </>
          ) : (
            <div
              className="flex items-center justify-center h-full text-center px-4"
              style={{ color: colors.textTertiary }}
            >
              {stage.status === 'idle'
                ? 'Waiting for this stage…'
                : stage.status === 'running'
                  ? 'Collecting evidence…'
                  : stage.status === 'skipped'
                    ? stage.statusMessage || 'This stage was skipped'
                    : 'No log entries for this stage'}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
