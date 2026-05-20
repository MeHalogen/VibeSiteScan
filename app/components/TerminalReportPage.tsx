'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getLaunchDecision } from '@/lib/product-language';
import { groupIssuesIntoActions, generateAIFixPrompt } from '@/lib/issue-grouping';
import { detectDuplicateMetadata } from '@/lib/route-classification';
import LaunchDecisionBadge from '@/app/components/scan/LaunchDecisionBadge';
import { ActionCard } from '@/app/components/report/ActionCard';

interface ScanData {
  id: string;
  target_url: string;
  scan_depth: string;
  status: string;
  launch_score: number;
  created_at: string;
  duration_ms: number;
  pages_count: number;
  issues_count: number;
  critical_issues_count: number;
  warning_issues_count: number;
  discovered_pages_count: number;
  skipped_pages_count: number;
  internal_links_count: number;
  external_links_count: number;
  broken_internal_links_count: number;
  broken_external_links_count: number;
  redirects_count: number;
  forms_found_count: number;
  console_errors_count: number;
  browser_checks_status: string;
  robots_found: boolean;
  sitemap_found: boolean;
}

interface ScanResult {
  pages: any[];
  linkResults: any[];
  issues: any[];
  formChecks: any[];
  robotsData?: any;
  sitemapData?: any;
  browserChecks?: any;
  consoleEvents?: any[];
}

interface ReportPageProps {
  scan: ScanData;
  result: ScanResult;
}

type TabType = 'overview' | 'crawl-map' | 'pages' | 'links' | 'issues' | 'seo' | 'social' | 'forms' | 'console' | 'passed' | 'fix-plan' | 'coverage';

export default function TerminalReportPage({ scan, result }: ReportPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [linkFilter, setLinkFilter] = useState<'all' | 'internal' | 'external' | 'broken' | 'redirects' | 'ignored'>('all');

  // Handle both pipeline and traditional data structures
  const scanData = scan as any;
  const resultData = result as any;
  const pagesData = resultData?.pages || scanData?.pages || [];
  const issuesData = resultData?.issues || scanData?.issues || [];

  // Use actual linkResults from scanner (fallback only if truly empty)
  const allLinkResults = useMemo(() => {
    console.log('🔗 TerminalReportPage - Computing allLinkResults:');
    console.log('  - resultData?.linkResults:', resultData?.linkResults?.length || 0);
    console.log('  - scanData?.linkResults:', scanData?.linkResults?.length || 0);
    console.log('  - resultData keys:', resultData ? Object.keys(resultData).slice(0, 10).join(', ') : 'none');
    
    // First priority: check result object directly (from API response)
    if (resultData?.linkResults && resultData.linkResults.length > 0) {
      console.log('  ✓ Using resultData.linkResults:', resultData.linkResults.length);
      return resultData.linkResults;
    }
    
    // Second priority: check scan.linkResults (from stored data)
    if (scanData?.linkResults && scanData.linkResults.length > 0) {
      console.log('  ✓ Using scanData.linkResults:', scanData.linkResults.length);
      return scanData.linkResults;
    }
    
    console.log('  ⚠ No linkResults found, generating from pages');
    // Fallback: generate basic links from pages data if no linkResults exist
    const generatedLinks: any[] = [];
    pagesData.forEach((page: any) => {
      if (page.url || page.normalizedUrl) {
        generatedLinks.push({
          sourceUrl: page.sourceUrl || 'homepage',
          targetUrl: page.url || page.normalizedUrl,
          anchorText: page.sourceAnchorText || '-',
          linkType: 'internal',
          status: page.status || page.statusCode || 200,
          isBroken: (page.status >= 400) || (page.statusCode >= 400) || false,
          isRedirect: (page.status >= 300 && page.status < 400) || false,
          method: 'GET',
          time: page.loadTimeMs || 0,
        });
      }
    });
    return generatedLinks;
  }, [resultData, scanData, pagesData]);

  const tabs: { id: TabType; label: string; count?: number; icon: string }[] = [
    { id: 'overview', label: 'Summary', icon: '█' },
    { id: 'fix-plan', label: 'Fix Before Shipping', count: issuesData.filter((i: any) => i.severity === 'critical' || i.severity === 'warning').length, icon: '⚠' },
    { id: 'crawl-map', label: 'Routes', count: scan.pages_count, icon: '◉' },
    { id: 'links', label: 'Links', count: allLinkResults.length, icon: '⚡' },
    { id: 'seo', label: 'Metadata', icon: '◈' },
    { id: 'social', label: 'Share Preview', icon: '♦' },
    { id: 'forms', label: 'Forms', count: scan.forms_found_count || 0, icon: '▤' },
    { id: 'console', label: 'Browser', count: scan.console_errors_count || 0, icon: '▶' },
    { id: 'passed', label: 'Ready Checks', icon: '✓' },
    { id: 'issues', label: 'Raw Issues', count: scan.issues_count || issuesData.length, icon: '⚠' },
    { id: 'pages', label: 'Raw Pages', count: pagesData.length, icon: '▣' },
    { id: 'coverage', label: 'Coverage', icon: '◎' },
  ];

  // Filtered links
  const filteredLinks = useMemo(() => {
    switch (linkFilter) {
      case 'internal':
        return allLinkResults.filter((l: any) => l.linkType === 'internal');
      case 'external':
        return allLinkResults.filter((l: any) => l.linkType === 'external');
      case 'broken':
        return allLinkResults.filter((l: any) => l.isBroken);
      case 'redirects':
        return allLinkResults.filter((l: any) => l.isRedirect);
      case 'ignored':
        return allLinkResults.filter((l: any) => l.ignoredReason);
      default:
        return allLinkResults;
    }
  }, [allLinkResults, linkFilter]);

  // Grouped issues
  const groupedIssues = useMemo(() => {
    const groups: Record<string, any[]> = {};
    issuesData.forEach((issue: any) => {
      const key = issue.issueCode || issue.type || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
    });
    return groups;
  }, [issuesData]);

  const scoreColor = scan.launch_score >= 80 ? 'text-emerald-400' : scan.launch_score >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreStatus = scan.launch_score >= 80 ? 'SAFE TO SHARE' : scan.launch_score >= 60 ? 'FIX BEFORE SHARING' : 'DO NOT SHIP';
  const scoreBorder = scan.launch_score >= 80 ? 'border-emerald-500/30' : scan.launch_score >= 60 ? 'border-amber-500/30' : 'border-red-500/30';

  return (
    <div className="launch-console scanline-overlay min-h-screen bg-coord-grid-dark">
      {/* Header */}
      <header className="intel-panel-dark border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard/new-scan-pipeline" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xl font-mono">L</span>
              </div>
              <div>
                <div className="text-lg font-bold text-primary font-mono tracking-wide">LAUNCHSCAN</div>
                <div className="text-[9px] text-tertiary font-mono tracking-widest uppercase">Intelligence System</div>
              </div>
            </Link>
            <Link
              href="/dashboard/new-scan-pipeline"
              className="px-5 py-2.5 text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-all uppercase tracking-widest"
            >
              NEW SCAN
            </Link>
          </div>

          {/* Scan Info */}
          <div className={`intel-panel-dark border ${scoreBorder} rounded-lg p-4 mb-4`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="classified-stamp mb-2">LAUNCH REPORT</div>
                <h1 className="text-xl font-bold text-primary font-mono mb-2 break-all">{scan.target_url}</h1>
                <div className="flex items-center gap-4 text-xs text-secondary font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="signal-dot active" />
                    {new Date(scan.created_at).toLocaleString()}
                  </span>
                  <span className="text-white/20">•</span>
                  <span>{scan.scan_depth === 'quick' ? 'Quick Scan' : 'Full Scan'}</span>
                  <span className="text-white/20">•</span>
                  <span>{(scan.duration_ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="telemetry-cell text-right px-6 py-4">
                <div className="text-xs text-tertiary font-mono uppercase tracking-widest mb-1">Launch Score</div>
                <div className={`text-5xl font-bold font-mono mb-1 ${scoreColor}`}>
                  {scan.launch_score}
                </div>
                <div className={`text-xs font-mono font-bold uppercase tracking-wider ${scoreColor}`}>
                  {scoreStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-mono font-semibold transition-all whitespace-nowrap uppercase tracking-wider border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                <span className="mr-2 text-emerald-400/50">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] intel-panel-dark`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <OverviewTab scan={scan} result={result} scoreColor={scoreColor.replace('text-', '')} />}
        {activeTab === 'crawl-map' && <CrawlMapTab pages={pagesData} />}
        {activeTab === 'pages' && <PagesTab pages={pagesData} onSelectPage={setSelectedPage} />}
        {activeTab === 'links' && <LinksTab links={filteredLinks} filter={linkFilter} onFilterChange={setLinkFilter} allLinks={resultData?.linkResults || []} />}
        {activeTab === 'issues' && <IssuesTab issues={issuesData} grouped={groupedIssues} onSelectIssue={setSelectedIssue} />}
        {activeTab === 'seo' && <SEOTab pages={pagesData} />}
        {activeTab === 'social' && <SocialTab pages={pagesData} />}
        {activeTab === 'forms' && <FormsTab forms={resultData?.formChecks || []} />}
        {activeTab === 'console' && <ConsoleTab browserChecks={resultData?.browserChecks} consoleEvents={resultData?.consoleEvents || []} />}
        {activeTab === 'passed' && <PassedTab scan={scan} result={result} />}
        {activeTab === 'fix-plan' && <FixPlanTab issues={issuesData} grouped={groupedIssues} />}
        {activeTab === 'coverage' && <CoverageTab scan={scan} />}
      </main>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}

      {/* Page Detail Modal */}
      {selectedPage && (
        <PageDetailModal page={selectedPage} onClose={() => setSelectedPage(null)} />
      )}
    </div>
  );
}

// OVERVIEW TAB
function OverviewTab({ scan, result, scoreColor }: any) {
  const resultData = result as any;
  const issuesData = resultData?.issues || scan?.issues || [];
  const decision = getLaunchDecision(scan);
  
  return (
    <div className="space-y-6">
      {/* Launch Decision - Hero */}
      <div className="intel-panel-dark border-emerald-500/20 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest mb-3">
              Launch Readiness
            </h2>
            <LaunchDecisionBadge scan={scan} size="large" />
            <p className="text-secondary mt-4 text-base leading-relaxed font-mono">
              {decision.message}
            </p>
          </div>
          <div className="telemetry-cell text-right px-6 py-4">
            <div className={`text-5xl font-bold font-mono ${scoreColor}`}>
              {scan.launch_score}
            </div>
            <div className="text-xs text-tertiary mt-1 font-mono uppercase tracking-wider">out of 100</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Routes Checked" value={scan.pages_count} alert={false} />
        <MetricCard label="Blockers" value={scan.critical_issues_count} alert={scan.critical_issues_count > 0} />
        <MetricCard label="Needs Fix" value={scan.warning_issues_count} alert={scan.warning_issues_count > 5} />
        <MetricCard label="Broken Links" value={scan.broken_internal_links_count} alert={scan.broken_internal_links_count > 0} />
      </div>

      {/* What We Checked */}
      <div className="intel-panel-dark rounded-xl p-6">
        <h3 className="text-sm font-mono font-semibold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
          <span className="text-emerald-400">◆</span> What we checked
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 font-mono text-xs">
              🔗
            </div>
            <div>
              <div className="font-mono font-medium text-primary text-sm">Links & Navigation</div>
              <div className="text-xs text-tertiary font-mono">Found {scan.discovered_pages_count} routes, checked {scan.pages_count}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 font-mono text-xs">
              📱
            </div>
            <div>
              <div className="font-mono font-medium text-primary text-sm">Share Preview</div>
              <div className="text-xs text-tertiary font-mono">Social media cards & metadata</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 font-mono text-xs">
              📝
            </div>
            <div>
              <div className="font-mono font-medium text-primary text-sm">Forms</div>
              <div className="text-xs text-tertiary font-mono">Detected {scan.forms_found_count} form(s)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 font-mono text-xs">
              🖥️
            </div>
            <div>
              <div className="font-mono font-medium text-primary text-sm">Browser Checks</div>
              <div className="text-xs text-tertiary font-mono">{scan.console_errors_count} console error(s) found</div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Transparency */}
      <div className="intel-panel-dark rounded-xl p-6">
        <h3 className="text-sm font-mono font-semibold text-primary mb-4 uppercase tracking-wider">How your score is calculated</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary font-mono text-sm">Starting score</span>
            <span className="font-mono text-emerald-400 font-bold">100</span>
          </div>
          {scan.critical_issues_count > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-white/10">
              <span className="text-secondary font-mono text-sm">Blockers (×10 points each)</span>
              <span className="font-mono text-red-400 font-bold">-{scan.critical_issues_count * 10}</span>
            </div>
          )}
          {scan.warning_issues_count > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-white/10">
              <span className="text-secondary font-mono text-sm">Warnings (×2 points each)</span>
              <span className="font-mono text-amber-400 font-bold">-{scan.warning_issues_count * 2}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3 border-t-2 border-white/10 font-semibold">
            <span className="text-primary font-mono">Final score</span>
            <span className={`font-mono text-2xl font-bold ${scoreColor}`}>
              {scan.launch_score}
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {issuesData.length > 0 ? (
        <div className="intel-panel-dark border-amber-500/20 rounded-xl p-6">
          <h3 className="text-sm font-mono font-semibold text-amber-400 mb-3 uppercase tracking-wider">Next steps</h3>
          <p className="text-secondary mb-4 font-mono text-sm">
            Switch to the <span className="font-semibold text-amber-400">"FIX BEFORE SHIPPING"</span> tab to see grouped action items 
            and copy the AI fix prompt for Cursor, Lovable, or Bolt.
          </p>
          <div className="text-xs text-tertiary font-mono">
            ◆ We've grouped {issuesData.length} issue(s) into actionable fixes
          </div>
        </div>
      ) : (
        <div className="intel-panel-dark border-emerald-500/20 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h3 className="text-lg font-mono font-semibold text-emerald-400 mb-2 uppercase">Ready to share!</h3>
          <p className="text-secondary font-mono text-sm">
            No critical issues found. Your site looks good to launch.
          </p>
        </div>
      )}
    </div>
  );
}

// CRAWL MAP TAB
function CrawlMapTab({ pages }: any) {
  return (
    <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
      <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>◉</span> PAGE_DISCOVERY_MAP
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">DEPTH</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">SOURCE</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ANCHOR_TEXT</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TARGET_URL</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">STATUS</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">REASON</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page: any, idx: number) => (
              <tr key={idx} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors">
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono">{page.crawlDepth || 0}</span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                  {page.sourceUrl || '(root)'}
                </td>
                <td className="py-3 px-4 text-slate-300">
                  {page.sourceAnchorText || '-'}
                </td>
                <td className="py-3 px-4 text-cyan-400 font-mono text-xs break-all">
                  {page.url || page.normalizedUrl}
                </td>
                <td className="py-3 px-4">
                  {page.crawlDepth === 0 ? (
                    <span className="text-emerald-400 text-lg" title="Homepage">🏠</span>
                  ) : page.status >= 200 && page.status < 300 ? (
                    <span className="text-green-400 text-lg" title="Success">✓</span>
                  ) : page.status >= 300 && page.status < 400 ? (
                    <span className="text-yellow-400 text-lg" title="Redirect">↻</span>
                  ) : page.status >= 400 ? (
                    <span className="text-red-400 text-lg" title="Error">✗</span>
                  ) : page.isCrawled || page.statusCode ? (
                    <span className="text-green-400 text-lg" title="Crawled">✓</span>
                  ) : (
                    <span className="text-slate-500 text-lg" title="Discovered">◌</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500 text-xs">
                  {page.crawlDepth === 0 
                    ? 'homepage' 
                    : page.sourceAnchorText 
                      ? `internal link from homepage` 
                      : page.excludedReason || page.includedReason || 'scanned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// PAGES TAB
function PagesTab({ pages, onSelectPage }: any) {
  return (
    <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
      <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>▣</span> SCANNED_PAGES_DETAIL
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">URL</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">STATUS</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TIME</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TITLE</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">H1</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">LINKS</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ISSUES</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page: any, idx: number) => {
              const seo = page.seo || page.seoData || {};
              const titleStatus = seo.title ? (seo.titleLength >= 30 && seo.titleLength <= 60 ? '✓' : '⚠') : '✗';
              const h1Status = seo.h1 || seo.h1Texts?.length > 0 ? '✓' : '✗';
              
              return (
                <tr key={idx} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors">
                  <td className="py-3 px-4 text-cyan-400 font-mono text-xs break-all">
                    {page.url || page.normalizedUrl}
                  </td>
                  <td className="py-3 px-4">
                    {page.status >= 200 && page.status < 300 ? (
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold">{page.status}</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold">{page.status}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{page.responseTimeMs || page.response_time_ms || '-'}ms</td>
                  <td className="py-3 px-4">
                    <span className={titleStatus === '✓' ? 'text-green-400' : titleStatus === '⚠' ? 'text-yellow-400' : 'text-red-400'}>
                      {titleStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={h1Status === '✓' ? 'text-green-400' : 'text-red-400'}>
                      {h1Status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {(page.internalLinksCount || 0) + (page.externalLinksCount || 0)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {page.issuesCount || 0}
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => onSelectPage(page)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold uppercase"
                    >
                      → DETAILS
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// LINKS TAB
function LinksTab({ links, filter, onFilterChange, allLinks }: any) {
  const counts: Record<string, number> = {
    all: allLinks.length,
    internal: allLinks.filter((l: any) => l.linkType === 'internal').length,
    external: allLinks.filter((l: any) => l.linkType === 'external').length,
    broken: allLinks.filter((l: any) => l.isBroken).length,
    redirects: allLinks.filter((l: any) => l.isRedirect).length,
    ignored: allLinks.filter((l: any) => l.ignoredReason).length,
  };

  const filters: Array<{ id: typeof filter; label: string }> = [
    { id: 'all', label: 'ALL' },
    { id: 'internal', label: 'INTERNAL' },
    { id: 'external', label: 'EXTERNAL' },
    { id: 'broken', label: 'BROKEN' },
    { id: 'redirects', label: 'REDIRECTS' },
    { id: 'ignored', label: 'IGNORED' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase transition-all ${
              filter === f.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {f.label}
            <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-700/50 text-[10px]">
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Links Table */}
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">SOURCE</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ANCHOR</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TARGET</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TYPE</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">STATUS</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">METHOD</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TIME</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link: any, idx: number) => (
                <tr key={idx} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono text-xs break-all">
                    {link.sourceUrl}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {link.anchorText || '(no text)'}
                  </td>
                  <td className="py-3 px-4 text-cyan-400 font-mono text-xs break-all">
                    {link.targetUrl || link.normalizedTargetUrl}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      link.linkType === 'internal' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {link.linkType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {link.isBroken ? (
                      <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold">BROKEN</span>
                    ) : link.isRedirect ? (
                      <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-xs font-bold">REDIRECT</span>
                    ) : link.ignoredReason ? (
                      <span className="px-2 py-1 rounded bg-slate-500/10 text-slate-400 text-xs font-bold">IGNORED</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold">OK</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs font-mono">{link.checkedMethod || 'GET'}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{link.responseTimeMs || '-'}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ISSUES TAB
function IssuesTab({ issues, grouped, onSelectIssue }: any) {
  const [view, setView] = useState<'grouped' | 'individual'>('grouped');

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-[#151b2b] border border-[#1e293b] rounded-lg p-2">
        <button
          onClick={() => setView('grouped')}
          className={`px-4 py-2 rounded text-xs font-semibold uppercase transition-all ${
            view === 'grouped'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          GROUPED_VIEW
        </button>
        <button
          onClick={() => setView('individual')}
          className={`px-4 py-2 rounded text-xs font-semibold uppercase transition-all ${
            view === 'individual'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          INDIVIDUAL_VIEW
        </button>
      </div>

      {/* Grouped View */}
      {view === 'grouped' && (
        <div className="space-y-3">
          {Object.entries(grouped).map(([code, issueList]: [string, any]) => {
            const firstIssue = issueList[0];
            return (
              <div key={code} className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        firstIssue.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      }`}>
                        {firstIssue.severity}
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs font-bold">
                        {issueList.length} AFFECTED
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">{code.replace(/_/g, ' ').toUpperCase()}</h3>
                    <p className="text-sm text-slate-400 mb-3">{firstIssue.businessImpact || firstIssue.whyItMatters || firstIssue.message}</p>
                    {firstIssue.developerFix && (
                      <div className="text-sm text-cyan-400 font-mono mb-3">→ FIX: {firstIssue.developerFix}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">ESTIMATED_FIX</div>
                    <div className="text-sm font-semibold text-slate-300">{firstIssue.estimatedFixTime || '5-15 min'}</div>
                  </div>
                </div>
                <div className="border-t border-[#1e293b] pt-3">
                  <div className="text-xs text-slate-500 uppercase mb-2">AFFECTED_PAGES:</div>
                  <div className="space-y-1">
                    {issueList.slice(0, 3).map((issue: any, idx: number) => (
                      <div key={idx} className="text-xs text-cyan-400 font-mono truncate">
                        → {issue.affectedUrl || issue.url}
                      </div>
                    ))}
                    {issueList.length > 3 && (
                      <div className="text-xs text-slate-500">... and {issueList.length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual View */}
      {view === 'individual' && (
        <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e293b]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">SEVERITY</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">TYPE</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">PAGE</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">DESCRIPTION</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">PRIORITY</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{issue.issueCode || issue.type}</td>
                    <td className="py-3 px-4 text-cyan-400 font-mono text-xs truncate max-w-[200px]">
                      {issue.affectedUrl || issue.url}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs truncate max-w-[250px]">
                      {issue.whatFound || issue.message}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-xs font-mono">
                        {issue.priority || 50}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => onSelectIssue(issue)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold uppercase"
                      >
                        → DETAILS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// SEO TAB
function SEOTab({ pages }: any) {
  const duplicates = useMemo(() => {
    return detectDuplicateMetadata(pages);
  }, [pages]);

  const hasDuplicates = duplicates.hasDuplicates;

  return (
    <div className="space-y-6">
      {/* Duplicate Detection Warning */}
      {hasDuplicates && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <span>⚠️</span> Duplicate metadata detected
          </h3>
          <p className="text-slate-300 mb-4">
            Multiple pages share identical metadata. This confuses search engines and makes it harder for Google to rank your pages correctly.
          </p>
          
          <div className="space-y-4">
            {duplicates.duplicateTitles.size > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm font-semibold text-amber-400 mb-2">
                  🔖 Duplicate Page Titles ({duplicates.duplicateTitles.size})
                </div>
                {Array.from(duplicates.duplicateTitles.entries()).map(([title, urls], idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <div className="text-sm text-slate-300 mb-1">"{title}"</div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {urls.map((url: string, pidx: number) => (
                        <div key={pidx}>→ {url}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {duplicates.duplicateDescriptions.size > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm font-semibold text-amber-400 mb-2">
                  📝 Duplicate Meta Descriptions ({duplicates.duplicateDescriptions.size})
                </div>
                {Array.from(duplicates.duplicateDescriptions.entries()).map(([desc, urls], idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <div className="text-sm text-slate-300 mb-1">"{desc}"</div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {urls.map((url: string, pidx: number) => (
                        <div key={pidx}>→ {url}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {duplicates.duplicateH1s.size > 0 && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm font-semibold text-amber-400 mb-2">
                  📌 Duplicate H1 Headings ({duplicates.duplicateH1s.size})
                </div>
                {Array.from(duplicates.duplicateH1s.entries()).map(([h1, urls], idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <div className="text-sm text-slate-300 mb-1">"{h1}"</div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {urls.map((url: string, pidx: number) => (
                        <div key={pidx}>→ {url}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata Table */}
      <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200">Page Metadata</h3>
          <p className="text-sm text-slate-400 mt-1">
            Search engines use this to understand and rank your pages
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Page</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Title</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">H1</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Canonical</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page: any, idx: number) => {
                const seo = page.seo || page.seoData || {};
                const pageUrl = page.url || page.normalizedUrl;
                
                // Check if this page's metadata appears in duplicates
                const isDuplicateTitle = seo.title && duplicates.duplicateTitles.has(seo.title);
                const isDuplicateDesc = seo.metaDescription && duplicates.duplicateDescriptions.has(seo.metaDescription);
                const isDuplicateH1 = seo.h1 && duplicates.duplicateH1s.has(seo.h1);
                
                return (
                  <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-emerald-400 font-mono text-xs max-w-xs truncate">
                      {page.url || page.normalizedUrl}
                    </td>
                    <td className="py-3 px-4">
                      {seo.title ? (
                        <div className="flex items-center gap-2">
                          <span className={seo.titleLength >= 30 && seo.titleLength <= 60 ? 'text-emerald-400' : 'text-amber-400'}>
                            ✓
                          </span>
                          <span className="text-xs text-slate-400">({seo.titleLength || seo.title.length})</span>
                          {isDuplicateTitle && <span className="text-amber-400 text-xs">⚠️ dup</span>}
                        </div>
                      ) : (
                        <span className="text-red-400">✗ Missing</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {seo.metaDescription ? (
                        <div className="flex items-center gap-2">
                          <span className={seo.metaDescriptionLength >= 120 && seo.metaDescriptionLength <= 160 ? 'text-emerald-400' : 'text-amber-400'}>
                            ✓
                          </span>
                          <span className="text-xs text-slate-400">({seo.metaDescriptionLength || seo.metaDescription.length})</span>
                          {isDuplicateDesc && <span className="text-amber-400 text-xs">⚠️ dup</span>}
                        </div>
                      ) : (
                        <span className="text-red-400">✗ Missing</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {seo.h1 || seo.h1Texts?.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">✓ {seo.h1Texts?.length || 1}</span>
                          {isDuplicateH1 && <span className="text-amber-400 text-xs">⚠️ dup</span>}
                        </div>
                      ) : (
                        <span className="text-red-400">✗ Missing</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {seo.canonicalUrl ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-amber-400">⚠ Missing</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// SOCIAL TAB
function SocialTab({ pages }: any) {
  return (
    <div className="space-y-6">
      {/* Explanation Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>◈</span> WHY_SOCIAL_TAGS_MATTER
        </h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            <strong className="text-blue-400">Open Graph (OG) tags</strong> control how your links appear when shared on Facebook, LinkedIn, Slack, Discord, and 100+ other platforms.
          </p>
          <p>
            <strong className="text-blue-400">Twitter Card tags</strong> optimize your links for Twitter/X sharing, enabling rich media previews with images and descriptions.
          </p>
          <p className="text-slate-400 text-xs mt-3">
            → Missing tags = ugly plain text links = lower click-through rates = less traffic<br/>
            → Proper tags = professional preview cards = higher engagement = more conversions
          </p>
        </div>
      </div>

      {pages.map((page: any, idx: number) => {
        const seo = page.seo || page.seoData || {};
        return (
          <div key={idx} className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
            <div className="text-xs text-slate-500 uppercase mb-2">PAGE:</div>
            <div className="text-sm text-cyan-400 font-mono mb-4 truncate">{page.url || page.normalizedUrl}</div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Open Graph Preview */}
              <div>
                <div className="text-xs text-slate-400 uppercase mb-2 flex items-center gap-2">
                  <span>♦</span> OPEN_GRAPH_PREVIEW
                </div>
                <div className="bg-[#0f1419] border border-[#1e293b] rounded overflow-hidden">
                  {seo.ogImageUrl && (
                    <div className="h-40 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      [OG_IMAGE: {seo.ogImageUrl}]
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm font-semibold text-slate-200 mb-1">
                      {seo.ogTitleText || seo.title || '(No OG Title)'}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {seo.ogDescriptionText || seo.metaDescription || '(No OG Description)'}
                    </div>
                    <div className="text-xs text-slate-600 font-mono truncate">
                      {page.url || page.normalizedUrl}
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">og:title</span>
                    <span className={seo.ogTitleText ? 'text-green-400' : 'text-red-400'}>
                      {seo.ogTitleText ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">og:description</span>
                    <span className={seo.ogDescriptionText ? 'text-green-400' : 'text-red-400'}>
                      {seo.ogDescriptionText ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">og:image</span>
                    <span className={seo.ogImageUrl ? 'text-green-400' : 'text-red-400'}>
                      {seo.ogImageUrl ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Twitter Card Preview */}
              <div>
                <div className="text-xs text-slate-400 uppercase mb-2 flex items-center gap-2">
                  <span>♦</span> TWITTER_CARD_PREVIEW
                </div>
                <div className="bg-[#0f1419] border border-[#1e293b] rounded overflow-hidden">
                  {seo.ogImageUrl && (
                    <div className="h-40 bg-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      [TWITTER_IMAGE]
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm font-semibold text-slate-200 mb-1">
                      {seo.ogTitleText || seo.title || '(No Title)'}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {seo.ogDescriptionText || seo.metaDescription || '(No Description)'}
                    </div>
                    <div className="text-xs text-slate-600 font-mono truncate">
                      {page.url || page.normalizedUrl}
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">twitter:card</span>
                    <span className={seo.twitterCardType ? 'text-green-400' : 'text-yellow-400'}>
                      {seo.twitterCardType || 'summary'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// FORMS TAB
function FormsTab({ forms }: any) {
  if (!forms || forms.length === 0) {
    return (
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6 text-center">
        <div className="text-slate-500 text-sm">No forms detected on scanned pages.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="text-xs text-yellow-400 uppercase font-semibold mb-1">⚠ NOTICE</div>
        <div className="text-sm text-yellow-300">
          Forms were detected but not submitted. Manual testing recommended for full validation.
        </div>
      </div>

      {forms.map((form: any, idx: number) => (
        <div key={idx} className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase mb-1">FORM #{idx + 1}</div>
              <div className="text-sm text-cyan-400 font-mono mb-2">{form.pageUrl}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">METHOD</div>
              <div className="text-sm font-semibold text-slate-300">{form.method || 'GET'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">ACTION</div>
              <div className="text-sm text-slate-300">
                {form.hasAction ? (
                  <span className="text-green-400">✓ {form.action}</span>
                ) : (
                  <span className="text-red-400">✗ MISSING</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">INPUTS</div>
              <div className="text-sm text-slate-300">{form.inputCount || 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">LABELS</div>
              <div className="text-sm text-slate-300">
                {form.missingLabelCount > 0 ? (
                  <span className="text-yellow-400">⚠ {form.missingLabelCount} missing</span>
                ) : (
                  <span className="text-green-400">✓ All labeled</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">SUBMIT</div>
              <div className="text-sm text-slate-300">
                {form.submitButtonText || 'Button found'}
              </div>
            </div>
          </div>

          {form.missingLabelCount > 0 && (
            <div className="border-t border-[#1e293b] pt-4">
              <div className="text-xs text-yellow-400">
                ⚠ Accessibility Issue: {form.missingLabelCount} input(s) missing labels
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// CONSOLE TAB
function ConsoleTab({ browserChecks, consoleEvents }: any) {
  const status = browserChecks?.status || 'skipped';

  if (status === 'skipped') {
    return (
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-lg font-semibold text-slate-300 mb-2">BROWSER_CHECKS_SKIPPED</div>
          <div className="text-sm text-slate-400 max-w-md mx-auto">
            HTML-based checks were completed successfully. Browser console checks (JavaScript errors, network failures) 
            are available in advanced scan mode.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>▶</span> CONSOLE_EVENTS
        </h2>
        {consoleEvents && consoleEvents.length > 0 ? (
          <div className="space-y-2">
            {consoleEvents.map((event: any, idx: number) => (
              <div key={idx} className="bg-[#0f1419] border border-[#1e293b] rounded p-4 font-mono text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded font-bold uppercase ${
                    event.eventType === 'error' ? 'bg-red-500/20 text-red-400' : 
                    event.eventType === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {event.eventType}
                  </span>
                  <span className="text-slate-500">{event.pageUrl}</span>
                </div>
                <div className="text-slate-300">{event.message}</div>
                {event.source && (
                  <div className="text-slate-500 text-[10px] mt-1">
                    {event.source}:{event.lineNumber}:{event.columnNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-sm text-center py-4">
            No console errors detected
          </div>
        )}
      </div>
    </div>
  );
}

// PASSED TAB
function PassedTab({ scan, result }: any) {
  const resultData = result as any;
  const pagesData = resultData?.pages || scan?.pages || [];
  
  const checks = [];

  if (scan.pages_count > 0) {
    checks.push({ label: 'Homepage is accessible', passed: true });
  }
  if (pagesData.some((p: any) => (p.url || p.normalizedUrl || '').startsWith('https://'))) {
    checks.push({ label: 'HTTPS protocol detected', passed: true });
  }
  if (scan.broken_internal_links_count === 0) {
    checks.push({ label: 'No broken internal links', passed: true });
  }
  if (scan.critical_issues_count === 0) {
    checks.push({ label: 'No critical launch blockers', passed: true });
  }
  if (resultData?.robotsData?.found) {
    checks.push({ label: 'robots.txt file found', passed: true });
  }
  if (resultData?.sitemapData?.found) {
    checks.push({ label: 'Sitemap found', passed: true });
  }
  if (pagesData.every((p: any) => {
    const seo = p.seo || p.seoData || {};
    return seo.title;
  })) {
    checks.push({ label: 'All pages have titles', passed: true });
  }
  if (pagesData.every((p: any) => {
    const seo = p.seo || p.seoData || {};
    return seo.h1 || seo.h1Texts?.length > 0;
  })) {
    checks.push({ label: 'All pages have H1 headings', passed: true });
  }

  return (
    <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
      <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>✓</span> PASSED_VALIDATIONS
      </h2>
      <div className="space-y-2">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-slate-300">{check.label}</span>
          </div>
        ))}
        {checks.length === 0 && (
          <div className="text-slate-500 text-sm text-center py-4">
            No passing checks detected
          </div>
        )}
      </div>
    </div>
  );
}

// FIX PLAN TAB
function FixPlanTab({ issues, grouped }: any) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  // Convert issues to action cards
  const actionCards = useMemo(() => {
    return groupIssuesIntoActions(issues || []);
  }, [issues]);

  const handleCopyAIPrompt = () => {
    const prompt = generateAIFixPrompt(
      actionCards,
      (issues[0]?.pageUrl || '').split('/')[2] || 'your-site.com',
      'Fix Before Sharing'
    );
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Fix Before Shipping</h2>
            <p className="text-slate-400">
              These issues should be addressed before you share your link publicly. 
              They're grouped by action to make fixing easier.
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-amber-400">{actionCards.length}</div>
            <div className="text-xs text-slate-500 uppercase">Action Items</div>
          </div>
        </div>

        {/* Copy AI Fix Prompt Button */}
        <button
          onClick={handleCopyAIPrompt}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
        >
          {copiedPrompt ? (
            <>
              <span>✓</span>
              <span>Copied AI Fix Prompt!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copy AI Fix Prompt (for Cursor/Lovable/Bolt)</span>
            </>
          )}
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Paste this prompt into your AI coding tool to fix these issues automatically
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        {actionCards.length === 0 ? (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-green-400 mb-2">No critical issues found!</h3>
            <p className="text-slate-400">Your site passed the key launch checks.</p>
          </div>
        ) : (
          actionCards.map((action: any, index: number) => (
            <ActionCard key={action.id} action={action} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

// COVERAGE TAB
function CoverageTab({ scan }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>◎</span> SCAN_COVERAGE
        </h2>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">SCAN_DEPTH</div>
            <div className="text-lg font-semibold text-slate-300">
              {scan.scan_depth === 'quick' ? 'QUICK_SCAN (Homepage Only)' : 'STANDARD_SCAN (Up to 25 Pages)'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">PAGES_DISCOVERED</div>
            <div className="text-lg font-semibold text-slate-300">{scan.discovered_pages_count}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">PAGES_SCANNED</div>
            <div className="text-lg font-semibold text-slate-300">{scan.pages_count}</div>
          </div>
          {scan.skipped_pages_count > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">PAGES_SKIPPED</div>
              <div className="text-lg font-semibold text-yellow-400">{scan.skipped_pages_count}</div>
              <div className="text-xs text-slate-500 mt-1">
                (Exceeded scan depth limit)
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>◎</span> WHAT_WE_CHECKED
        </h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>HTTP status codes and page accessibility</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>SEO metadata (titles, descriptions, headings)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Internal and external link validation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Social media tags (Open Graph, Twitter Cards)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Form structure and accessibility</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>robots.txt and sitemap.xml presence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Mobile viewport configuration</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
        <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>⚠</span> CURRENT_LIMITATIONS
        </h2>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">•</span>
            <div>
              <strong className="text-yellow-400">JavaScript-rendered content may not be fully analyzed</strong>
              <p className="text-slate-400 text-xs mt-1">
                React/Vue/Angular apps that render content client-side won't be captured by this static HTML scanner.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">•</span>
            <div>
              <strong className="text-yellow-400">Forms are detected but not submitted</strong>
              <p className="text-slate-400 text-xs mt-1">
                Manual testing recommended for contact forms, checkout flows, and user registration.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">•</span>
            <div>
              <strong className="text-yellow-400">External links checked via HEAD request only</strong>
              <p className="text-slate-400 text-xs mt-1">
                Some servers block HEAD requests - manual verification may be needed for false positives.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">•</span>
            <div>
              <strong className="text-yellow-400">Pages behind authentication cannot be scanned</strong>
              <p className="text-slate-400 text-xs mt-1">
                Login walls, password-protected pages, and member areas require authenticated scanning.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">•</span>
            <div>
              <strong className="text-yellow-400">Browser console checks require advanced scan mode</strong>
              <p className="text-slate-400 text-xs mt-1">
                JavaScript errors, network failures, and performance metrics need real browser execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>▶</span> ROADMAP_TO_ELIMINATE_LIMITATIONS
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-blue-400">Phase 1: Browser Automation</h3>
              <span className="text-xs text-slate-500 uppercase bg-red-500/20 px-2 py-0.5 rounded">Priority: High</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Integrate Puppeteer/Playwright to execute JavaScript and capture fully-rendered content
            </p>
            <ul className="space-y-1 text-xs text-slate-400 ml-4">
              <li>• Capture console errors and warnings</li>
              <li>• Analyze performance metrics (Core Web Vitals)</li>
              <li>• Screenshot generation for visual regression</li>
              <li>• Test single-page application (SPA) routing</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-blue-400">Phase 2: Authenticated Scanning</h3>
              <span className="text-xs text-slate-500 uppercase bg-red-500/20 px-2 py-0.5 rounded">Priority: High</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Support cookie injection and login flows to scan protected pages
            </p>
            <ul className="space-y-1 text-xs text-slate-400 ml-4">
              <li>• Cookie-based authentication</li>
              <li>• Username/password login automation</li>
              <li>• OAuth token support</li>
              <li>• Session persistence across pages</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-blue-400">Phase 3: Form Testing Automation</h3>
              <span className="text-xs text-slate-500 uppercase bg-yellow-500/20 px-2 py-0.5 rounded">Priority: Medium</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Automated form submission with test data and validation checks
            </p>
            <ul className="space-y-1 text-xs text-slate-400 ml-4">
              <li>• Auto-fill forms with test data</li>
              <li>• Validate error messages</li>
              <li>• Test CAPTCHA detection</li>
              <li>• Check email delivery (for contact forms)</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-blue-400">Phase 4: External Link Deep Validation</h3>
              <span className="text-xs text-slate-500 uppercase bg-yellow-500/20 px-2 py-0.5 rounded">Priority: Medium</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Full GET requests with retry logic and intelligent fallbacks
            </p>
            <ul className="space-y-1 text-xs text-slate-400 ml-4">
              <li>• Retry failed HEAD requests with GET</li>
              <li>• User-agent rotation for blocked servers</li>
              <li>• Detect soft 404s (200 status but error page)</li>
              <li>• Track link rot over time</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-blue-400">Phase 5: AI-Powered Analysis</h3>
              <span className="text-xs text-slate-500 uppercase bg-blue-500/20 px-2 py-0.5 rounded">Priority: Low</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Machine learning for content quality, UX issues, and conversion optimization
            </p>
            <ul className="space-y-1 text-xs text-slate-400 ml-4">
              <li>• Readability scoring (Flesch-Kincaid)</li>
              <li>• Sentiment analysis for messaging</li>
              <li>• CTA button placement optimization</li>
              <li>• Accessibility beyond WCAG basics</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
        <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>→</span> NEXT_STEPS_TO_IMPLEMENT
        </h2>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <span className="text-green-400 font-bold">1.</span>
            <div className="w-full">
              <strong className="text-green-400">Install Puppeteer</strong>
              <pre className="bg-[#0a0e1a] border border-slate-700 rounded px-3 py-2 mt-2 text-xs text-cyan-400 font-mono overflow-x-auto">npm install puppeteer</pre>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 font-bold">2.</span>
            <div className="w-full">
              <strong className="text-green-400">Create Browser Scanner Module</strong>
              <pre className="bg-[#0a0e1a] border border-slate-700 rounded px-3 py-2 mt-2 text-xs text-cyan-400 font-mono overflow-x-auto break-all">{`// lib/scanner/browserScanner.ts
import puppeteer from 'puppeteer';

export async function scanWithBrowser(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs: any[] = [];
  page.on('console', msg => consoleLogs.push({
    type: msg.type(),
    text: msg.text()
  }));
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Get fully-rendered HTML
  const html = await page.content();
  
  // Capture performance metrics
  const metrics = await page.metrics();
  
  await browser.close();
  
  return { html, consoleLogs, metrics };
}`}</pre>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 font-bold">3.</span>
            <div>
              <strong className="text-green-400">Add Scan Mode Toggle</strong>
              <p className="text-slate-400 text-xs mt-1">
                Let users choose between "Quick Scan" (current) and "Deep Scan" (browser-based)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-400 font-bold">4.</span>
            <div className="w-full">
              <strong className="text-green-400">Update Scanner Logic</strong>
              <pre className="bg-[#0a0e1a] border border-slate-700 rounded px-3 py-2 mt-2 text-xs text-cyan-400 font-mono overflow-x-auto break-all">{`// In runScan():
if (scanMode === 'deep') {
  const browserData = await scanWithBrowser(url);
  html = browserData.html; // Use rendered HTML
  consoleEvents = browserData.consoleLogs;
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ label, value, alert }: any) {
  return (
    <div className={`telemetry-cell p-4 ${alert ? 'border-red-500/30' : 'border-white/10'}`}>
      <div className="text-xs text-tertiary font-mono uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-3xl font-bold font-mono ${alert ? 'text-red-400' : 'text-emerald-400'}`}>
        {value}
      </div>
    </div>
  );
}

function ScoreItem({ label, value, color, bold }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-slate-400 text-sm ${bold ? 'font-bold' : ''}`}>{label}</span>
      <span className={`text-lg ${bold ? 'font-bold' : ''}`} style={{ color }}>
        {value > 0 && '+'}
        {value}
      </span>
    </div>
  );
}

// MODALS
function IssueDetailModal({ issue, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1419] border border-cyan-500/50 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl shadow-cyan-500/20" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0f1419] border-b border-[#1e293b] p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-wide">
            ISSUE_DETAILS
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">SEVERITY</div>
            <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${
              issue.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
            }`}>
              {issue.severity}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">ISSUE_TYPE</div>
            <div className="text-lg font-semibold text-slate-200">{issue.issueCode || issue.type}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">AFFECTED_PAGE</div>
            <div className="text-sm text-cyan-400 font-mono break-all">{issue.affectedUrl || issue.url}</div>
          </div>
          {issue.whatChecked && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">WHAT_WE_CHECKED</div>
              <div className="text-sm text-slate-300">{issue.whatChecked}</div>
            </div>
          )}
          {issue.whatFound && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">WHAT_WE_FOUND</div>
              <div className="text-sm text-slate-300">{issue.whatFound}</div>
            </div>
          )}
          {issue.whyItMatters && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">WHY_IT_MATTERS</div>
              <div className="text-sm text-slate-300">{issue.whyItMatters}</div>
            </div>
          )}
          {issue.businessImpact && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">BUSINESS_IMPACT</div>
              <div className="text-sm text-yellow-300">{issue.businessImpact}</div>
            </div>
          )}
          {issue.developerFix && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">HOW_TO_FIX</div>
              <div className="text-sm text-cyan-400 font-mono">{issue.developerFix}</div>
            </div>
          )}
          {issue.sampleFix && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">SAMPLE_FIX</div>
              <div className="text-sm text-slate-300 bg-[#151b2b] border border-[#1e293b] rounded p-3 font-mono">
                {issue.sampleFix}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {issue.priority && (
              <div>
                <div className="text-xs text-slate-500 uppercase mb-2">PRIORITY</div>
                <div className="text-lg font-semibold text-cyan-400">{issue.priority}</div>
              </div>
            )}
            {issue.estimatedFixTime && (
              <div>
                <div className="text-xs text-slate-500 uppercase mb-2">EST_FIX_TIME</div>
                <div className="text-lg font-semibold text-slate-300">{issue.estimatedFixTime}</div>
              </div>
            )}
            {issue.ownerRole && (
              <div>
                <div className="text-xs text-slate-500 uppercase mb-2">OWNER_ROLE</div>
                <div className="text-lg font-semibold text-slate-300">{issue.ownerRole}</div>
              </div>
            )}
            {issue.launchBlocker !== undefined && (
              <div>
                <div className="text-xs text-slate-500 uppercase mb-2">LAUNCH_BLOCKER</div>
                <div className={`text-lg font-semibold ${issue.launchBlocker ? 'text-red-400' : 'text-green-400'}`}>
                  {issue.launchBlocker ? 'YES' : 'NO'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageDetailModal({ page, onClose }: any) {
  const seo = page.seo || page.seoData || {};
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1419] border border-cyan-500/50 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto shadow-2xl shadow-cyan-500/20" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0f1419] border-b border-[#1e293b] p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-wide">
            PAGE_DETAILS
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-6">
          {/* URL & Status */}
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">URL</div>
            <div className="text-sm text-cyan-400 font-mono break-all">{page.url || page.normalizedUrl}</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">STATUS_CODE</div>
              <div className="text-lg font-semibold text-slate-300">{page.status}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">RESPONSE_TIME</div>
              <div className="text-lg font-semibold text-slate-300">{page.responseTimeMs || page.response_time_ms}ms</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">CONTENT_TYPE</div>
              <div className="text-sm font-semibold text-slate-300">{page.contentType || 'text/html'}</div>
            </div>
          </div>

          {/* SEO Metadata */}
          <div className="border-t border-[#1e293b] pt-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3">SEO_METADATA</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 uppercase mb-1">TITLE</div>
                <div className="text-sm text-slate-300">{seo.title || '(missing)'}</div>
                {seo.titleLength && (
                  <div className="text-xs text-slate-500 mt-1">Length: {seo.titleLength} chars</div>
                )}
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase mb-1">META_DESCRIPTION</div>
                <div className="text-sm text-slate-300">{seo.metaDescription || '(missing)'}</div>
                {seo.metaDescriptionLength && (
                  <div className="text-xs text-slate-500 mt-1">Length: {seo.metaDescriptionLength} chars</div>
                )}
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase mb-1">H1_HEADINGS</div>
                {seo.h1Texts && seo.h1Texts.length > 0 ? (
                  <ul className="text-sm text-slate-300 space-y-1">
                    {seo.h1Texts.map((h1: string, idx: number) => (
                      <li key={idx}>• {h1}</li>
                    ))}
                  </ul>
                ) : seo.h1 ? (
                  <div className="text-sm text-slate-300">{seo.h1}</div>
                ) : (
                  <div className="text-sm text-red-400">(missing)</div>
                )}
              </div>
              {seo.canonicalUrl && (
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">CANONICAL_URL</div>
                  <div className="text-sm text-slate-300 font-mono break-all">{seo.canonicalUrl}</div>
                </div>
              )}
            </div>
          </div>

          {/* Open Graph */}
          {(seo.ogTitleText || seo.ogDescriptionText || seo.ogImageUrl) && (
            <div className="border-t border-[#1e293b] pt-4">
              <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3">OPEN_GRAPH</h3>
              <div className="space-y-2 text-sm">
                {seo.ogTitleText && (
                  <div>
                    <span className="text-slate-500">og:title:</span> <span className="text-slate-300">{seo.ogTitleText}</span>
                  </div>
                )}
                {seo.ogDescriptionText && (
                  <div>
                    <span className="text-slate-500">og:description:</span> <span className="text-slate-300">{seo.ogDescriptionText}</span>
                  </div>
                )}
                {seo.ogImageUrl && (
                  <div>
                    <span className="text-slate-500">og:image:</span> <span className="text-cyan-400 font-mono">{seo.ogImageUrl}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="border-t border-[#1e293b] pt-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase mb-3">PAGE_STATS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">IMAGES</div>
                <div className="text-slate-300">{seo.imageCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">INTERNAL_LINKS</div>
                <div className="text-slate-300">{page.internalLinksCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">EXTERNAL_LINKS</div>
                <div className="text-slate-300">{page.externalLinksCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">FORMS</div>
                <div className="text-slate-300">{page.formCount || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
