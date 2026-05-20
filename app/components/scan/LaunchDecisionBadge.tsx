"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { getLaunchDecision } from "@/lib/product-language";

interface LaunchDecisionBadgeProps {
  scan: {
    critical_issues_count?: number;
    warning_issues_count?: number;
    launch_score?: number;
    launch_decision?: string;
    score_mode?: string;
    target_fit?: string;
  };
  size?: 'default' | 'large';
}

function LaunchDecisionBadge({ scan, size = 'default' }: LaunchDecisionBadgeProps) {
  // Check for diagnostic-only mode
  const isDiagnosticOnly = scan.launch_decision === 'diagnostic_only' || scan.score_mode === 'diagnostic_only';

  const decision = isDiagnosticOnly 
    ? { status: 'diagnostic' as const, message: 'This site is outside our ideal target. We checked what we could, but we are not assigning a share-readiness decision.', canShip: true }
    : getLaunchDecision(scan);

  const statusConfig = {
    safe: {
      icon: CheckCircle2,
      label: "Ready to Share",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      glow: "shadow-green-500/20",
    },
    fix: {
      icon: AlertTriangle,
      label: "Fix Before Sharing",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      glow: "shadow-amber-500/20",
    },
    block: {
      icon: XCircle,
      label: "Do Not Share Yet",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      glow: "shadow-red-500/20",
    },
    diagnostic: {
      icon: Info,
      label: "Diagnostic Report Only",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      glow: "shadow-blue-500/20",
    },
  };

  const config = statusConfig[decision.status];
  const Icon = config.icon;

  const iconSize = size === 'large' ? 'w-16 h-16' : 'w-12 h-12';
  const textSize = size === 'large' ? 'text-3xl' : 'text-2xl';
  const padding = size === 'large' ? 'p-8' : 'p-6';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${config.bg} ${config.border} border-2 rounded-2xl ${padding} shadow-2xl ${config.glow} text-center`}
    >
      <div className={`inline-flex p-4 rounded-full ${config.bg} ${config.border} border mb-4`}>
        <Icon className={`${iconSize} ${config.color}`} />
      </div>
      <h2 className={`${textSize} font-bold ${config.color} mb-3`}>
        {config.label}
      </h2>
      <p className="text-slate-300 leading-relaxed max-w-2xl mx-auto">
        {decision.message}
      </p>
      {isDiagnosticOnly && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-blue-300 text-sm">
            This does not mean the site is poor quality. Large enterprise websites are outside the ideal use case for launch-readiness checks.
          </p>
        </div>
      )}
      {!decision.canShip && !isDiagnosticOnly && (
        <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-red-400 text-sm font-medium">
            ⚠️ Critical blockers detected. Fix these before sharing publicly.
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default LaunchDecisionBadge;
