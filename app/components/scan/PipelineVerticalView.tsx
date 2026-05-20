"use client";

import { useState, useEffect } from 'react';
import { calculateProgress } from '@/lib/design-system';
import { PipelineStageRow } from './PipelineStageRow';
import { PipelineDetailPanel } from './PipelineDetailPanel';

interface PipelineStage {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'warning' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  badge?: string;
  metrics?: Record<string, string | number | boolean | null>;
  evidenceLog?: Array<{
    timestamp: Date;
    severity: 'info' | 'success' | 'warning' | 'error';
    message: string;
  }>;
}

interface PipelineVerticalViewProps {
  stages: PipelineStage[];
  isRunning: boolean;
  elapsedTime: number;
  targetUrl?: string;
  scanId?: string;
  scanModeLabel?: string;
}

function getMetric(
  stages: PipelineStage[],
  stageId: string,
  key: string
): string | number | boolean | null | undefined {
  const stage = stages.find((s) => s.id === stageId);
  return stage?.metrics?.[key];
}

function formatScanId(scanId?: string) {
  if (!scanId) return '—';
  if (scanId.length <= 14) return scanId;
  return `${scanId.slice(0, 10)}…`;
}

function LiveClock({ elapsedTime }: { elapsedTime: number }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-right font-mono text-xs ops-tabular text-[var(--cream)]/70">
      <div>{now.toLocaleTimeString('en-US', { hour12: false })}</div>
      <div className="text-[var(--cream)]/45">elapsed {formatTime(elapsedTime)}</div>
    </div>
  );
}

export function PipelineVerticalView({
  stages,
  isRunning,
  elapsedTime,
  targetUrl,
  scanId,
  scanModeLabel = 'Launch check',
}: PipelineVerticalViewProps) {
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id || 'init');

  useEffect(() => {
    const runningStage = stages.find((s) => s.status === 'running');
    if (runningStage && isRunning) {
      setSelectedStageId(runningStage.id);
    }
  }, [stages, isRunning]);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];
  const runningStage = stages.find((s) => s.status === 'running');
  const completedCount = stages.filter(
    (s) => s.status === 'completed' || s.status === 'warning'
  ).length;
  const progress = calculateProgress(
    stages.map((s) => ({
      id: s.id,
      status: s.status === 'completed' || s.status === 'warning' ? 'done' : s.status,
    }))
  );

  const crawlPages = Number(getMetric(stages, 'crawl', 'pagesScanned'));
  const fetchStage = stages.find((s) => s.id === 'fetch');
  const pagesScanned =
    crawlPages > 0
      ? crawlPages
      : fetchStage?.status === 'completed' || fetchStage?.status === 'warning'
        ? 1
        : 0;
  const routesFound = Number(getMetric(stages, 'discover', 'discoveredPagesCount')) || 0;
  const linksChecked = Number(getMetric(stages, 'links', 'linksChecked')) || 0;
  const linksTotal = Number(getMetric(stages, 'links', 'linksTotal')) || 0;
  const homepageStatus = getMetric(stages, 'fetch', 'statusCode');
  const robotsFound = getMetric(stages, 'score', 'robotsFound');
  const sitemapFound = getMetric(stages, 'score', 'sitemapFound');
  const launchScore = getMetric(stages, 'report', 'launchScore');
  const issuesCount = getMetric(stages, 'report', 'issuesCount');

  const estimateRemaining = () => {
    if (completedCount === 0) return null;
    const avgTimePerStage = elapsedTime / completedCount;
    const remainingStages = stages.length - completedCount;
    const estSeconds = Math.round(avgTimePerStage * remainingStages);
    return estSeconds > 0 ? `${estSeconds}s` : null;
  };

  const statusItems: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: 'Scan ID', value: formatScanId(scanId) },
    { label: 'Depth', value: scanModeLabel },
    { label: 'Progress', value: `${progress}%`, accent: isRunning },
    {
      label: 'Pages',
      value:
        pagesScanned > 0
          ? routesFound > pagesScanned
            ? `${pagesScanned} / ${routesFound}`
            : `${pagesScanned}`
          : '—',
    },
    {
      label: 'Links',
      value: linksTotal > 0 ? `${linksChecked} / ${linksTotal}` : linksChecked > 0 ? `${linksChecked}` : '—',
      accent: runningStage?.id === 'links',
    },
    {
      label: 'Homepage',
      value: homepageStatus != null ? `HTTP ${homepageStatus}` : '—',
    },
    {
      label: 'Index',
      value:
        robotsFound === true || sitemapFound === true
          ? [robotsFound === true ? 'robots' : null, sitemapFound === true ? 'sitemap' : null]
              .filter(Boolean)
              .join(' · ') || '—'
          : robotsFound === false && sitemapFound === false
            ? 'missing'
            : '—',
    },
  ];

  if (launchScore != null) {
    statusItems.push({ label: 'Readiness', value: `${launchScore}/100`, accent: true });
  } else if (issuesCount != null) {
    statusItems.push({ label: 'Issues', value: `${issuesCount}` });
  }

  return (
    <div className="relative z-10 flex flex-col h-screen">
      <div className="absolute inset-0 ops-grid pointer-events-none" />

      {/* Top ops bar */}
      <header className="relative z-10 intel-panel-dark border-b ops-hairline px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <span className="class-label text-[var(--cream)]/80 shrink-0 hidden sm:inline">
            LaunchScan
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`signal-dot ${isRunning ? 'active' : 'warn'}`} />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--cream)]">
              {isRunning ? 'System active' : 'Standby'}
            </span>
          </div>
          <span className="classified-stamp hidden md:inline text-[9px]">Launch gate</span>
        </div>
        <LiveClock elapsedTime={elapsedTime} />
      </header>

      {/* Target + active stage */}
      <div className="relative z-10 intel-panel-dark border-b ops-hairline px-4 md:px-6 py-4">
        {targetUrl && (
          <div
            className="font-mono text-sm text-[#4ade80] mb-2 truncate cursor-blink"
            title={targetUrl}
          >
            {targetUrl}
          </div>
        )}
        {runningStage ? (
          <div className="flex items-center gap-2 text-sm text-[var(--cream)]/70">
            <span className="class-label text-[var(--terminal)] border-[var(--terminal)]">
              Running
            </span>
            <span className="font-medium text-[var(--cream)]">{runningStage.label}</span>
            {runningStage.badge && (
              <span className="ops-pill text-[10px] py-1 px-2">{runningStage.badge}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--cream)]/70 flex-wrap">
            <span className="signal-dot active" />
            <span className="font-mono text-xs uppercase tracking-wider">All systems online</span>
            <span className="text-[var(--cream)]/30">·</span>
            <span className="ops-tabular font-mono text-xs">
              {completedCount}/{stages.length} stages
            </span>
          </div>
        )}
      </div>

      {/* Telemetry strip */}
      <div className="relative z-10 border-b ops-hairline px-4 py-3 overflow-x-auto intel-panel-dark">
        <div className="flex items-stretch gap-2 min-w-max">
          {statusItems.map((item) => (
            <div
              key={item.label}
              className={`telemetry-cell rounded px-3 py-2 flex flex-col gap-0.5 ${item.accent ? 'active' : ''}`}
            >
              <span className="ops-kicker">{item.label}</span>
              <span
                className={`font-mono text-[12px] ops-tabular truncate max-w-[140px] ${item.accent ? 'text-[#4ade80]' : 'text-[var(--cream)]'}`}
                title={String(item.value)}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex min-h-0">
        <div className="w-[60%] overflow-y-auto border-r ops-hairline intel-panel-dark flex flex-col">
          <div className="px-4 py-2 border-b ops-hairline">
            <span className="ops-kicker">Pipeline modules</span>
          </div>
          <div className="flex-1">
            {stages.map((stage, index) => (
              <PipelineStageRow
                key={stage.id}
                stage={stage}
                isActive={stage.id === selectedStageId}
                onClick={() => setSelectedStageId(stage.id)}
                showConnector={index < stages.length - 1}
              />
            ))}
          </div>
          <div className="px-6 py-3 border-t ops-hairline">
            <div className="h-[3px] rounded-full overflow-hidden bg-black/30">
              <div className="progress-bar-fill rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 font-mono text-[11px] text-[var(--cream)]/55 ops-tabular">
              {progress}% complete
              {estimateRemaining() && ` · ~${estimateRemaining()} left`}
            </div>
          </div>
        </div>

        <div className="w-[40%] overflow-hidden intel-panel-dark">
          <PipelineDetailPanel stage={selectedStage} allStages={stages} />
        </div>
      </div>
    </div>
  );
}
