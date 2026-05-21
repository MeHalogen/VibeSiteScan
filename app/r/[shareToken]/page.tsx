import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

export default async function PublicReportPage({ params }: { params: { shareToken: string } }) {
  const { shareToken } = params;
  
  const { data: scan } = await supabaseAdmin
    .from('scans')
    .select('*')
    .eq('share_token', shareToken)
    .single();
  
  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This report link is invalid or has expired.
          </p>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  
  const { data: issues } = await supabaseAdmin
    .from('scan_issues')
    .select('*')
    .eq('scan_id', scan.id)
    .order('severity', { ascending: false });
  
  const criticalCount = issues?.filter(i => i.severity === 'critical').length || 0;
  const warningCount = issues?.filter(i => i.severity === 'warning').length || 0;
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold">VibeSiteScan</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Report Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{scan.target_url}</h1>
              <p className="text-sm text-slate-500">
                Scanned on {new Date(scan.created_at).toLocaleString()}
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
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-red-800 dark:text-red-200">Critical</div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Warnings</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600">{scan.pages_scanned}</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Pages Scanned</div>
            </div>
          </div>
        </div>

        {/* Issues */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold">Issues Found</h2>
          </div>
          
          {(!issues || issues.length === 0) ? (
            <div className="p-8 text-center text-slate-500">
              No issues found! This site looks great! 🎉
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {issues.map((issue) => (
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
                          <span className="truncate max-w-md">{issue.evidence}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Report generated by{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              VibeSiteScan
            </Link>
          </p>
          <Link
            href="/dashboard/new-scan"
            className="inline-block px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Scan Your Website
          </Link>
        </div>
      </div>
    </div>
  );
}
