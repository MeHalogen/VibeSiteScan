"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLog } from "@/lib/scan-pipeline/types";
import { Terminal, Copy, Pause, Play, ChevronDown, ChevronUp } from "lucide-react";

interface EvidenceStreamProps {
  logs: ScanLog[];
}

export function EvidenceStream({ logs }: EvidenceStreamProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoscroll, setAutoscroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoscroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoscroll]);

  const handleCopy = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp.toLocaleTimeString()}] ${log.message}`
      )
      .join("\n");
    navigator.clipboard.writeText(logText);
  };

  const severityColors = {
    info: "text-cyan-400",
    success: "text-green-400",
    warning: "text-amber-400",
    error: "text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-slate-900/70 backdrop-blur-xl border border-cyan-400/10 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            EVIDENCE_STREAM
          </h3>
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">
            {logs.length} logs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoscroll(!autoscroll)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
            title={autoscroll ? "Pause auto-scroll" : "Resume auto-scroll"}
          >
            {autoscroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
            title="Copy logs"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              ref={scrollRef}
              className="p-4 bg-slate-950/50 font-mono text-xs max-h-64 overflow-y-auto custom-scrollbar"
            >
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-8">
                  Waiting for scan to start...
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-slate-600 flex-shrink-0">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>
                      <span className={severityColors[log.severity || "info"]}>
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
