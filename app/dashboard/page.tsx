'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AccountBar } from '@/app/components/AccountBar';

interface Scan {
  id: string;
  target_url: string;
  status: string;
  launch_score?: number;
  critical_count: number;
  warning_count: number;
  pages_scanned: number;
  created_at: string;
  scan_depth: string;
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  async function fetchScans() {
    try {
      const response = await fetch('/api/scans');
      const data = await response.json();
      setScans(data.scans || []);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  }

  const scored = scans.filter((s) => s.launch_score != null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, s) => sum + (s.launch_score || 0), 0) / scored.length)
    : null;
  const totalCritical = scans.reduce((sum, s) => sum + (s.critical_count || 0), 0);

  const scoreColor = (v: number) =>
    v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-lg">
            VibeSiteScan
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link
              href="/dashboard/new-scan-pipeline"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              New scan
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AccountBar />

        <h1 className="text-2xl font-semibold mb-6">Your scans</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total scans', value: String(scans.length) },
            { label: 'Average score', value: avgScore == null ? '—' : String(avgScore) },
            { label: 'Critical issues', value: String(totalCritical), danger: totalCritical > 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5 border border-white/10 bg-white/[0.03]">
              <div className="text-xs uppercase tracking-wide text-white/40 mb-2">{s.label}</div>
              <div className={`text-3xl font-semibold ${s.danger ? 'text-red-400' : 'text-white'}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent scans */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold">Recent scans</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-white/40">Loading…</div>
          ) : scans.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/50 mb-5">No scans yet — run your first one.</p>
              <Link
                href="/dashboard/new-scan-pipeline"
                className="inline-block px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Scan a website
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/8">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{scan.target_url}</div>
                    <div className="text-sm text-white/45 mt-0.5">
                      {new Date(scan.created_at).toLocaleDateString()} · {scan.scan_depth} · {scan.pages_scanned} pages
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      {scan.launch_score != null && (
                        <span className="text-white/60">
                          Score <span className={scoreColor(scan.launch_score)}>{scan.launch_score}</span>
                        </span>
                      )}
                      {scan.critical_count > 0 && (
                        <span className="text-red-400">{scan.critical_count} critical</span>
                      )}
                      {scan.warning_count > 0 && (
                        <span className="text-amber-400">{scan.warning_count} warnings</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="px-3 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      Report
                    </Link>
                    <a
                      href={`/api/reports/${scan.id}/csv`}
                      className="px-3 py-2 text-sm text-white/45 hover:text-white/80"
                    >
                      CSV
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
