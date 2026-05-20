/**
 * Pipeline orchestration - maps scan execution to visual stages
 */

import { PipelineStage, ScanLog, StageStatus, PIPELINE_STAGES } from "./types";

export class PipelineOrchestrator {
  private stages: PipelineStage[];
  private logs: ScanLog[];
  private currentStageIndex: number = -1;

  constructor() {
    this.stages = PIPELINE_STAGES.map(stage => ({
      ...stage,
      status: "pending" as StageStatus,
    }));
    this.logs = [];
  }

  getStages(): PipelineStage[] {
    return this.stages;
  }

  getLogs(): ScanLog[] {
    return this.logs;
  }

  addLog(message: string, severity: "info" | "warning" | "error" | "success" = "info") {
    this.logs.push({
      timestamp: new Date(),
      message,
      severity,
    });
  }

  startStage(stageId: string) {
    const stage = this.stages.find(s => s.id === stageId);
    if (stage) {
      stage.status = "running";
      stage.startedAt = new Date();
      this.addLog(`${stage.label} started`, "info");
    }
  }

  completeStage(stageId: string, status: StageStatus = "completed", metrics?: Record<string, any>) {
    const stage = this.stages.find(s => s.id === stageId);
    if (stage) {
      stage.status = status;
      stage.completedAt = new Date();
      if (metrics) {
        stage.metrics = metrics;
      }
      
      if (status === "completed") {
        this.addLog(`${stage.label} completed`, "success");
      } else if (status === "warning") {
        this.addLog(`${stage.label} completed with warnings`, "warning");
      } else if (status === "failed") {
        this.addLog(`${stage.label} failed`, "error");
      } else if (status === "skipped") {
        this.addLog(`${stage.label} skipped`, "info");
      }
    }
  }

  /**
   * Run scan with stage events (real progress).
   * Stages reflect actual scan progress emitted by the API.
   */
  async runPipelineWithEvents(
    onStageUpdate: (stages: PipelineStage[], logs: ScanLog[]) => void,
    eventStream: AsyncIterable<any>
  ) {
    try {
      for await (const evt of eventStream) {
        if (!evt) continue;
        if (evt.type === "log") {
          this.addLog(evt.message || "", evt.severity || "info");
          onStageUpdate([...this.stages], [...this.logs]);
          continue;
        }
        if (evt.type === "stage_start") {
          this.startStage(evt.stageId);
          if (evt.message) this.addLog(evt.message, "info");
          onStageUpdate([...this.stages], [...this.logs]);
          continue;
        }
        if (evt.type === "stage_progress") {
          const stage = this.stages.find(s => s.id === evt.stageId);
          if (stage && evt.metrics) stage.metrics = { ...(stage.metrics || {}), ...evt.metrics };
          if (evt.message) this.addLog(evt.message, "info");
          onStageUpdate([...this.stages], [...this.logs]);
          continue;
        }
        if (evt.type === "stage_end") {
          this.completeStage(evt.stageId, evt.status || "completed", evt.metrics);
          if (evt.message) this.addLog(evt.message, evt.status === "failed" ? "error" : "success");
          onStageUpdate([...this.stages], [...this.logs]);
          continue;
        }
        if (evt.type === "result") {
          // Return scan id only; full result should be fetched by id.
          return { id: evt.scanId };
        }
      }

      throw new Error("Scan stream ended unexpectedly");
    } catch (error: any) {
      // Mark all as failed
      this.stages.forEach(stage => {
        if (stage.status === "running") {
          stage.status = "failed";
        }
      });
      this.addLog(`Scan failed: ${error.message}`, "error");
      onStageUpdate([...this.stages], [...this.logs]);
      throw error;
    }
  }

  /**
   * Map actual scan result to stage metrics
   */
  private mapResultToStages(result: any) {
    // Init
    this.completeStage("init", "completed", {
      normalizedUrl: result.target_url,
      scanMode: result.scan_depth,
      scanId: result.id,
    });

    // Fetch
    const homepage = result.pages?.find((p: any) => p.crawl_depth === 0);
    this.completeStage("fetch", "completed", {
      statusCode: homepage?.response_status || 200,
      responseTimeMs: homepage?.response_time_ms || 0,
      contentType: homepage?.content_type || "text/html",
      finalUrl: homepage?.final_url || result.target_url,
    });

    // Discover
    this.completeStage("discover", "completed", {
      discoveredPagesCount: result.discovered_pages_count || 0,
      internalLinksCount: result.internal_links_count || 0,
      externalLinksCount: result.external_links_count || 0,
      sitemapFound: result.sitemap_found || false,
      robotsFound: result.robots_found || false,
    });

    // Crawl
    this.completeStage("crawl", "completed", {
      pagesScanned: result.pages_count || 0,
      skippedPagesCount: result.skipped_pages_count || 0,
      pageLimit: result.scan_depth === "quick" ? 1 : 25,
    });

    // Links
    const brokenInternalCount = result.broken_internal_links_count || 0;
    const brokenExternalCount = result.broken_external_links_count || 0;
    const hasLinkIssues = brokenInternalCount > 0 || brokenExternalCount > 0;
    
    this.completeStage("links", hasLinkIssues ? "warning" : "completed", {
      internalLinksCount: result.internal_links_count || 0,
      externalLinksCount: result.external_links_count || 0,
      brokenInternalLinksCount: brokenInternalCount,
      brokenExternalLinksCount: brokenExternalCount,
      redirectsCount: result.redirects_count || 0,
      ignoredLinksCount: result.ignored_links_count || 0,
    });

    // SEO
    const seoIssues = result.issues?.filter((i: any) => 
      ["missing_title", "missing_meta_description", "missing_h1", "missing_canonical"].includes(i.issue_code)
    ) || [];
    this.completeStage("seo", seoIssues.length > 0 ? "warning" : "completed", {
      missingTitlesCount: seoIssues.filter((i: any) => i.issue_code === "missing_title").length,
      missingMetaDescriptionsCount: seoIssues.filter((i: any) => i.issue_code === "missing_meta_description").length,
      missingH1Count: seoIssues.filter((i: any) => i.issue_code === "missing_h1").length,
      pagesAnalyzed: result.pages_count || 0,
    });

    // Social
    const socialIssues = result.issues?.filter((i: any) => 
      i.issue_code?.includes("og_") || i.issue_code?.includes("twitter_")
    ) || [];
    this.completeStage("social", socialIssues.length > 0 ? "warning" : "completed", {
      missingOgTitleCount: socialIssues.filter((i: any) => i.issue_code === "missing_og_title").length,
      missingOgDescriptionCount: socialIssues.filter((i: any) => i.issue_code === "missing_og_description").length,
      missingOgImageCount: socialIssues.filter((i: any) => i.issue_code === "missing_og_image").length,
    });

    // Forms
    const formsCount = result.forms_found_count || 0;
    const formIssues = result.issues?.filter((i: any) => i.issue_code?.includes("form")) || [];
    this.completeStage("forms", formIssues.length > 0 ? "warning" : "completed", {
      formsFoundCount: formsCount,
      formIssuesCount: formIssues.length,
    });

    // Browser
    const browserStatus = result.browser_checks_status || "not_available";
    this.completeStage("browser", browserStatus === "not_available" ? "skipped" : "completed", {
      browserChecksStatus: browserStatus,
      consoleErrorsCount: result.console_errors_count || 0,
    });

    // Score
    this.completeStage("score", "completed", {
      launchScore: result.launch_score || 0,
      criticalCount: result.critical_count || 0,
      warningCount: result.warning_count || 0,
      passedCount: result.passed_count || 0,
    });

    // Report
    this.completeStage("report", "completed", {
      issuesCount: result.issues?.length || 0,
      groupedIssuesCount: new Set(result.issues?.map((i: any) => i.issue_code)).size || 0,
      shareTokenCreated: !!result.share_token,
    });
  }
}
