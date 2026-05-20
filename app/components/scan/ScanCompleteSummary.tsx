"use client";

import { motion } from "framer-motion";
import { ScanConfig, PipelineStage } from "@/lib/scan-pipeline/types";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  RotateCcw,
  AlertCircle,
  TrendingUp,
  Target,
  Shield,
  Info,
} from "lucide-react";

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

  const scanId = result?.id;

  // Extract launch readiness data
  const launchReadiness = result?.launch_readiness_score;
  const launchDecision = result?.launch_decision;
  const scanCoverage = result?.scan_coverage;
  const resultConfidence = result?.result_confidence;
  const targetFit = result?.target_fit;
  const targetFitReason = result?.target_fit_reason;
  const scoreMode = result?.score_mode;

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="launch-console scanline-overlay min-h-screen py-12"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-block mb-6">
              <div className="classified-stamp mb-4" style={{borderColor: '#dc2626', color: '#dc2626'}}>MISSION ABORT</div>
              <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/30">
                <XCircle className="w-16 h-16 text-red-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-red-400 mb-2 font-mono">SCAN FAILED</h1>
            <p className="text-secondary">The scan encountered an error and could not complete.</p>
          </div>

          <div className="intel-panel-dark border-red-500/30 rounded-2xl p-8 mb-8">
            <h3 className="text-red-400 font-bold mb-2 font-mono tracking-wide">ERROR DETAILS</h3>
            <p className="text-secondary">{error.message}</p>
            {error.failedStage && (
              <p className="text-tertiary text-sm mt-2 font-mono">
                Failed at stage: <span className="text-red-400 font-mono">{error.failedStage}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-lg transition-all font-mono"
            >
              <RotateCcw className="w-5 h-5" />
              RETRY SCAN
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-6 py-3 intel-panel-dark hover:bg-slate-700 text-primary font-bold rounded-lg transition-all font-mono"
            >
              CONFIGURE NEW SCAN
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine display based on score mode
  const isDiagnosticOnly = scoreMode === 'diagnostic_only';

  // Get launch decision colors and icons
  const getLaunchDecisionConfig = () => {
    switch (launchDecision) {
      case 'safe_to_share':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          label: 'Safe to Share',
          message: 'Your site looks good! No critical launch blockers detected.',
        };
      case 'fix_before_sharing':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          label: 'Fix Before Sharing',
          message: 'Some important items need attention before sharing publicly.',
        };
      case 'do_not_ship_yet':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          label: 'Do Not Ship Yet',
          message: 'Critical blockers found. Fix these before making your site public.',
        };
      case 'diagnostic_only':
        return {
          icon: Info,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          label: 'Diagnostic Only',
          message: targetFitReason || 'Launch Readiness scoring is not available for this scan.',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          label: 'Unknown',
          message: 'Scan completed but decision could not be determined.',
        };
    }
  };

  const decisionConfig = getLaunchDecisionConfig();
  const DecisionIcon = decisionConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="launch-console scanline-overlay min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Mission Complete Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="classified-stamp mb-4">MISSION COMPLETE</div>
            <div className={`inline-flex p-4 rounded-full ${decisionConfig.bg} border ${decisionConfig.border}`}>
              <DecisionIcon className={`w-16 h-16 ${decisionConfig.color}`} />
            </div>
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${decisionConfig.color} font-mono tracking-wide`}>
            {decisionConfig.label}
          </h1>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            {decisionConfig.message}
          </p>
        </div>

        {/* Diagnostic Only Banner */}
        {isDiagnosticOnly && targetFit === 'limited' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 intel-panel-dark rounded-2xl p-6"
          >
            <div className="flex gap-4">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-400 font-bold mb-2 font-mono tracking-wide">DIAGNOSTIC MODE</h3>
                <p className="text-secondary mb-3">
                  {targetFitReason}
                </p>
                <p className="text-tertiary text-sm font-mono">
                  <strong className="text-secondary">LaunchScan measures:</strong> Public launch hygiene, share readiness, metadata completeness, link health, route discoverability, indexing basics, form structure, and browser/basic production checks.
                </p>
                <p className="text-tertiary text-sm mt-2 font-mono">
                  <strong className="text-secondary">LaunchScan does NOT measure:</strong> Brand quality, SEO authority, enterprise SEO strategy, full performance quality, full accessibility compliance, full security posture, business credibility, or ranking potential.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Launch Readiness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider font-mono">
                Launch Readiness
              </h3>
            </div>
            <div className="mb-2">
              {isDiagnosticOnly ? (
                <div className="text-3xl font-bold text-secondary font-mono">
                  Diagnostic Only
                </div>
              ) : (
                <div className="text-5xl font-bold text-emerald-400 font-mono">
                  {launchReadiness ?? result?.launch_score ?? 0}
                  <span className="text-2xl text-tertiary">/100</span>
                </div>
              )}
            </div>
            <p className="text-tertiary text-sm font-mono">
              {isDiagnosticOnly 
                ? 'Not scored due to limited coverage or target fit'
                : 'Public launch hygiene for fast-shipped sites'
              }
            </p>
          </motion.div>

          {/* Scan Coverage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider font-mono">
                Scan Coverage
              </h3>
            </div>
            <div className="mb-2">
              <div className="text-5xl font-bold text-blue-400 font-mono">
                {scanCoverage ?? 0}
                <span className="text-2xl text-tertiary">%</span>
              </div>
            </div>
            <p className="text-tertiary text-sm font-mono">
              How much of the checklist was verified
            </p>
          </motion.div>

          {/* Result Confidence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider font-mono">
                Confidence
              </h3>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold text-purple-400 capitalize font-mono">
                {resultConfidence || 'Unknown'}
              </div>
            </div>
            <p className="text-tertiary text-sm font-mono">
              How reliable this result is
            </p>
          </motion.div>
        </div>

        {/* Scan Details */}
        <div className="intel-panel-dark rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-tertiary mb-1 font-mono uppercase tracking-wider text-xs">Target</div>
              <div className="text-secondary font-mono text-xs break-all">
                {config.targetUrl}
              </div>
            </div>
            <div>
              <div className="text-tertiary mb-1 font-mono uppercase tracking-wider text-xs">Scan Mode</div>
              <div className="text-primary font-semibold uppercase font-mono">
                {config.scanMode === 'quick' ? 'Quick Check' : config.scanMode === 'standard' ? 'Launch Check' : 'Deep Check'}
              </div>
            </div>
            <div>
              <div className="text-tertiary mb-1 font-mono uppercase tracking-wider text-xs">Target Fit</div>
              <div className={`font-semibold capitalize font-mono ${
                targetFit === 'ideal' ? 'text-emerald-400' :
                targetFit === 'acceptable' ? 'text-blue-400' :
                'text-amber-400'
              }`}>
                {targetFit || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-tertiary mb-1 font-mono uppercase tracking-wider text-xs">Duration</div>
              <div className="text-primary font-semibold font-mono">
                {duration}s
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="intel-panel-dark rounded-xl p-4 mb-8 text-xs text-tertiary border border-amber-500/20">
          <strong className="text-amber-400 font-mono">SCOPE NOTE:</strong> LaunchScan checks launch hygiene, not brand quality, SEO authority, full accessibility compliance, full security, or full performance. Skipped or unavailable checks reduce coverage/confidence, not Launch Readiness.
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => {
              try {
                window.location.href = `/dashboard/reports/pipeline-result?scanId=${scanId}`;
              } catch (e) {
                console.error('Storage error:', e);
                window.location.href = `/dashboard/reports/pipeline-result?scanId=${scanId}`;
              }
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 font-mono"
          >
            <FileText className="w-5 h-5" />
            OPEN FULL REPORT
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-8 py-4 intel-panel-dark hover:bg-slate-700 text-primary font-bold rounded-lg transition-all font-mono"
          >
            SCAN ANOTHER SITE
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
