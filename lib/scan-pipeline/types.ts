/**
 * Pipeline-based scan state management types
 */

export type ScanPhase = "config" | "running" | "complete" | "error";

export type StageStatus = "pending" | "running" | "completed" | "warning" | "failed" | "skipped";

export type ScanMode = "quick" | "standard" | "deep";

export interface PipelineStage {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  status: StageStatus;
  /** Human-readable reason for the current status (e.g. why a stage was skipped or failed). */
  statusMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  metrics?: Record<string, string | number | boolean | null>;
  logs?: string[];
  icon?: string;
}

export interface ScanLog {
  timestamp: Date;
  message: string;
  severity?: "info" | "warning" | "error" | "success";
  /** Stage this log belongs to; undefined for scan-level milestones. */
  stageId?: string;
}

export interface ScanConfig {
  targetUrl: string;
  scanMode: ScanMode;
  advancedOptions?: {
    includeExternalLinks?: boolean;
    includeBrowserChecks?: boolean;
    includeSitemapDiscovery?: boolean;
    includeFormChecks?: boolean;
    includeImageAccessibility?: boolean;
  };
}

export interface ScanState {
  phase: ScanPhase;
  config: ScanConfig | null;
  stages: PipelineStage[];
  selectedStageId: string | null;
  logs: ScanLog[];
  scanId?: string;
  startedAt?: Date;
  completedAt?: Date;
  result?: any; // Full scan result from API
  error?: {
    message: string;
    failedStage?: string;
  };
}

/**
 * Pipeline stage registry — the contract between scanner and UI.
 *
 * Order matters: stages are listed in actual execution order so the
 * "running" indicator moves top-to-bottom during a scan. Every stageId
 * emitted by lib/scanner/index.ts must exist here, or the orchestrator
 * will surface a warning in the evidence stream.
 */
export const PIPELINE_STAGES: Omit<PipelineStage, "status" | "startedAt" | "completedAt" | "metrics" | "logs">[] = [
  {
    id: "init",
    label: "Target",
    shortLabel: "TARGET",
    description: "URL normalization • HTTPS check • Domain reachability • Redirect destination",
    icon: "Target",
  },
  {
    id: "score",
    label: "Indexing",
    shortLabel: "INDEXING",
    description: "Sitemap.xml • Robots.txt • Noindex status • Crawl hints • Discoverability",
    icon: "Database",
  },
  {
    id: "fetch",
    label: "Homepage",
    shortLabel: "HOMEPAGE",
    description: "Fetch homepage • Capture status • Response time • Initial content",
    icon: "Home",
  },
  {
    id: "discover",
    label: "Routes",
    shortLabel: "ROUTES",
    description: "Internal link discovery • Route mapping • Depth detection • Hash anchor classification",
    icon: "GitBranch",
  },
  {
    id: "crawl",
    label: "Page Scan",
    shortLabel: "PAGES",
    description: "Scan discovered routes • Extract content • Check accessibility • Gather evidence",
    icon: "FileSearch",
  },
  {
    id: "links",
    label: "Link Check",
    shortLabel: "LINKS",
    description: "Internal links • External links • Broken targets • Redirects • Ignored links",
    icon: "Link",
  },
  {
    id: "browser",
    label: "Browser Health",
    shortLabel: "BROWSER",
    description: "Console errors • Failed requests • Mobile viewport • Browser compatibility checks",
    icon: "Monitor",
  },
  {
    id: "seo",
    label: "Metadata",
    shortLabel: "METADATA",
    description: "Titles • Meta descriptions • H1 headings • Canonical tags • Robots meta • Duplicate detection",
    icon: "FileText",
  },
  {
    id: "social",
    label: "Share Preview",
    shortLabel: "PREVIEW",
    description: "OG:title • OG:description • OG:image • Twitter cards • Share readiness",
    icon: "Share2",
  },
  {
    id: "forms",
    label: "Form Structure",
    shortLabel: "FORMS",
    description: "Form detection • Input structure • Labels • Required fields • Action/method validation",
    icon: "ClipboardList",
  },
  {
    id: "exposure",
    label: "Route Exposure",
    shortLabel: "EXPOSURE",
    description: "Public route map • Admin/debug routes • Risk classification • Unintended exposure",
    icon: "ShieldAlert",
  },
  {
    id: "ai_leftovers",
    label: "AI Leftovers",
    shortLabel: "LEFTOVERS",
    description: "Placeholder copy • Lorem ipsum • Template artifacts • AI-generated leftovers",
    icon: "Bot",
  },
  {
    id: "keys",
    label: "Secret Scan",
    shortLabel: "SECRETS",
    description: "Exposed API keys • Firebase/Supabase config • Token patterns in page source",
    icon: "KeyRound",
  },
  {
    id: "form_analysis",
    label: "Form Safety",
    shortLabel: "FORM SAFETY",
    description: "Validation coverage • Submission wiring • Accessibility of inputs • Risky form patterns",
    icon: "ShieldCheck",
  },
  {
    id: "security",
    label: "Security Headers",
    shortLabel: "SECURITY",
    description: "CSP • HSTS • Clickjacking • Cookie flags • Mixed content • Source maps • Vulnerable libraries",
    icon: "Lock",
  },
  {
    id: "performance",
    label: "Performance",
    shortLabel: "PERFORMANCE",
    description: "TTFB • HTML weight • Compression • Caching • Render-blocking scripts • Layout shift risk",
    icon: "Gauge",
  },
  {
    id: "report",
    label: "Launch Decision",
    shortLabel: "DECISION",
    description: "Calculate readiness • Group issues • Identify blockers • Generate fix list • Final verdict",
    icon: "CheckCircle",
  },
];
