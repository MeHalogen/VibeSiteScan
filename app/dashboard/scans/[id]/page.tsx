'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface Scan {
  id: string;
  target_url: string;
  status: string;
  launch_score?: number;
  critical_count: number;
  warning_count: number;
  pages_scanned: number;
  duration_ms?: number;
  created_at: string;
}

interface Issue {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  fix_suggestion: string;
  evidence: string;
}

export default function ScanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    fetchScanData();
  }, [resolvedParams.id]);

  async function fetchScanData() {
    try {
      // Fetch scan
      const scanResponse = await fetch(`/api/scans/${resolvedParams.id}`);
      if (!scanResponse.ok) throw new Error('Scan not found');
      
      // For demo, we'll use Supabase admin in API route
      // In production with auth, use the browser client with RLS
      const { data: scanData } = await scanResponse.json();
      setScan(scanData);

      // Fetch issues
      const issuesResponse = await fetch(`/api/scans/${resolvedParams.id}/issues`);
      if (issuesResponse.ok) {
        const { data: issuesData } = await issuesResponse.json();
        setIssues(issuesData || []);
      }
    } catch (error) {
      console.error('Error fetching scan data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createShareLink() {
    try {
      const response = await fetch(`/api/scans/${resolvedParams.id}/share`, {
        method: 'POST'
      });
      const data = await response.json();
      setShareUrl(data.shareUrl);
      // Copy to clipboard
      navigator.clipboard.writeText(data.shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      alert('Failed to create share link');
    }
  }

  async function exportPdf() {
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('VibeSiteScan Report', 10, 10);
      
      doc.setFontSize(12);
      doc.text(`Website: ${scan?.target_url}`, 10, 20);
      doc.text(`Score: ${scan?.launch_score || 'N/A'}`, 10, 28);
      doc.text(`Pages Scanned: ${scan?.pages_scanned || 0}`, 10, 36);
      doc.text(`Date: ${scan ? new Date(scan.created_at).toLocaleDateString() : ''}`, 10, 44);
      
      doc.setFontSize(14);
      doc.text('Top Issues:', 10, 56);
      
      doc.setFontSize(10);
      let y = 64;
      filteredIssues.slice(0, 15).forEach(issue => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(`[${issue.severity}] ${issue.title}`, 10, y);
        y += 6;
        if (issue.description && y < 280) {
          const lines = doc.splitTextToSize(issue.description, 180);
          doc.text(lines.slice(0, 2), 12, y);
          y += lines.slice(0, 2).length * 6 + 2;
        }
      });
      
      doc.save(`vibesitescan-report-${resolvedParams.id}.pdf`);
    } catch (error) {
      alert('Failed to generate PDF');
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!scan) {
    return <div className="min-h-screen flex items-center justify-center">Scan not found</div>;
  }

  const filteredIssues = issues.filter(issue => 
    filter === 'all' || issue.severity === filter
  );

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold">VibeSiteScan</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={exportPdf}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Export PDF
            </button>
            <a
              href={`/api/reports/${resolvedParams.id}/csv`}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Export CSV
            </a>
            <button
              onClick={createShareLink}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Share Report
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{scan.target_url}</h1>
              <p className="text-sm text-slate-500">
                Scanned on {new Date(scan.created_at).toLocaleString()} 
                {scan.duration_ms && ` • ${(scan.duration_ms / 1000).toFixed(1)}s`}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg ${
                (scan.launch_score || 0) >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                (scan.launch_score || 0) >= 60 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                {scan.launch_score || 0}
              </div>
              <p className="text-sm text-slate-500 mt-2">Launch Score</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
              <div className="text-sm text-red-800 dark:text-red-200">Critical</div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600">{warningIssues.length}</div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Warnings</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600">{scan.pages_scanned}</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Pages Scanned</div>
            </div>
          </div>
        </div>

        {/* Issues Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
            }`}
          >
            All Issues ({issues.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'critical' 
                ? 'bg-red-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
            }`}
          >
            Critical ({criticalIssues.length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === 'warning' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
            }`}
          >
            Warnings ({warningIssues.length})
          </button>
        </div>

        {/* Issues List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No {filter !== 'all' ? filter : ''} issues found! 🎉
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.severity === 'critical' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {issue.severity}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{issue.title}</h3>
                      {issue.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {issue.description}
                        </p>
                      )}
                      {issue.fix_suggestion && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                          💡 {issue.fix_suggestion}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                          {issue.category}
                        </span>
                        {issue.evidence && (
                          <span className="truncate">{issue.evidence}</span>
                        )}
                      </div>
                    </div>
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
