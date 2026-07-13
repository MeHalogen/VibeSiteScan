"use client";

import { useState, useEffect } from "react";
import { ScanConfig, ScanPhase, PipelineStage, ScanLog } from "@/lib/scan-pipeline/types";
import { PipelineVerticalView } from "./PipelineVerticalView";

interface PipelineViewProps {
  phase: ScanPhase;
  config: ScanConfig;
  stages: PipelineStage[];
  logs: ScanLog[];
  scanId?: string;
  startedAt?: Date;
  completedAt?: Date;
  onViewSummary?: () => void;
  onCancel?: () => void;
}

function stageBadge(stage: PipelineStage): string {
  const m = stage.metrics ?? {};

  if (stage.status === "running") {
    if (stage.id === "links" && m.linksTotal) {
      return `${m.linksChecked ?? 0}/${m.linksTotal}`;
    }
    if (stage.id === "crawl" && m.pagesScanned) {
      return `${m.pagesScanned} pages`;
    }
    if (stage.id === "discover" && m.discoveredPagesCount) {
      return `${m.discoveredPagesCount} routes`;
    }
    return "running";
  }

  if (stage.status === "skipped") {
    return "skipped";
  }

  if (stage.status === "failed") {
    return "failed";
  }

  if (stage.status === "completed" || stage.status === "warning") {
    switch (stage.id) {
      case "discover":
        if (m.discoveredPagesCount) return `${m.discoveredPagesCount} routes`;
        break;
      case "crawl":
        if (m.pagesScanned) return `${m.pagesScanned} pages`;
        break;
      case "links": {
        const broken =
          Number(m.brokenInternalLinksCount || 0) + Number(m.brokenExternalLinksCount || 0);
        return broken > 0 ? `${broken} broken` : "✓ ok";
      }
      case "seo":
      case "social":
        if (Number(m.issuesFound || 0) > 0) return `${m.issuesFound} issues`;
        break;
      case "forms":
        if (Number(m.issuesFound || 0) > 0) return `${m.issuesFound} issues`;
        if (m.formsFoundCount != null) return `${m.formsFoundCount} forms`;
        break;
      case "browser": {
        const problems = Number(m.consoleErrors || 0) + Number(m.networkErrors || 0);
        if (problems > 0) return `${problems} errors`;
        break;
      }
      case "exposure":
        if (Number(m.riskyRoutes || 0) > 0) return `${m.riskyRoutes} risky`;
        break;
      case "ai_leftovers":
        if (Number(m.aiLeftovers || 0) > 0) return `${m.aiLeftovers} found`;
        break;
      case "keys":
        if (Number(m.keyPatterns || 0) > 0) return `${m.keyPatterns} exposed`;
        break;
      case "form_analysis":
        if (Number(m.formIssues || 0) > 0) return `${m.formIssues} issues`;
        break;
      case "security": {
        const crit = Number(m.criticalFindings || 0);
        const total = Number(m.securityFindings || 0);
        if (crit > 0) return `${crit} critical`;
        if (total > 0) return `${total} findings`;
        break;
      }
      case "performance":
        if (Number(m.performanceFindings || 0) > 0) return `${m.performanceFindings} signals`;
        if (m.ttfbMs != null) return `${m.ttfbMs}ms TTFB`;
        break;
      case "score":
        if (m.robotsFound === false || m.sitemapFound === false) return "gaps";
        break;
      case "report":
        if (m.launchScore !== undefined) return `${m.launchScore}/100`;
        break;
    }
    return stage.status === "warning" ? "warning" : "✓ ok";
  }

  return "";
}

export function PipelineView({
  phase,
  config,
  stages,
  logs,
  scanId,
  startedAt,
  completedAt,
  onViewSummary,
  onCancel,
}: PipelineViewProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Elapsed time freezes at completion — a stopped scan must not keep counting.
  useEffect(() => {
    if (!startedAt) return;

    const compute = () => {
      const end = completedAt ? completedAt.getTime() : Date.now();
      setElapsedTime(Math.max(0, Math.floor((end - startedAt.getTime()) / 1000)));
    };
    compute();
    if (completedAt) return;

    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [startedAt, completedAt]);

  const verticalStages = stages.map(stage => ({
    id: stage.id,
    label: stage.label,
    status: stage.status === "pending" ? ("idle" as const) : stage.status,
    statusMessage: stage.statusMessage,
    startedAt: stage.startedAt,
    completedAt: stage.completedAt,
    badge: stageBadge(stage),
    metrics: stage.metrics,
    evidenceLog: logs
      .filter(log => !log.stageId || log.stageId === stage.id)
      .map(log => ({
        timestamp: log.timestamp,
        severity: (log.severity || "info") as "info" | "success" | "warning" | "error",
        message: log.message,
      })),
  }));

  const isRunning = phase === "running";

  const scanModeLabel =
    config.scanMode === "quick"
      ? "Quick pass"
      : config.scanMode === "deep"
        ? "Release gate"
        : "Launch check";

  return (
    <PipelineVerticalView
      stages={verticalStages}
      allLogs={logs.map(l => ({
        timestamp: l.timestamp,
        severity: (l.severity || "info") as "info" | "success" | "warning" | "error",
        message: l.message,
        stageId: l.stageId,
      }))}
      isRunning={isRunning}
      phase={phase}
      elapsedTime={elapsedTime}
      targetUrl={config.targetUrl}
      scanId={scanId}
      scanModeLabel={scanModeLabel}
      onViewSummary={onViewSummary}
      onCancel={onCancel}
    />
  );
}
