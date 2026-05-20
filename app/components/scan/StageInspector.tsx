"use client";

import { motion } from "framer-motion";
import { PipelineStage } from "@/lib/scan-pipeline/types";
import { getStageContext, getImpactColor } from "@/lib/stage-context";
import { Info, AlertCircle, CheckCircle2 } from "lucide-react";

interface StageInspectorProps {
  stage: PipelineStage | null;
}

export function StageInspector({ stage }: StageInspectorProps) {
  if (!stage) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-xl border border-emerald-400/10 rounded-2xl p-8 h-full flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a pipeline stage to view details</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: "text-slate-500",
    running: "text-emerald-400",
    completed: "text-green-400",
    warning: "text-amber-400",
    failed: "text-red-400",
    skipped: "text-slate-600",
  };

  const context = getStageContext(stage.id);

  return (
    <motion.div
      key={stage.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-slate-900/70 backdrop-blur-xl border border-emerald-400/10 rounded-2xl p-8 h-full overflow-y-auto"
    >
      {/* Stage header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-white">{stage.label}</h3>
          <span className={`text-sm font-bold uppercase ${statusColors[stage.status]}`}>
            {stage.status}
          </span>
        </div>
        <p className="text-slate-400 text-sm">{stage.description}</p>
      </div>

      {/* Why This Matters */}
      {context && (
        <div className="mb-6 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-400 mb-2">Why this matters before launch</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{context.whyItMatters}</p>
            </div>
          </div>
          
          {/* Launch Impact */}
          {context.impact && (
            <div className="mt-3 pt-3 border-t border-emerald-500/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Launch impact:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getImpactColor(context.impact).bg} ${getImpactColor(context.impact).text} border ${getImpactColor(context.impact).border}`}>
                  {context.impact}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* What We Check */}
      {context && context.whatWeCheck.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            What we check
          </h4>
          <ul className="space-y-2">
            {context.whatWeCheck.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timing */}
      {stage.startedAt && (
        <div className="mb-6 p-4 bg-slate-950/50 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500 mb-1">Started</div>
              <div className="text-emerald-400 font-mono">
                {new Date(stage.startedAt).toLocaleTimeString()}
              </div>
            </div>
            {stage.completedAt && (
              <div>
                <div className="text-slate-500 mb-1">Duration</div>
                <div className="text-emerald-400 font-mono">
                  {((new Date(stage.completedAt).getTime() - new Date(stage.startedAt).getTime()) / 1000).toFixed(1)}s
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics */}
      {stage.metrics && Object.keys(stage.metrics).length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">
            Evidence Collected
          </h4>
          <div className="space-y-2">
            {Object.entries(stage.metrics).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-700"
              >
                <span className="text-slate-300 text-sm capitalize">
                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                </span>
                <span className="text-white font-mono text-sm">
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : value?.toString() || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage-specific content */}
      {stage.status === "pending" && (
        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-sm">
            This stage is pending. It will run when previous stages complete.
          </p>
        </div>
      )}

      {stage.status === "running" && !stage.metrics && (
        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
          <p className="text-cyan-400 text-sm">
            Stage is currently executing... Metrics will appear once available.
          </p>
        </div>
      )}

      {stage.status === "skipped" && (
        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-sm">
            This stage was skipped. {stage.id === "browser" && "Browser diagnostics are not available in this environment. HTML and link checks completed successfully."}
          </p>
        </div>
      )}

      {stage.status === "failed" && (
        <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
          <p className="text-red-400 text-sm">
            This stage failed to complete. Check the evidence stream for error details.
          </p>
        </div>
      )}

      {/* Logs */}
      {stage.logs && stage.logs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">
            Stage Logs
          </h4>
          <div className="space-y-1 font-mono text-xs">
            {stage.logs.map((log, i) => (
              <div key={i} className="text-slate-400 p-2 bg-slate-950/50 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
