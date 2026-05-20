"use client";

import { motion } from "framer-motion";
import { StageStatus } from "@/lib/scan-pipeline/types";

interface PipelineConnectorProps {
  fromStatus: StageStatus;
  toStatus: StageStatus;
  index: number;
}

export function PipelineConnector({ fromStatus, toStatus, index }: PipelineConnectorProps) {
  const isActive = fromStatus === "completed" || fromStatus === "warning" || fromStatus === "running";
  const isAnimating = toStatus === "running";

  return (
    <div className="relative flex items-center justify-center px-2">
      {/* Base line */}
      <div className={`h-0.5 w-full transition-all ${
        isActive ? "bg-cyan-500/50" : "bg-slate-700"
      }`} />

      {/* Animated shimmer */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-1 w-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
            animate={{
              x: [-40, 40],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
