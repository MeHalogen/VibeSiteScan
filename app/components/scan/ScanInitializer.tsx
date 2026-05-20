"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ScanPhase, ScanConfig, ScanState, ScanMode, PIPELINE_STAGES, PipelineStage, ScanLog } from "@/lib/scan-pipeline/types";
import { PipelineOrchestrator } from "@/lib/scan-pipeline/orchestrator";
import { ScanConfigPanel } from "./ScanConfigPanel";
import { PipelineView } from "./PipelineView";
import { ScanCompleteSummary } from "./ScanCompleteSummary";

export function ScanInitializer() {
  const [scanState, setScanState] = useState<ScanState>({
    phase: "config",
    config: null,
    stages: PIPELINE_STAGES.map(s => ({ ...s, status: "pending" as const })),
    selectedStageId: null,
    logs: [],
  });

  const handleStartScan = async (config: ScanConfig) => {
    // Transition to running phase
    setScanState(prev => ({
      ...prev,
      phase: "running",
      config,
      startedAt: new Date(),
      scanId: `scan_${Date.now()}`,
    }));

    try {
      // Create orchestrator
      const orchestrator = new PipelineOrchestrator();

      // Start streaming scan events (real progress)
      const response = await fetch("/api/demo-scan/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: config.targetUrl,
          depth: config.scanMode === "quick" ? "quick" : "standard",
        }),
      });
      if (!response.ok || !response.body) throw new Error("Scan failed");

      async function* ndjsonEvents(body: ReadableStream<Uint8Array>) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              yield JSON.parse(trimmed);
            } catch {
              // ignore malformed line
            }
          }
        }
        if (buffer.trim()) {
          try {
            yield JSON.parse(buffer.trim());
          } catch {
            // ignore
          }
        }
      }

      const result = await orchestrator.runPipelineWithEvents(
        (stages, logs) => {
          setScanState(prev => ({
            ...prev,
            stages,
            logs,
          }));
        },
        ndjsonEvents(response.body)
      );

      // Transition to complete
      setScanState(prev => ({
        ...prev,
        phase: "complete",
        result,
        completedAt: new Date(),
      }));

    } catch (error: any) {
      setScanState(prev => ({
        ...prev,
        phase: "error",
        error: {
          message: error.message || "Scan failed",
          failedStage: prev.stages.find(s => s.status === "running")?.id,
        },
      }));
    }
  };

  const handleStageSelect = (stageId: string) => {
    setScanState(prev => ({
      ...prev,
      selectedStageId: stageId,
    }));
  };

  const handleRetry = () => {
    if (scanState.config) {
      handleStartScan(scanState.config);
    }
  };

  const handleReset = () => {
    setScanState({
      phase: "config",
      config: null,
      stages: PIPELINE_STAGES.map(s => ({ ...s, status: "pending" as const })),
      selectedStageId: null,
      logs: [],
    });
  };

  const shellClass =
    scanState.phase === "config"
      ? "launch-gate min-h-screen relative overflow-hidden"
      : "launch-console min-h-screen relative overflow-hidden scan-sweep scanline-overlay";

  return (
    <div className={shellClass}>
      <AnimatePresence mode="wait">
        {scanState.phase === "config" && (
          <ScanConfigPanel
            key="config"
            onStartScan={handleStartScan}
          />
        )}

        {scanState.phase === "running" && (
          <PipelineView
            key="running"
            config={scanState.config!}
            stages={scanState.stages}
            logs={scanState.logs}
            selectedStageId={scanState.selectedStageId}
            onStageSelect={handleStageSelect}
            scanId={scanState.scanId}
            startedAt={scanState.startedAt}
          />
        )}

        {(scanState.phase === "complete" || scanState.phase === "error") && (
          <ScanCompleteSummary
            key="complete"
            result={scanState.result}
            error={scanState.error}
            stages={scanState.stages}
            config={scanState.config!}
            startedAt={scanState.startedAt}
            completedAt={scanState.completedAt}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
