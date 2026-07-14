"use client";

import { useState, useEffect, useRef } from 'react';
import { calculateProgress } from '@/lib/design-system';
import type { ScanPhase } from '@/lib/scan-pipeline/types';
import { PipelineStageRow } from './PipelineStageRow';

interface PipelineStage {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'warning' | 'failed' | 'skipped';
  statusMessage?: string;
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

interface LogLine {
  timestamp: Date;
  severity: 'info' | 'success' | 'warning' | 'error';
  message: string;
  stageId?: string;
}

interface PipelineVerticalViewProps {
  stages: PipelineStage[];
  allLogs: LogLine[];
  isRunning: boolean;
  phase?: ScanPhase;
  elapsedTime: number;
  targetUrl?: string;
  scanId?: string;
  scanModeLabel?: string;
  onViewSummary?: () => void;
  onCancel?: () => void;
}

function getMetric(stages: PipelineStage[], stageId: string, key: string) {
  return stages.find((s) => s.id === stageId)?.metrics?.[key];
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SEV_COLOR: Record<string, string> = {
  success: '#4ade80',
  info: 'rgba(237,232,220,0.72)',
  warning: '#f59e0b',
  error: '#f87171',
};

/**
 * Human "what is this stage actually doing" line for the NOW SCANNING panel.
 * Uses the real metrics streamed from the scanner.
 */
function nowScanningDetail(stage: PipelineStage): string {
  const m = stage.metrics ?? {};
  switch (stage.id) {
    case 'init':
      return 'Normalizing URL, checking protocol and reachability';
    case 'score':
      return 'Fetching robots.txt and sitemap.xml';
    case 'fetch':
      return m.statusCode ? `Homepage responded ${m.statusCode} in ${m.responseTimeMs}ms` : 'Fetching the homepage';
    case 'discover':
      return m.discoveredPagesCount ? `Mapped ${m.discoveredPagesCount} public routes` : 'Discovering public routes';
    case 'crawl':
      return m.lastPath ? `Fetching ${m.lastPath} (${m.pagesScanned}/${m.totalPlanned})` : 'Scanning discovered routes';
    case 'links':
      return m.linksTotal ? `Checking link ${m.linksChecked}/${m.linksTotal}` : 'Extracting and checking links';
    case 'browser':
      return 'Console errors, failed requests, viewport';
    case 'seo':
      return 'Titles, descriptions, headings, canonical';
    case 'social':
      return 'OpenGraph and Twitter share tags';
    case 'forms':
      return m.formsFoundCount != null ? `${m.formsFoundCount} form(s) analyzed` : 'Form structure and labels';
    case 'exposure':
      return m.publicRoutes != null ? `Classified ${m.publicRoutes} routes by risk` : 'Mapping public routes';
    case 'ai_leftovers':
      return 'Placeholder copy, lorem ipsum, template artifacts';
    case 'keys':
      return 'Scanning source for exposed keys and tokens';
    case 'form_analysis':
      return 'Validation, submission wiring, risky patterns';
    case 'security':
      return m.securityFindings != null ? `${m.securityFindings} finding(s) across headers/cookies/libraries` : 'Checking security headers, cookies, mixed content, libraries';
    case 'performance':
      return m.ttfbMs != null ? `TTFB ${m.ttfbMs}ms · ${m.performanceFindings ?? 0} signal(s)` : 'TTFB, weight, compression, render-blocking';
    case 'report':
      return 'Computing launch readiness and the certificate';
    default:
      return stage.statusMessage || 'Working…';
  }
}

export function PipelineVerticalView({
  stages,
  allLogs,
  isRunning,
  phase,
  elapsedTime,
  targetUrl,
  scanId,
  scanModeLabel = 'Launch check',
  onViewSummary,
  onCancel,
}: PipelineVerticalViewProps) {
  const [selectedStageId, setSelectedStageId] = useState(stages[0]?.id || 'init');
  const [userSelected, setUserSelected] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const runningStage = stages.find((s) => s.status === 'running');

  useEffect(() => {
    if (runningStage && isRunning && !userSelected) setSelectedStageId(runningStage.id);
  }, [runningStage, isRunning, userSelected]);

  // Autoscroll the live terminal feed while running.
  useEffect(() => {
    if (isRunning) feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [allLogs.length, isRunning]);

  const focusStage = stages.find((s) => s.id === selectedStageId) || runningStage || stages[0];
  const completedCount = stages.filter((s) => s.status === 'completed' || s.status === 'warning').length;
  const skippedCount = stages.filter((s) => s.status === 'skipped').length;
  const failedCount = stages.filter((s) => s.status === 'failed').length;
  const progress =
    phase === 'error'
      ? calculateProgress(stages.map((s) => (s.status === 'completed' || s.status === 'warning' ? s : { ...s, status: 'idle' as const })))
      : calculateProgress(stages);

  // Telemetry
  const crawlPages = Number(getMetric(stages, 'crawl', 'pagesScanned'));
  const fetchDone = ['completed', 'warning'].includes(stages.find((s) => s.id === 'fetch')?.status || '');
  const pagesScanned = crawlPages > 0 ? crawlPages : fetchDone ? 1 : 0;
  const routesFound = Number(getMetric(stages, 'discover', 'discoveredPagesCount')) || 0;
  const linksChecked = Number(getMetric(stages, 'links', 'linksChecked')) || 0;
  const linksTotal = Number(getMetric(stages, 'links', 'linksTotal')) || 0;
  const secFindings = getMetric(stages, 'security', 'securityFindings');
  const homepageStatus = getMetric(stages, 'fetch', 'statusCode');
  const grade = getMetric(stages, 'report', 'overallGrade');

  const telemetry: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: 'Depth', value: scanModeLabel },
    { label: 'Progress', value: `${progress}%`, accent: isRunning },
    { label: 'Pages', value: pagesScanned > 0 ? (routesFound > pagesScanned ? `${pagesScanned}/${routesFound}` : `${pagesScanned}`) : '—' },
    { label: 'Links', value: linksTotal > 0 ? `${linksChecked}/${linksTotal}` : '—', accent: runningStage?.id === 'links' },
    { label: 'Homepage', value: homepageStatus != null ? `HTTP ${homepageStatus}` : '—' },
    { label: 'Security', value: secFindings != null ? `${secFindings} findings` : '—', accent: runningStage?.id === 'security' },
    { label: 'Grade', value: grade != null && grade !== '—' ? String(grade) : '—', accent: !isRunning && grade != null && grade !== '—' },
  ];

  const statusLabel = isRunning
    ? 'System active'
    : phase === 'error'
      ? 'Scan stopped'
      : phase === 'complete'
        ? 'Scan complete'
        : 'Standby';

  return (
    <div className="min-h-screen bg-[#0a0e14] text-cream relative overflow-hidden scanline-overlay bg-coord-grid-dark flex flex-col">
      {/* Corner labels */}
      <span className="absolute top-2 left-3 font-mono text-[9px] text-white/20 z-20">STATUS: {isRunning ? 'SCANNING' : 'ONLINE'}</span>
      <span className="absolute top-2 right-3 font-mono text-[9px] text-white/20 z-20">LAUNCH GATE</span>

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[12px] font-semibold tracking-widest uppercase text-white/85 shrink-0">VibeSiteScan</span>
          <span className="flex items-center gap-2 shrink-0">
            <span className={`signal-dot ${isRunning ? 'active' : phase === 'error' ? 'warn' : 'active'}`} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">{statusLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {targetUrl && (
            <span className="font-mono text-[11px] text-emerald-400/90 truncate max-w-[38vw] hidden sm:inline" title={targetUrl}>
              {targetUrl}
            </span>
          )}
          <span className="font-mono text-[10px] text-white/45 tabular-nums">
            {now.toLocaleTimeString('en-US', { hour12: false })} · {fmtTime(elapsedTime)}
          </span>
        </div>
      </header>

      {/* Telemetry strip */}
      <div className="relative z-10 border-b border-white/10 bg-black/30 px-4 py-2 overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-max">
          {telemetry.map((t) => (
            <div key={t.label} className={`rounded px-3 py-1.5 border ${t.accent ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/8 bg-white/[0.02]'}`}>
              <div className="font-mono text-[8px] uppercase tracking-widest text-white/40">{t.label}</div>
              <div className={`font-mono text-[12px] tabular-nums ${t.accent ? 'text-emerald-400' : 'text-white/85'}`}>{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-column console.
          Each column gets min-w-0 so a long log line can't blow the grid tracks
          out of proportion (CSS grid children default to min-width:auto). */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-[minmax(200px,0.9fr)_1.6fr_1.4fr] min-h-0">

        {/* LEFT — modules */}
        <div className="hidden md:flex flex-col border-r border-white/10 bg-black/25 overflow-y-auto min-w-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 sticky top-0 bg-black/40 backdrop-blur z-10">
            <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-white/80">Modules</span>
            <span className="font-mono text-[10px] text-white/40 tabular-nums">{completedCount}/{stages.length}</span>
          </div>
          <div className="flex-1">
            {stages.map((stage, i) => (
              <PipelineStageRow
                key={stage.id}
                stage={stage}
                isActive={stage.id === selectedStageId}
                onClick={() => { setSelectedStageId(stage.id); setUserSelected(true); }}
                showConnector={i < stages.length - 1}
              />
            ))}
          </div>
        </div>

        {/* CENTER — NOW SCANNING */}
        <div className="flex flex-col border-r border-white/10 min-h-0 min-w-0 overflow-y-auto">
          <div className="px-5 pt-4 pb-3 border-b border-white/10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">
              {isRunning ? 'Now scanning' : 'Selected module'}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-white">{focusStage?.label}</span>
              {focusStage?.status === 'running' && <span className="signal-dot active" />}
              {focusStage?.badge && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-white/70">{focusStage.badge}</span>
              )}
            </div>
            <div className="font-mono text-[12px] text-emerald-400/80 mt-2">{focusStage ? nowScanningDetail(focusStage) : ''}</div>
            {focusStage?.statusMessage && (focusStage.status === 'skipped' || focusStage.status === 'failed' || focusStage.status === 'warning') && (
              <div className={`text-[12px] mt-2 ${focusStage.status === 'failed' ? 'text-red-400' : focusStage.status === 'warning' ? 'text-amber-400' : 'text-white/45'}`}>
                {focusStage.statusMessage}
              </div>
            )}
          </div>

          {/* Stage's own evidence (real streamed lines for this module) */}
          <div className="flex-1 px-5 py-4 min-h-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Evidence · {focusStage?.label?.toLowerCase()}</div>
            <div className="space-y-1">
              {(focusStage?.evidenceLog || []).slice(-40).map((l, i) => (
                <div key={i} className="flex gap-2 font-mono text-[11px] leading-relaxed min-w-0">
                  <span className="text-white/25 tabular-nums shrink-0">
                    {l.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="min-w-0 break-all" style={{ color: SEV_COLOR[l.severity] }}>{l.message}</span>
                </div>
              ))}
              {(!focusStage?.evidenceLog || focusStage.evidenceLog.length === 0) && (
                <div className="font-mono text-[11px] text-white/30">
                  {focusStage?.status === 'idle' ? 'Waiting for this module…' : focusStage?.status === 'skipped' ? (focusStage.statusMessage || 'Skipped') : 'No evidence for this module'}
                </div>
              )}
            </div>
          </div>

          {/* Progress + controls */}
          <div className="px-5 py-3 border-t border-white/10 bg-black/30">
            <div className="h-[3px] rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/45 tabular-nums">
                {phase === 'error' ? `Stopped at ${progress}%` : `${progress}% complete`}
                {skippedCount > 0 && ` · ${skippedCount} skipped`}
                {failedCount > 0 && ` · ${failedCount} failed`}
              </span>
              {isRunning && onCancel ? (
                <button
                  onClick={onCancel}
                  className="px-4 py-1.5 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-mono text-[10px] tracking-widest uppercase rounded transition-colors"
                >
                  Stop scan
                </button>
              ) : onViewSummary ? (
                <button
                  onClick={onViewSummary}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] tracking-widest uppercase rounded transition-colors"
                >
                  View summary
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* RIGHT — live terminal feed (all stages) */}
        <div className="hidden md:flex flex-col bg-black/40 min-h-0 min-w-0">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-white/50">Terminal stream</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="flex flex-col gap-1">
              {allLogs.slice(-300).map((l, i) => (
                <div key={i} className="flex gap-2 font-mono text-[10.5px] leading-relaxed min-w-0">
                  <span className="text-white/20 tabular-nums shrink-0">
                    {l.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {l.stageId && <span className="text-white/25 shrink-0 uppercase">[{l.stageId}]</span>}
                  <span className="min-w-0 break-all" style={{ color: SEV_COLOR[l.severity] }}>{l.message}</span>
                </div>
              ))}
              <div ref={feedEndRef} />
              {isRunning && (
                <div className="flex gap-2 font-mono text-[10.5px] text-emerald-400/80">
                  <span className="cursor-blink">▊</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
