"use client";

import { motion } from "framer-motion";
import { ScanConfig, PipelineStage } from "@/lib/scan-pipeline/types";
import LaunchDecisionBadge from "./LaunchDecisionBadge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  RotateCcw, 
  Copy,
  Download,
  Link as LinkIcon,
  Globe,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface ScanCompleteSummaryProps {
  result: any;
  error?: { message: string; failedStage?: string };
  stages: PipelineStage[];
  config: ScanConfig;
  startedAt?: Date;
  completedAt?: Date;
  onRetry: () => void;
  onReset: () => void;
}

export function ScanCompleteSummary({
  result,
  error,
  stages,
  config,
  startedAt,
  completedAt,
  onRetry,
  onReset,
}: ScanCompleteSummaryProps) {
  const duration = startedAt && completedAt 
    ? ((completedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)
    : "N/A";

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 py-12 max-w-4xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <XCircle className="w-16 h-16 text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SCAN_FAILED</h1>
          <p className="text-slate-400">The scan encountered an error and could not complete.</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 mb-8">
          <h3 className="text-red-400 font-bold mb-2">Error Details</h3>
          <p className="text-slate-300">{error.message}</p>
          {error.failedStage && (
            <p className="text-slate-500 text-sm mt-2">
              Failed at stage: <span className="text-red-400 font-mono">{error.failedStage}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Retry Scan
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
          >
            Configure New Scan
          </button>
        </div>
      </motion.div>
    );
  }

  const score = result?.launch_score || 0;
  const readinessStatus = score >= 80 ? "READY" : score >= 60 ? "NEEDS_FIXES" : "NOT_READY";
  const readinessConfig = {
    READY: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    NEEDS_FIXES: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    NOT_READY: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  };

  const topIssues = result?.issues
    ?.filter((i: any) => i.launch_blocker || i.severity === "critical")
    ?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-12 max-w-7xl"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Launch check complete</h1>
        <p className="text-slate-400 text-lg">Here's what we found and what you should fix before sharing.</p>
      </div>

      {/* Launch Decision Badge */}
      <div className="mb-12">
        <LaunchDecisionBadge scan={result} size="large" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          label="Routes Checked" 
          value={result?.pages_count || 0} 
          delay={0.5} 
        />
        <MetricCard 
          label="Blockers" 
          value={result?.critical_issues_count || 0} 
          delay={0.55} 
          alert={result?.critical_issues_count > 0} 
        />
        <MetricCard 
          label="Needs Fix" 
          value={result?.warning_issues_count || 0} 
          delay={0.6} 
        />
        <MetricCard 
          label="Duration" 
          value={`${duration}s`} 
          delay={0.65} 
        />
      </div>

      {/* Top Issues */}
      {topIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8 mb-8"
        >
          <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Fix Before Shipping
          </h3>
          <div className="space-y-3">
            {topIssues.map((issue: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-slate-950/50 rounded-lg border border-slate-700"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold mb-1">{issue.title || issue.issue_code}</div>
                  <div className="text-slate-400 text-sm line-clamp-2">{issue.what_found}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={() => {
            // Store result in sessionStorage and navigate
            sessionStorage.setItem('pipeline-scan-result', JSON.stringify({
              scan: result,
              config,
              stages,
              startedAt,
              completedAt
            }));
            window.location.href = '/dashboard/reports/pipeline-result';
          }}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20"
        >
          <FileText className="w-5 h-5" />
          Open Full Report
        </button>
        {result?.share_token && (
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/reports/${result.share_token}`;
              navigator.clipboard.writeText(shareUrl);
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
          >
            <Copy className="w-5 h-5" />
            Copy Share Link
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Run Another Scan
        </button>
      </motion.div>

      {/* Collapsed Pipeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 bg-slate-900/70 backdrop-blur-xl border border-emerald-400/10 rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Pipeline Summary
        </h3>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => {
            const colors = {
              completed: "bg-green-500/20 text-green-400 border-green-500/30",
              warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
              failed: "bg-red-500/20 text-red-400 border-red-500/30",
              skipped: "bg-slate-700/20 text-slate-600 border-slate-700/30",
              pending: "bg-slate-700/20 text-slate-500 border-slate-700/30",
              running: "bg-emerald-500/20 text-emerald-400 border-cyan-500/30",
            };

            return (
              <div
                key={stage.id}
                className={`px-3 py-1 rounded border text-xs font-mono uppercase ${colors[stage.status]}`}
              >
                {stage.shortLabel}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ label, value, delay, alert }: { label: string; value: string | number; delay: number; alert?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-slate-900/70 backdrop-blur-xl border rounded-xl p-4 ${
        alert ? "border-red-500/30" : "border-emerald-400/10"
      }`}
    >
      <div className={`text-2xl font-bold mb-1 ${alert ? "text-red-400" : "text-emerald-400"}`}>
        {value}
      </div>
      <div className="text-slate-500 text-xs uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}
