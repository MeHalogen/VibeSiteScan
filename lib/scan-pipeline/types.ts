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

export const PIPELINE_STAGES: Omit<PipelineStage, "status" | "startedAt" | "completedAt" | "metrics" | "logs">[] = [
  {
    id: "init",
    label: "Target",
    shortLabel: "TARGET",
    description: "URL normalization • HTTPS check • Domain reachability • Redirect destination",
    icon: "Target",
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
    label: "Forms",
    shortLabel: "FORMS",
    description: "Form detection • Input structure • Labels • Required fields • Action/method validation",
    icon: "ClipboardList",
  },
  {
    id: "browser",
    label: "Browser Health",
    shortLabel: "BROWSER",
    description: "Console errors • Failed requests • Mobile viewport • Browser compatibility checks",
    icon: "Monitor",
  },
  {
    id: "score",
    label: "Indexing",
    shortLabel: "INDEXING",
    description: "Sitemap.xml • Robots.txt • Noindex status • Crawl hints • Discoverability",
    icon: "Database",
  },
  {
    id: "report",
    label: "Launch Decision",
    shortLabel: "DECISION",
    description: "Calculate readiness • Group issues • Identify blockers • Generate fix list • Final verdict",
    icon: "CheckCircle",
  },
];
