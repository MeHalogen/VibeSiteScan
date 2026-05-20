'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  const avgScore = scans.length > 0
    ? Math.round(scans.filter(s => s.launch_score).reduce((sum, s) => sum + (s.launch_score || 0), 0) / scans.filter(s => s.launch_score).length)
    : 0;

  const totalCritical = scans.reduce((sum, s) => sum + s.critical_count, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold">LaunchScan</span>
          </Link>
          <Link
            href="/dashboard/new-scan"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Scan
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Scans</div>
            <div className="text-3xl font-bold">{scans.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Average Score</div>
            <div className="text-3xl font-bold">{scans.length > 0 ? avgScore : '--'}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Critical Issues</div>
            <div className="text-3xl font-bold text-red-600">{totalCritical}</div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold">Recent Scans</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading scans...</div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">No scans yet. Run your first scan!</p>
              <Link
                href="/dashboard/new-scan"
                className="inline-block px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first scan
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {scans.map((scan) => (
                <div key={scan.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white mb-1">
                      {scan.target_url}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(scan.created_at).toLocaleDateString()} • {scan.scan_depth} scan • {scan.pages_scanned} pages
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {scan.launch_score !== undefined && (
                        <span className="text-sm font-medium">
                          Score: <span className={scan.launch_score >= 80 ? 'text-green-600' : scan.launch_score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                            {scan.launch_score}
                          </span>
                        </span>
                      )}
                      {scan.critical_count > 0 && (
                        <span className="text-sm text-red-600">
                          {scan.critical_count} critical
                        </span>
                      )}
                      {scan.warning_count > 0 && (
                        <span className="text-sm text-yellow-600">
                          {scan.warning_count} warnings
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        scan.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        scan.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        scan.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View Report
                    </Link>
                    <a
                      href={`/api/reports/${scan.id}/csv`}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-700"
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
