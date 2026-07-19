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
  ExternalLink,
  Check,
  X,
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
  onViewPipeline?: () => void;
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
  onViewPipeline,
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

  // Certification (the green-light slab) — single source of truth from the engine
  const certification = result?.certification_json || result?.certification;

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
            {onViewPipeline && (
              <button
                onClick={onViewPipeline}
                className="flex items-center justify-center gap-2 px-6 py-3 intel-panel-dark hover:bg-slate-700 text-primary font-bold rounded-lg transition-all font-mono border border-blue-500/30"
              >
                <TrendingUp className="w-5 h-5" />
                VIEW PIPELINE
              </button>
            )}
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

  // The scan finished but the stored report could not be retrieved
  // (server restart, expired store). Say so — never render a summary
  // built from missing data.
  if (result?.report_unavailable) {
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
              <div className="classified-stamp mb-4" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                REPORT UNAVAILABLE
              </div>
              <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-16 h-16 text-amber-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-amber-400 mb-2 font-mono">SCAN FINISHED — REPORT LOST</h1>
            <p className="text-secondary max-w-2xl mx-auto">
              The scan completed, but the report could not be retrieved from the server.
              This usually means the server restarted or the result expired. Run the scan again to get a fresh report.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-lg transition-all font-mono"
            >
              <RotateCcw className="w-5 h-5" />
              RUN SCAN AGAIN
            </button>
            {onViewPipeline && (
              <button
                onClick={onViewPipeline}
                className="flex items-center justify-center gap-2 px-6 py-3 intel-panel-dark hover:bg-slate-700 text-primary font-bold rounded-lg transition-all font-mono border border-blue-500/30"
              >
                <TrendingUp className="w-5 h-5" />
                VIEW PIPELINE
              </button>
            )}
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

  // A diagnostic_only decision always means no readiness decision was assigned,
  // whether it was caused by limited target fit, low coverage, or limited confidence
  // (see determineScoreMode in lib/launch-readiness/scoring.ts). The cause only
  // changes the explanation copy, keyed off isLimitedFit below.
  const isDiagnosticOnly = scoreMode === 'diagnostic_only' || launchDecision === 'diagnostic_only';
  const isLimitedFit = targetFit === 'limited';

  // Get launch decision colors and icons
  const getLaunchDecisionConfig = () => {
    switch (launchDecision) {
      case 'safe_to_share':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          stampColor: '#10b981',
          label: 'Ready to Share',
          message: 'Your site looks good! No critical launch blockers detected.',
        };
      case 'fix_before_sharing':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          stampColor: '#f59e0b',
          label: 'Fix Before Sharing',
          message: 'Some important items need attention before sharing publicly.',
        };
      case 'do_not_ship_yet':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          stampColor: '#dc2626',
          label: 'Do Not Share Yet',
          message: 'Critical blockers found. Fix these before making your site public.',
        };
      case 'diagnostic_only':
        return {
          icon: Info,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          stampColor: '#3b82f6',
          label: 'Diagnostic Report Only',
          // Say why the decision is withheld — target fit and low coverage are
          // different reasons and must not be conflated.
          message: isLimitedFit
            ? 'This site is outside our ideal target. We checked what we could, but we are not assigning a share-readiness decision.'
            : 'We could not verify enough of the checklist to responsibly assign a share-readiness decision. See coverage below.',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          stampColor: '#64748b',
          label: 'Unknown',
          message: 'Scan completed but decision could not be determined.',
        };
    }
  };

  const decisionConfig = getLaunchDecisionConfig();
  const DecisionIcon = decisionConfig.icon;

  // ── Certification slab visual config ──
  const GATE_CONFIG: Record<string, { label: string; stamp: string; color: string; bg: string; border: string; Icon: any; blurb: string }> = {
    pass: { label: 'VibeSiteScan Verified', stamp: 'GREEN LIGHT', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', Icon: CheckCircle2, blurb: 'Security-clean and launch-ready.' },
    conditional: { label: 'Conditional', stamp: 'AMBER', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', Icon: AlertTriangle, blurb: 'Scanned successfully — fix the flagged items before you rely on the stamp.' },
    fail: { label: 'Not Verified', stamp: 'BLOCKED', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', Icon: XCircle, blurb: 'Launch blockers found. Fix these before shipping.' },
    unverified: { label: 'Unverified', stamp: 'INSUFFICIENT COVERAGE', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/40', Icon: Info, blurb: 'We could not verify enough of the site to issue a verdict.' },
  };
  const gate: string = certification?.gate || 'unverified';
  const gateCfg = GATE_CONFIG[gate] || GATE_CONFIG.unverified;
  const GateIcon = gateCfg.Icon;

  const gradeColor = (g: string | null): string => {
    switch (g) {
      case 'A': return 'text-emerald-400';
      case 'B': return 'text-lime-400';
      case 'C': return 'text-amber-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="launch-console scanline-overlay min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ── Certification slab (the headline verdict) ── */}
        {certification && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-10 rounded-2xl border ${gateCfg.border} ${gateCfg.bg} p-8`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className={`inline-flex p-4 rounded-2xl ${gateCfg.bg} border ${gateCfg.border} shrink-0`}>
                <GateIcon className={`w-14 h-14 ${gateCfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-[10px] font-mono uppercase tracking-widest border ${gateCfg.border} ${gateCfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${gate === 'pass' ? 'bg-emerald-400' : gate === 'fail' ? 'bg-red-400' : gate === 'conditional' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                  {gateCfg.stamp}
                </span>
                <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${gateCfg.color}`}>
                  {gateCfg.label}
                </h1>
                <p className="text-secondary mt-2 text-lg">{gateCfg.blurb}</p>
                {Array.isArray(certification.reasons) && certification.reasons.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {certification.reasons.map((r: string, i: number) => (
                      <li key={i} className="text-tertiary text-sm flex items-start gap-2">
                        <span className={gateCfg.color}>•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {certification.overallGrade && (
                <div className="text-center shrink-0 px-4">
                  <div className={`text-7xl font-bold font-mono ${gradeColor(certification.overallGrade)}`}>
                    {certification.overallGrade}
                  </div>
                  <div className="text-tertiary text-xs font-mono uppercase tracking-widest mt-1">Overall grade</div>
                </div>
              )}
            </div>

            {/* Per-pillar grades — nothing hides in an average */}
            {Array.isArray(certification.pillars) && certification.pillars.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {certification.pillars.map((p: any) => (
                  <div key={p.key} className="intel-panel-dark rounded-xl p-3 text-center border border-white/5">
                    <div className={`text-3xl font-bold font-mono ${gradeColor(p.grade)}`}>
                      {p.grade || '—'}
                    </div>
                    <div className="text-[11px] text-secondary font-mono uppercase tracking-wide mt-1 leading-tight">
                      {p.label}
                    </div>
                    {(p.blockers > 0 || p.warnings > 0) && (
                      <div className="text-[10px] text-tertiary mt-1">
                        {p.blockers > 0 ? `${p.blockers} critical` : `${p.warnings} to fix`}
                      </div>
                    )}
                    {p.grade === null && (
                      <div className="text-[10px] text-slate-500 mt-1">n/a</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* The certification slab above is the single headline verdict — no second
            redundant hero. Fallback heading only when there is no certification. */}
        {!certification && (
          <div className="text-center mb-12">
            <div className={`inline-flex p-4 rounded-full ${decisionConfig.bg} border ${decisionConfig.border} mb-4`}>
              <DecisionIcon className={`w-14 h-14 ${decisionConfig.color}`} />
            </div>
            <h1 className={`text-3xl font-bold mb-3 ${decisionConfig.color} tracking-tight`}>
              {decisionConfig.label}
            </h1>
            <p className="text-secondary text-lg max-w-2xl mx-auto">{decisionConfig.message}</p>
          </div>
        )}

        {/* Diagnostic Only Explanation Banner (low coverage / limited confidence) */}
        {isDiagnosticOnly && !isLimitedFit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 intel-panel-dark rounded-2xl p-6 border-l-4 border-blue-500"
          >
            <div className="flex gap-4">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-400 font-bold mb-3 text-lg">Why this result is diagnostic only</h3>
                <p className="text-secondary mb-3 leading-relaxed">
                  This scan could only verify {scanCoverage ?? 0}% of the checklist{resultConfidence ? ` with ${resultConfidence} confidence` : ''}. That is too little evidence to score launch readiness fairly, so rather than guess, we report only the findings we verified.
                </p>
                <p className="text-secondary leading-relaxed">
                  Skipped or unavailable checks reduce coverage and confidence — not your site&rsquo;s quality. Re-running the scan, or choosing a deeper scan mode, usually raises coverage.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Diagnostic Only Explanation Banner (limited target fit) */}
        {isDiagnosticOnly && isLimitedFit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 intel-panel-dark rounded-2xl p-6 border-l-4 border-blue-500"
          >
            <div className="flex gap-4">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-400 font-bold mb-3 text-lg">Why this result is diagnostic only</h3>
                <p className="text-secondary mb-3 leading-relaxed">
                  This appears to be a large, mature enterprise website. VibeSiteScan is optimized for AI-built sites, MVPs, landing pages, portfolios, and client previews — not full enterprise websites.
                </p>
                <p className="text-secondary leading-relaxed">
                  Large enterprise websites often have complex infrastructure, redirects, regional routing, bot protections, huge page graphs, and intentional SEO/security configurations. A simple launch-readiness decision would be misleading.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Diagnostic Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Report Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider font-mono">
                Report Type
              </h3>
            </div>
            <div className="mb-2">
              {isDiagnosticOnly ? (
                <div className="text-2xl font-bold text-blue-400 font-mono">
                  Diagnostic Only
                </div>
              ) : (
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  Launch Check
                </div>
              )}
            </div>
            <p className="text-tertiary text-sm">
              {isDiagnosticOnly 
                ? 'No readiness decision assigned'
                : 'Full readiness decision provided'
              }
            </p>
          </motion.div>

          {/* Target Fit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-amber-400" />
              <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider font-mono">
                Target Fit
              </h3>
            </div>
            <div className="mb-2">
              <div className={`text-2xl font-bold capitalize font-mono ${
                targetFit === 'ideal' ? 'text-emerald-400' :
                targetFit === 'acceptable' ? 'text-blue-400' :
                'text-amber-400'
              }`}>
                {targetFit || 'Unknown'}
              </div>
            </div>
            <p className="text-tertiary text-sm">
              {targetFit === 'limited' 
                ? 'Large mature website detected'
                : targetFit === 'ideal'
                ? 'Perfect fit for launch checks'
                : 'Acceptable fit for checks'
              }
            </p>
          </motion.div>

          {/* Scan Coverage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider font-mono">
                Scan Coverage
              </h3>
            </div>
            <div className="mb-2">
              <div className="text-4xl font-bold text-blue-400 font-mono">
                {scanCoverage ?? 0}
                <span className="text-2xl text-tertiary">%</span>
              </div>
            </div>
            <p className="text-tertiary text-sm">
              How much of the checklist could be verified
            </p>
          </motion.div>

          {/* Result Confidence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="intel-panel-dark rounded-2xl p-6 telemetry-cell"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider font-mono">
                Confidence
              </h3>
            </div>
            <div className="mb-2">
              <div className={`text-2xl font-bold capitalize font-mono ${
                resultConfidence === 'high' ? 'text-emerald-400' :
                resultConfidence === 'medium' ? 'text-blue-400' :
                'text-amber-400'
              }`}>
                {resultConfidence || 'Unknown'}
              </div>
            </div>
            <p className="text-tertiary text-sm">
              {isDiagnosticOnly 
                ? 'Result should not be treated as full audit'
                : 'How reliable this result is'
              }
            </p>
          </motion.div>
        </div>

        {/* Launch Readiness Score (only for non-diagnostic) */}
        {!isDiagnosticOnly && launchReadiness !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="intel-panel-dark rounded-2xl p-8 mb-8 text-center"
          >
            <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider font-mono mb-4">
              Launch Readiness Score
            </h3>
            <div className="text-7xl font-bold text-emerald-400 font-mono mb-2">
              {launchReadiness ?? result?.launch_score ?? 0}
              <span className="text-3xl text-tertiary">/100</span>
            </div>
            <p className="text-tertiary text-sm font-mono">
              Public launch hygiene for fast-shipped sites
            </p>
          </motion.div>
        )}

        {/* Target Details */}
        <div className="intel-panel-dark rounded-2xl p-6 mb-8">
          <h3 className="text-primary font-bold mb-4 text-sm uppercase tracking-wider font-mono">Target Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
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

        {/* Scope Note */}
        <div className="intel-panel-dark rounded-xl p-5 mb-8 border-l-4 border-amber-500">
          <h4 className="text-amber-400 font-bold mb-2 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
            <Info className="w-4 h-4" />
            Scope Note
          </h4>
          <p className="text-secondary text-sm leading-relaxed mb-2">
            This report reflects only public launch-hygiene checks we could verify. Skipped or unavailable checks reduce coverage and confidence, not the site's quality.
          </p>
          <p className="text-tertiary text-sm leading-relaxed">
            VibeSiteScan does not measure brand quality, SEO authority, enterprise SEO strategy, full accessibility compliance, full security posture, business credibility, or ranking potential.
          </p>
        </div>

        {/* What We Checked / What We Don't Check */}
        {isDiagnosticOnly && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* What We Checked */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="intel-panel-dark rounded-2xl p-6"
            >
              <h3 className="text-emerald-400 font-bold mb-4 text-lg flex items-center gap-2">
                <Check className="w-5 h-5" />
                What we checked
              </h3>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Public launch hygiene</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Share preview tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Metadata completeness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Link health</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Route discoverability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Indexing basics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Form structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Browser/mobile basics</span>
                </li>
              </ul>
            </motion.div>

            {/* What We Don't Check */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="intel-panel-dark rounded-2xl p-6"
            >
              <h3 className="text-red-400 font-bold mb-4 text-lg flex items-center gap-2">
                <X className="w-5 h-5" />
                What we do not check
              </h3>
              <ul className="space-y-2 text-sm text-tertiary">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Brand quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>SEO authority</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Enterprise SEO strategy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Full accessibility compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Full security posture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Business credibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Ranking potential</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Full performance quality</span>
                </li>
              </ul>
            </motion.div>
          </div>
        )}

        {/* CTA Section for Diagnostic Only (low coverage / limited confidence) */}
        {isDiagnosticOnly && !isLimitedFit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="intel-panel-dark rounded-2xl p-8 mb-8 text-center border-2 border-blue-500/30"
          >
            <h3 className="text-blue-400 font-bold text-2xl mb-3">Want a full readiness decision?</h3>
            <p className="text-secondary mb-6 max-w-2xl mx-auto">
              This site fits our target — the scan just could not verify enough of the checklist this run. Re-run the scan, or choose a deeper scan mode, to raise coverage and get a launch-readiness decision.
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg transition-all font-mono"
            >
              <RotateCcw className="w-5 h-5" />
              RE-RUN SCAN
            </button>
          </motion.div>
        )}

        {/* CTA Section for Diagnostic Only (limited target fit) */}
        {isDiagnosticOnly && isLimitedFit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="intel-panel-dark rounded-2xl p-8 mb-8 text-center border-2 border-emerald-500/30"
          >
            <h3 className="text-emerald-400 font-bold text-2xl mb-3">Want an accurate readiness decision?</h3>
            <p className="text-secondary mb-6 max-w-2xl mx-auto">
              Scan an AI-built site, MVP, landing page, portfolio, or client preview link to get a full launch-readiness decision with actionable recommendations.
            </p>
            <div className="text-tertiary text-sm mb-6">
              <p className="mb-2 font-semibold text-secondary">Try scanning:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs">Your Lovable app</span>
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs">Your Bolt site</span>
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs">Your Cursor-built landing page</span>
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs">Your portfolio</span>
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-xs">Your MVP landing page</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {scanId && (
            <button
              onClick={() => {
                window.location.href = `/dashboard/reports/pipeline-result?scanId=${scanId}`;
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 font-mono"
            >
              <FileText className="w-5 h-5" />
              OPEN FULL REPORT
            </button>
          )}
          {result?.share_token && (
            <button
              onClick={() => {
                window.open(`/r/${result.share_token}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 intel-panel-dark hover:bg-slate-700 text-primary font-bold rounded-lg transition-all font-mono border border-emerald-500/30"
            >
              <Shield className="w-5 h-5" />
              PUBLIC CERTIFICATE
            </button>
          )}
          {onViewPipeline && (
            <button
              onClick={onViewPipeline}
              className="flex items-center justify-center gap-2 px-8 py-4 intel-panel-dark hover:bg-slate-700 text-primary font-bold rounded-lg transition-all font-mono border border-blue-500/30"
            >
              <TrendingUp className="w-5 h-5" />
              VIEW PIPELINE
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-lg transition-all font-mono"
          >
            <ExternalLink className="w-5 h-5" />
            {isDiagnosticOnly ? 'SCAN ANOTHER SITE' : 'SCAN ANOTHER SITE'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
