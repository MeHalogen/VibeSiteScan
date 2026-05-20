"use client";

import { useState, useEffect } from "react";
import { ScanConfig, PipelineStage, ScanLog } from "@/lib/scan-pipeline/types";
import { PipelineVerticalView } from "./PipelineVerticalView";

interface PipelineViewProps {
  config: ScanConfig;
  stages: PipelineStage[];
  logs: ScanLog[];
  selectedStageId: string | null;
  onStageSelect: (stageId: string) => void;
  scanId?: string;
  startedAt?: Date;
  onViewSummary?: () => void;
}

export function PipelineView({
  config,
  stages,
  logs,
  selectedStageId,
  onStageSelect,
  scanId,
  startedAt,
  onViewSummary,
}: PipelineViewProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  // Convert pipeline stages to format expected by vertical view
  const verticalStages = stages.map(stage => {
    // Generate badge text from stage metrics and status
    let badge = '';
    if (stage.status === 'running') {
      if (stage.id === 'links' && stage.metrics?.linksTotal) {
        badge = `${stage.metrics.linksChecked ?? 0}/${stage.metrics.linksTotal}`;
      } else if (stage.id === 'crawl' && stage.metrics?.pagesScanned) {
        badge = `${stage.metrics.pagesScanned} pages`;
      } else if (stage.id === 'discover' && stage.metrics?.discoveredPagesCount) {
        badge = `${stage.metrics.discoveredPagesCount} routes`;
      } else {
        badge = 'running';
      }
    } else if (stage.status === 'completed' || stage.status === 'warning') {
      // Generate summary badge from metrics
      if (stage.id === 'discover' && stage.metrics?.discoveredPagesCount) {
        badge = `${stage.metrics.discoveredPagesCount} routes`;
      } else if (stage.id === 'crawl' && stage.metrics?.pagesScanned) {
        badge = `${stage.metrics.pagesScanned} pages`;
      } else if (stage.id === 'links') {
        const broken = Number(stage.metrics?.brokenInternalLinksCount || 0) + Number(stage.metrics?.brokenExternalLinksCount || 0);
        badge = broken > 0 ? `${broken} broken` : '✓ ok';
      } else if (stage.id === 'seo' && stage.metrics?.pagesAnalyzed) {
        badge = `${stage.metrics.pagesAnalyzed} checked`;
      } else if (stage.id === 'forms' && stage.metrics?.formsFoundCount) {
        badge = `${stage.metrics.formsFoundCount} forms`;
      } else if (stage.id === 'score' && stage.metrics?.launchScore !== undefined) {
        badge = `${stage.metrics.launchScore}/100`;
      } else if (stage.status === 'warning') {
        badge = 'warning';
      } else {
        badge = '✓ ok';
      }
    } else if (stage.status === 'failed') {
      badge = 'failed';
    }

    return {
      id: stage.id,
      label: stage.label,
      status: stage.status === 'pending' ? 'idle' as const : 
              stage.status === 'running' ? 'running' as const :
              stage.status === 'completed' ? 'completed' as const :
              stage.status === 'warning' ? 'warning' as const :
              stage.status === 'skipped' ? 'idle' as const :
              'failed' as const,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
      badge,
      metrics: stage.metrics,
      evidenceLog: logs
        .map(log => ({
          timestamp: log.timestamp,
          severity: (log.severity || 'info') as 'info' | 'success' | 'warning' | 'error',
          message: log.message,
        })),
    };
  });

  const isRunning = stages.some(s => s.status === 'running' || s.status === 'pending');

  const scanModeLabel =
    config.scanMode === "quick"
      ? "Quick pass"
      : config.scanMode === "deep"
        ? "Release gate"
        : "Launch check";

  return (
    <PipelineVerticalView
      stages={verticalStages}
      isRunning={isRunning}
      elapsedTime={elapsedTime}
      targetUrl={config.targetUrl}
      scanId={scanId}
      scanModeLabel={scanModeLabel}
      onViewSummary={onViewSummary}
    />
  );
}
