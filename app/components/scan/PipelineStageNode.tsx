"use client";

import { motion } from "framer-motion";
import { StageStatus } from "@/lib/scan-pipeline/types";
import { 
  Check, 
  AlertTriangle, 
  X, 
  Loader2, 
  Minus,
  Power,
  Globe,
  Network,
  GitBranch,
  Link,
  Search,
  Share2,
  ClipboardList,
  Monitor,
  Gauge,
  FileText,
} from "lucide-react";

const STAGE_ICONS = {
  init: Power,
  fetch: Globe,
  discover: Network,
  crawl: GitBranch,
  links: Link,
  seo: Search,
  social: Share2,
  forms: ClipboardList,
  browser: Monitor,
  score: Gauge,
  report: FileText,
};

interface PipelineStageNodeProps {
  stageId: string;
  label: string;
  shortLabel: string;
  status: StageStatus;
  selected: boolean;
  onClick: () => void;
  index: number;
}

export function PipelineStageNode({
  stageId,
  label,
  shortLabel,
  status,
  selected,
  onClick,
  index,
}: PipelineStageNodeProps) {
  const Icon = STAGE_ICONS[stageId as keyof typeof STAGE_ICONS] || Globe;

  const statusConfig = {
    pending: {
      bg: "bg-slate-800/50",
      border: "border-slate-700",
      text: "text-slate-500",
      icon: <Minus className="w-5 h-5" />,
      ring: "",
    },
    running: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/50",
      text: "text-emerald-400",
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      ring: "ring-2 ring-emerald-500/30 animate-pulse shadow-lg shadow-emerald-500/20",
    },
    completed: {
      bg: "bg-green-500/10",
      border: "border-green-500/50",
      text: "text-green-400",
      icon: <Check className="w-5 h-5" />,
      ring: "",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/50",
      text: "text-amber-400",
      icon: <AlertTriangle className="w-4 h-4" />,
      ring: "",
    },
    failed: {
      bg: "bg-red-500/10",
      border: "border-red-500/50",
      text: "text-red-400",
      icon: <X className="w-4 h-4" />,
      ring: "",
    },
    skipped: {
      bg: "bg-slate-800/30",
      border: "border-slate-700/50",
      text: "text-slate-600",
      icon: <Minus className="w-4 h-4" />,
      ring: "",
    },
  };

  const config = statusConfig[status];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
        config.border
      } ${config.bg} ${config.ring} ${
        selected ? "scale-105 shadow-xl shadow-emerald-500/20" : "hover:scale-102"
      }`}
    >
      {/* Icon container */}
      <div className={`relative p-4 rounded-lg border ${config.border} ${config.bg}`}>
        <Icon className={`w-7 h-7 ${config.text}`} />
        
        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 p-1 rounded-full border ${config.border} ${config.bg}`}>
          {config.icon}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
          {shortLabel}
        </div>
      </div>

      {/* Glow effect for running */}
      {status === "running" && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-cyan-500/10"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
}
