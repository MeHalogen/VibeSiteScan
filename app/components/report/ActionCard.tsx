"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle } from "lucide-react";
import { ActionCard as ActionCardType } from "@/lib/issue-grouping";

interface ActionCardProps {
  action: ActionCardType;
  index: number;
}

export function ActionCard({ action, index }: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First card expanded by default
  const [copied, setCopied] = useState(false);

  const severityConfig = {
    blocker: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      badge: "BLOCKER",
    },
    "needs-fix": {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      badge: "NEEDS FIX",
    },
    info: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      badge: "INFO",
    },
  };

  const config = severityConfig[action.severity];

  const handleCopyCode = () => {
    if (action.codeExample) {
      navigator.clipboard.writeText(action.codeExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-2 ${config.border} ${config.bg} rounded-xl overflow-hidden`}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-start gap-4 hover:bg-white/5 transition-colors"
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center font-bold ${config.color}`}>
          {index + 1}
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-bold text-white">{action.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2 py-1 rounded ${config.bg} ${config.color} border ${config.border}`}>
                {config.badge}
              </span>
              {isExpanded ? (
                <ChevronUp className={`w-5 h-5 ${config.color}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${config.color}`} />
              )}
            </div>
          </div>
          
          <p className="text-slate-400 text-sm mb-3">{action.description}</p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-500">
              Affects: <span className={config.color}>{action.affectedPages.length} page{action.affectedPages.length > 1 ? 's' : ''}</span>
            </span>
            <span className="text-slate-500">
              Effort: <span className="text-slate-300">{action.effort}</span>
            </span>
            <span className="text-slate-500">
              Impact: <span className={`text-${action.launchImpact === 'High' ? 'amber' : action.launchImpact === 'Medium' ? 'blue' : 'slate'}-400`}>{action.launchImpact}</span>
            </span>
            {!action.canShipWithout && (
              <span className="text-red-400 font-medium">⚠️ BLOCKS LAUNCH</span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-6 space-y-6">
              {/* Why It Matters */}
              <div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Why this matters
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">{action.whyItMatters}</p>
              </div>

              {/* How to Fix */}
              <div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  How to fix
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">{action.howToFix}</p>
                
                {/* Code Example */}
                {action.codeExample && (
                  <div className="relative">
                    <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                      <pre className="text-emerald-400">{action.codeExample}</pre>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Affected Pages */}
              <div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Affected pages ({action.affectedPages.length})
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {action.affectedPages.map((url, i) => (
                    <div key={i} className="text-xs text-slate-400 font-mono break-all">
                      • {url}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700/50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Owner:</span>
                  <span className="text-slate-300">{action.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Can ship without it?</span>
                  <span className={action.canShipWithout ? "text-green-400" : "text-red-400"}>
                    {action.canShipWithout ? "Yes, but fix before public sharing" : "No - blocks launch"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
