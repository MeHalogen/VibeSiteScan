'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

interface ReportPageProps {
  scan: ScanData;
  result: ScanResult;
}

type TabType = 'overview' | 'crawl-map' | 'pages' | 'links' | 'issues' | 'seo' | 'social' | 'forms' | 'console' | 'passed' | 'fix-plan' | 'coverage';

export default function EnhancedReportPage({ scan, result }: ReportPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'crawl-map', label: 'Crawl Map', count: scan.pages_count },
    { id: 'pages', label: 'Pages', count: result.pages.length },
    { id: 'links', label: 'Links', count: result.linkResults.length },
    { id: 'issues', label: 'Issues', count: scan.issues_count },
    { id: 'seo', label: 'SEO' },
    { id: 'social', label: 'Social' },
    { id: 'forms', label: 'Forms', count: scan.forms_found_count },
    { id: 'console', label: 'Console', count: scan.console_errors_count },
    { id: 'passed', label: 'Passed' },
    { id: 'fix-plan', label: 'Fix Plan' },
    { id: 'coverage', label: 'Coverage' },
  ];

  const scoreColor = scan.launch_score >= 80 ? 'text-green-600' : scan.launch_score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = scan.launch_score >= 80 ? 'bg-green-50 dark:bg-green-900/20' : scan.launch_score >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className="launch-console scanline-overlay min-h-screen">
      {/* Header */}
      <header className="intel-panel-dark border-b border-subtle sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard/new-scan" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-mono">L</span>
              </div>
              <span className="text-xl font-bold font-mono text-primary">VibeSiteScan</span>
            </Link>
            <Link
              href="/dashboard/new-scan"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-mono"
            >
              NEW SCAN
            </Link>
          </div>

          {/* Report Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="classified-stamp mb-2">LAUNCH REPORT</div>
              <h1 className="text-2xl font-bold mb-1 text-primary font-mono break-all">{scan.target_url}</h1>
              <div className="flex items-center gap-4 text-sm text-secondary font-mono">
                <span>Scanned {new Date(scan.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{scan.scan_depth === 'quick' ? 'Quick Scan' : 'Standard Scan'}</span>
                <span>•</span>
                <span>{(scan.duration_ms / 1000).toFixed(1)}s</span>
              </div>
            </div>
            <div className="intel-panel-dark rounded-lg px-6 py-4 telemetry-cell">
              <div className={`text-4xl font-bold font-mono ${scoreColor}`}>{scan.launch_score}</div>
              <div className="text-sm text-tertiary font-mono uppercase tracking-wider">Launch Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors font-mono ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs intel-panel-dark rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab scan={scan} result={result} />}
        {activeTab === 'crawl-map' && <CrawlMapTab scan={scan} result={result} />}
        {activeTab === 'pages' && <PagesTab scan={scan} result={result} />}
        {activeTab === 'links' && <LinksTab scan={scan} result={result} />}
        {activeTab === 'issues' && <IssuesTab scan={scan} result={result} />}
        {activeTab === 'seo' && <SEOTab scan={scan} result={result} />}
        {activeTab === 'social' && <SocialTab scan={scan} result={result} />}
        {activeTab === 'forms' && <FormsTab scan={scan} result={result} />}
        {activeTab === 'console' && <ConsoleTab scan={scan} result={result} />}
        {activeTab === 'passed' && <PassedTab scan={scan} result={result} />}
        {activeTab === 'fix-plan' && <FixPlanTab scan={scan} result={result} />}
        {activeTab === 'coverage' && <CoverageTab scan={scan} result={result} />}
      </main>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ scan, result }: ReportPageProps) {
  const criticalIssues = result.issues.filter((i: any) => i.severity === 'critical');
  const warningIssues = result.issues.filter((i: any) => i.severity === 'warning');
  
  // Generate executive summary
  const getReadinessStatus = () => {
    if (scan.critical_issues_count === 0 && scan.warning_issues_count < 5) {
      return { status: 'READY', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    } else if (scan.critical_issues_count === 0) {
      return { status: 'NEEDS FIXES', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    } else {
      return { status: 'NOT READY', color: 'text-red-400', bg: 'bg-red-500/10' };
    }
  };

  const readiness = getReadinessStatus();

  const generateSummary = () => {
    if (scan.critical_issues_count === 0 && scan.warning_issues_count === 0) {
      return `Perfect! VibeSiteScan scanned ${scan.pages_count} page${scan.pages_count > 1 ? 's' : ''} and found no issues. Your site is ready to launch!`;
    } else if (scan.critical_issues_count === 0) {
      return `VibeSiteScan scanned ${scan.pages_count} page${scan.pages_count > 1 ? 's' : ''} and found ${scan.warning_issues_count} warning${scan.warning_issues_count > 1 ? 's' : ''}. No critical launch blockers were found, so the site appears accessible. Most issues are related to ${getMostCommonCategory()}. Fixing these will improve ${getImpactDescription()} before launch.`;
    } else {
      return `VibeSiteScan scanned ${scan.pages_count} page${scan.pages_count > 1 ? 's' : ''} and found ${scan.critical_issues_count} critical issue${scan.critical_issues_count > 1 ? 's' : ''} and ${scan.warning_issues_count} warning${scan.warning_issues_count > 1 ? 's' : ''}. Critical issues must be fixed before launch to ensure site accessibility and functionality.`;
    }
  };

  const getMostCommonCategory = () => {
    const categories: Record<string, number> = {};
    result.issues.forEach((issue: any) => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'general';
  };

  const getImpactDescription = () => {
    const category = getMostCommonCategory();
    const impacts: Record<string, string> = {
      social: 'social sharing and link previews',
      seo: 'search engine rankings and discoverability',
      links: 'navigation and user experience',
      accessibility: 'accessibility for all users',
      mobile: 'mobile responsiveness',
      forms: 'form functionality and usability',
    };
    return impacts[category] || 'overall site quality';
  };

  // Top 5 priority issues
  const topIssues = [...result.issues]
    .sort((a: any, b: any) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.severity === 'critical' ? -1 : 1;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="intel-panel-dark rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">EXECUTIVE SUMMARY</h2>
        
        <div className={`inline-flex px-4 py-2 rounded-lg ${readiness.bg} mb-4 border border-current`}>
          <span className={`font-semibold font-mono ${readiness.color}`}>
            LAUNCH READINESS: {readiness.status}
          </span>
        </div>

        <p className="text-secondary leading-relaxed">
          {generateSummary()}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Pages Scanned" value={scan.pages_count} />
        <MetricCard label="Links Checked" value={scan.internal_links_count + scan.external_links_count} />
        <MetricCard label="Forms Found" value={scan.forms_found_count} />
        <MetricCard label="Duration" value={`${(scan.duration_ms / 1000).toFixed(1)}s`} />
        
        <MetricCard 
          label="Critical Issues" 
          value={scan.critical_issues_count} 
          alert={scan.critical_issues_count > 0}
        />
        <MetricCard 
          label="Warnings" 
          value={scan.warning_issues_count} 
          warning={scan.warning_issues_count > 0}
        />
        <MetricCard 
          label="Broken Links" 
          value={scan.broken_internal_links_count} 
          alert={scan.broken_internal_links_count > 0}
        />
        <MetricCard 
          label="Redirects" 
          value={scan.redirects_count}
        />
      </div>

      {/* Score Breakdown */}
      <div className="intel-panel-dark rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">SCORE BREAKDOWN</h2>
        <div className="space-y-3">
          <ScoreItem 
            label="Starting Score" 
            value={100}
            color="text-secondary"
          />
          <ScoreItem 
            label={`Critical Issues (${scan.critical_issues_count} × 15 points)`}
            value={-scan.critical_issues_count * 15}
            color="text-red-400"
          />
          <ScoreItem 
            label={`Warnings (${scan.warning_issues_count} × 4 points)`}
            value={-Math.min(scan.warning_issues_count * 4, 36)}
            color="text-amber-400"
          />
          <div className="border-t border-subtle pt-3 mt-3">
            <ScoreItem 
              label="Final Launch Score" 
              value={scan.launch_score}
              color={scan.launch_score >= 80 ? 'text-emerald-400' : scan.launch_score >= 60 ? 'text-amber-400' : 'text-red-400'}
              bold
            />
          </div>
        </div>
      </div>

      {/* Top Priority Issues */}
      {topIssues.length > 0 && (
        <div className="intel-panel-dark rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">TOP 5 PRIORITY FIXES</h2>
          <div className="space-y-3">
            {topIssues.map((issue: any, index: number) => (
              <div key={index} className="p-4 telemetry-cell rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-1 text-xs font-medium rounded font-mono ${
                    issue.severity === 'critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {issue.severity.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary">{issue.title}</h3>
                    <p className="text-sm text-secondary mt-1">
                      {issue.businessImpact}
                    </p>
                    <p className="text-sm text-emerald-400 mt-2 font-mono">
                      <span className="font-medium">Quick Fix:</span> {issue.developerFix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, alert, warning }: { label: string; value: string | number; alert?: boolean; warning?: boolean }) {
  const colorClass = alert ? 'text-red-400' : warning ? 'text-amber-400' : 'text-primary';
  const bgClass = alert ? 'bg-red-500/10 border-red-500/30' : warning ? 'bg-amber-500/10 border-amber-500/30' : 'intel-panel-dark';
  
  return (
    <div className={`${bgClass} rounded-xl p-4 border telemetry-cell`}>
      <div className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</div>
      <div className="text-sm text-tertiary font-mono uppercase tracking-wider">{label}</div>
    </div>
  );
}

// Score Item Component
function ScoreItem({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center font-mono">
      <span className={bold ? 'font-semibold text-primary' : 'text-secondary'}>{label}</span>
      <span className={`${color} ${bold ? 'font-bold text-lg' : ''}`}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  );
}

// Placeholder components for other tabs (to be implemented)
function CrawlMapTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">CRAWL MAP</h2>
    <p className="text-secondary">Detailed page discovery visualization coming soon...</p>
  </div>;
}

function PagesTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">PAGES</h2>
    <p className="text-secondary">{result.pages.length} pages scanned...</p>
  </div>;
}

function LinksTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">LINKS</h2>
    <p className="text-secondary">{result.linkResults.length} links analyzed...</p>
  </div>;
}

function IssuesTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">ISSUES</h2>
    <p className="text-secondary">{result.issues.length} issues found...</p>
  </div>;
}

function SEOTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">SEO ANALYSIS</h2>
    <p className="text-secondary">SEO metadata details...</p>
  </div>;
}

function SocialTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">SOCIAL MEDIA PREVIEW</h2>
    <p className="text-secondary">Open Graph and Twitter card analysis...</p>
  </div>;
}

function FormsTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">FORMS</h2>
    <p className="text-secondary">{result.formChecks?.length || 0} forms detected...</p>
  </div>;
}

function ConsoleTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">CONSOLE & BROWSER CHECKS</h2>
    <p className="text-secondary">Browser checks status: {scan.browser_checks_status}</p>
  </div>;
}

function PassedTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">PASSED CHECKS</h2>
    <p className="text-secondary">Showing successful validations...</p>
  </div>;
}

function FixPlanTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">PRIORITIZED FIX PLAN</h2>
    <p className="text-secondary">Action items by priority...</p>
  </div>;
}

function CoverageTab({ scan, result }: ReportPageProps) {
  return <div className="intel-panel-dark rounded-xl p-6">
    <h2 className="text-xl font-bold mb-4 text-primary font-mono tracking-wide">SCAN COVERAGE</h2>
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-primary font-mono">WHAT WAS SCANNED</h3>
        <ul className="space-y-2 text-sm text-secondary font-mono">
          <li>✅ {scan.pages_count} pages analyzed</li>
          <li>✅ {scan.internal_links_count + scan.external_links_count} links checked</li>
          <li>✅ HTML structure and metadata</li>
          <li>✅ SEO tags and Open Graph</li>
          <li>✅ {scan.forms_found_count} forms detected</li>
          <li>✅ robots.txt {scan.robots_found ? 'found' : 'not found'}</li>
          <li>✅ sitemap.xml {scan.sitemap_found ? 'found' : 'not found'}</li>
        </ul>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2 text-amber-400 font-mono">LIMITATIONS</h3>
        <ul className="space-y-2 text-sm text-tertiary font-mono">
          <li>⚠️ Login-protected pages were not scanned</li>
          <li>⚠️ Form submissions were not tested</li>
          <li>⚠️ JavaScript-rendered content may be incomplete</li>
          <li>⚠️ Browser checks: {scan.browser_checks_status}</li>
          <li>⚠️ Performance scores not included (use Lighthouse separately)</li>
          <li>⚠️ Deep accessibility checks not included (use axe-core separately)</li>
        </ul>
      </div>
    </div>
  </div>;
}
