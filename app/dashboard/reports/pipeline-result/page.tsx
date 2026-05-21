"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TerminalReportPage from "@/app/components/TerminalReportPage";

export default function PipelineResultPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scanId = searchParams.get("scanId");
    if (!scanId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/demo-scan/result/${encodeURIComponent(scanId!)}`);
        if (!res.ok) throw new Error("Report not found");
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Report not found");
        if (cancelled) return;
        
        // Debug: Check if linkResults exists
        console.log('📊 Report data loaded:');
        console.log('  - Pages:', data.result?.pages?.length || 0);
        console.log('  - Issues:', data.result?.issues?.length || 0);
        console.log('  - LinkResults:', data.result?.linkResults?.length || 0);
        console.log('  - Has result object:', !!data.result);
        console.log('  - Result keys:', data.result ? Object.keys(data.result).join(', ') : 'none');
        
        setReportData({ scan: data.scan, result: data.result });
      } catch (e) {
        if (cancelled) return;
        setReportData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl font-mono">
          Loading report...
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-mono mb-4">
            Report data not available
          </div>
          <div className="text-slate-400 text-sm mb-6">
            This report is no longer available (demo results expire). Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return <TerminalReportPage scan={reportData.scan} result={reportData.result} />;
}
