"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScanConfig, ScanMode } from "@/lib/scan-pipeline/types";
import {
  Lock,
  Check,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import Link from "next/link";

interface ScanConfigPanelProps {
  onStartScan: (config: ScanConfig) => void;
}

export function ScanConfigPanel({ onStartScan }: ScanConfigPanelProps) {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("standard");
  const [urlError, setUrlError] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [includeExternalLinks, setIncludeExternalLinks] = useState(true);
  const [includeBrowserChecks, setIncludeBrowserChecks] = useState(true);
  const [includeSitemapDiscovery, setIncludeSitemapDiscovery] = useState(true);
  const [includeFormChecks, setIncludeFormChecks] = useState(true);
  const [includeImageAccessibility, setIncludeImageAccessibility] = useState(true);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      setUrlError("");
      setIsValidUrl(false);
      return;
    }
    
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      new URL(normalized);
      setUrlError("");
      setIsValidUrl(true);
    } catch {
      setUrlError("Invalid URL format");
      setIsValidUrl(false);
    }
  };

  const handleStartScan = () => {
    if (!targetUrl.trim()) {
      setUrlError("Target URL required");
      return;
    }
    
    if (urlError) return;

    onStartScan({
      targetUrl: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
      scanMode,
      advancedOptions: {
        includeExternalLinks,
        includeBrowserChecks,
        includeSitemapDiscovery,
        includeFormChecks,
        includeImageAccessibility,
      },
    });
  };

  const tierCards: Array<{
    id: ScanMode;
    title: string;
    subtitle: string;
    details: string;
    duration: string;
    badge?: "Free" | "Default" | "Pro";
    disabled?: boolean;
  }> = [
    {
      id: "quick",
      title: "Quick Pass",
      subtitle: "Homepage only",
      details: "Best for landing pages",
      duration: "5–10 sec",
      badge: "Free",
    },
    {
      id: "standard",
      title: "Launch Check",
      subtitle: "Homepage + public routes",
      details: "Best before public sharing",
      duration: "15–45 sec",
      badge: "Default",
    },
    {
      // ScanMode doesn’t currently include “deep”; keep this as coming soon UI-only.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: "standard" as any,
      title: "Release Gate",
      subtitle: "Browser checks, screenshots, deeper crawl",
      details: "Pro / Coming soon",
      duration: "1–3 min",
      badge: "Pro",
      disabled: true,
    },
  ];

  const sampleFixPrompt = `You are my launch QA assistant.

Goal: Fix launch hygiene issues on my public website before I share the link.

Tasks:
- Add a favicon (SVG + PNG) and reference it correctly in the layout/head.
- Add an Open Graph image (1200x630) and wire up og:title, og:description, og:image, twitter:card.
- Create sitemap.xml and robots.txt (allow indexing).
- Find and replace placeholder CTA links (#, empty hrefs) with real routes.

Constraints:
- Keep existing styling and layout.
- Don’t introduce breaking route changes.

Site URL: <PASTE_YOUR_URL_HERE>`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(sampleFixPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // no-op: clipboard may be blocked; still keep UI responsive
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Paper grid background */}
      <div className="pointer-events-none absolute inset-0 bg-coord-grid opacity-80" />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl relative">
        {/* Navigation */}
        <header className="flex items-center justify-between gap-4 mb-10 border-b border-[var(--ink)]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border border-[var(--ink)]/20 bg-[var(--paper)] flex items-center justify-center">
              <span className="font-semibold tracking-tight text-[var(--ink)]">L</span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-[var(--ink)]">LaunchScan</div>
              <div className="text-xs text-[var(--ink)]/55">Final QA for AI-built websites</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--ink)]/70">
            <Link href="/r/sample" className="hover:text-[var(--blood)] transition-colors">
              Sample Report
            </Link>
            <Link href="/pricing" className="hover:text-[var(--blood)] transition-colors">
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--ink)]/20 bg-[var(--paper)] hover:bg-[var(--ink)] hover:text-[var(--cream)] text-[var(--ink)] transition-colors"
            >
              Dashboard / Sign in
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="text-center mb-10 md:mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--ink)] ink-headline"
          >
            Before you share your AI-built website, check what AI missed.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.5 }}
            className="mt-5 text-base md:text-xl text-[var(--ink)]/65 max-w-4xl mx-auto"
          >
            LaunchScan catches missing share previews, metadata, broken routes, sitemap, robots.txt, forms, and launch hygiene issues in seconds.
          </motion.p>

          {/* Command bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.20, duration: 0.5 }}
            className="mt-8 max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center intel-panel p-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => {
                    setTargetUrl(e.target.value);
                    validateUrl(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStartScan()}
                  placeholder="https://your-site.com"
                  className="w-full h-12 px-4 sm:px-5 bg-[var(--cream)] border border-[var(--ink)]/15 focus:border-[var(--blood)] focus:outline-none text-[var(--ink)] placeholder:text-[var(--ink)]/35 font-mono text-sm sm:text-base"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidUrl && !urlError ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : urlError ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : null}
                </div>
              </div>

              <motion.button
                onClick={handleStartScan}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="h-12 px-5 font-semibold btn-blood inline-flex items-center justify-center gap-2"
              >
                Run free launch check
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[var(--ink)]/55">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                Public pages only
              </span>
              <span className="hidden sm:block text-[var(--ink)]/25">•</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
                No code required
              </span>
              <span className="hidden sm:block text-[var(--ink)]/25">•</span>
              <Link href="/r/sample" className="inline-flex items-center gap-1 text-[var(--ink)]/70 hover:text-[var(--ink)] transition-colors">
                View sample report <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {urlError && (
              <div className="mt-3 text-sm text-red-300/90 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {urlError}
              </div>
            )}
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {[
              "Works with Vercel",
              "Works with Netlify",
              "Works with Replit",
              "Built for Lovable/Bolt/Cursor sites",
              "Public pages only",
              "No code required",
            ].map((pill) => (
              <span
                key={pill}
                className="px-3 py-1.5 rounded-full text-xs text-[var(--ink)]/70 intel-panel border border-white/10"
              >
                {pill}
              </span>
            ))}
          </motion.div>
        </section>

        {/* Main two-column */}
        <section className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left: Launch Check Setup */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="rounded-2xl intel-panel p-6 md:p-8"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ink)]">Launch Check Setup</h2>
                <p className="mt-1 text-sm text-[var(--ink)]/60">
                  Choose how deep to scan. We’ll generate a fix prompt after the report.
                </p>
              </div>
              <span className="text-xs text-[var(--ink)]/55 intel-panel border border-white/10 px-2 py-1 rounded-full">
                Free
              </span>
            </div>

            {/* Scan mode selector */}
            <div className="grid md:grid-cols-3 gap-3">
              {tierCards.map((tier) => {
                const selected = !tier.disabled && scanMode === tier.id;
                const badge =
                  tier.badge === "Default" ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-200 border border-cyan-300/20">
                      Default
                    </span>
                  ) : tier.badge === "Free" ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-300/20">
                      Free
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-200 border border-amber-300/20 inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Pro
                    </span>
                  );

                return (
                  <motion.button
                    key={tier.title}
                    type="button"
                    onClick={() => !tier.disabled && setScanMode(tier.id)}
                    whileHover={tier.disabled ? undefined : { y: -2 }}
                    className={[
                      "text-left rounded-2xl p-4 border transition-colors",
                      tier.disabled
                        ? "bg-black/20 border-white/10 opacity-55 cursor-not-allowed"
                        : selected
                          ? "bg-white/8 border-white/20"
                          : "bg-black/20 border-white/10 hover:border-white/20",
                    ].join(" ")}
                    disabled={tier.disabled}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-[var(--ink)]">{tier.title}</div>
                      {badge}
                    </div>
                    <div className="mt-2 text-sm text-[var(--ink)]/65">{tier.subtitle}</div>
                    <div className="mt-1 text-xs text-[var(--ink)]/45">{tier.details}</div>
                    <div className="mt-3 text-xs text-[var(--ink)]/70 font-mono">{tier.duration}</div>
                  </motion.button>
                );
              })}
            </div>

            {/* Optional checks accordion */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setOptionalOpen((v) => !v)}
                className="w-full flex items-center justify-between text-sm text-[var(--ink)]/75 hover:text-[var(--ink)] transition-colors"
              >
                <span className="font-medium">Optional checks</span>
                <span className="text-xs text-[var(--ink)]/55">{optionalOpen ? "Hide" : "Show"}</span>
              </button>

              {optionalOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 grid sm:grid-cols-2 gap-3"
                >
                  {[
                    {
                      label: "External links",
                      value: includeExternalLinks,
                      setter: setIncludeExternalLinks,
                      hint: "Catch dead outbound links",
                    },
                    {
                      label: "Forms",
                      value: includeFormChecks,
                      setter: setIncludeFormChecks,
                      hint: "Basic form structure checks",
                    },
                    {
                      label: "Sitemap & robots",
                      value: includeSitemapDiscovery,
                      setter: setIncludeSitemapDiscovery,
                      hint: "Launch hygiene essentials",
                    },
                    {
                      label: "Browser basics",
                      value: includeBrowserChecks,
                      setter: setIncludeBrowserChecks,
                      hint: "Light browser checks",
                    },
                    {
                      label: "Image alt basics",
                      value: includeImageAccessibility,
                      setter: setIncludeImageAccessibility,
                      hint: "Quick accessibility signal",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => opt.setter(!opt.value)}
                      className="rounded-xl bg-black/20 border border-white/10 hover:border-white/20 p-4 text-left flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-medium text-[var(--ink)]">{opt.label}</div>
                        <div className="text-xs text-[var(--ink)]/50 mt-1">{opt.hint}</div>
                      </div>
                      <div
                        className={[
                          "h-6 w-11 rounded-full border border-white/10 p-0.5 flex items-center",
                          opt.value ? "bg-emerald-500/20" : "intel-panel",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "h-5 w-5 rounded-full bg-white transition-transform",
                            opt.value ? "translate-x-5" : "translate-x-0",
                          ].join(" ")}
                        />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Primary action */}
            <div className="mt-6">
              <motion.button
                onClick={handleStartScan}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 font-semibold btn-blood inline-flex items-center justify-center gap-2"
              >
                Run free launch check
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <p className="mt-3 text-xs text-[var(--ink)]/55">
                After every scan, you’ll get a fix prompt you can paste into Cursor, Lovable, Bolt, or Replit.
              </p>
            </div>
          </motion.div>

          {/* Right: Sample Launch Decision */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16, duration: 0.5 }}
            className="rounded-2xl intel-panel p-6 md:p-8 lg:sticky lg:top-8"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[var(--ink)]">Sample Launch Decision</h2>
              <span className="text-xs text-[var(--ink)]/55 intel-panel border border-white/10 px-2 py-1 rounded-full">
                Sample
              </span>
            </div>

            <div className="mt-5 terminal-window rounded overflow-hidden">
              <div className="terminal-bar">
                <span className="terminal-dot bg-[#ff5f57]" />
                <span className="terminal-dot bg-[#febc2e]" />
                <span className="terminal-dot bg-[#28c840]" />
                <span className="ml-2 text-[10px] text-[#8b949e] uppercase tracking-widest">Sample output</span>
              </div>
              <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 class-label">
                  Fix Before Sharing
                </span>
                <span className="text-xs text-[#8b949e] font-mono">Launch Readiness</span>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div className="text-4xl font-semibold tracking-tight text-[#c9d1d9]">
                  72<span className="text-[#8b949e] text-xl">/100</span>
                </div>
                <div className="text-right text-sm text-[#8b949e]">
                  <div>Coverage: <span className="text-[#4ade80]">91%</span></div>
                  <div>Confidence: <span className="text-[#c9d1d9]">High</span></div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-[#c9d1d9] mb-3">Top fixes</div>
                <ol className="space-y-2 text-sm text-[#8b949e]">
                  {[
                    "Add OG image",
                    "Add favicon",
                    "Add sitemap.xml",
                    "Replace placeholder CTA links",
                  ].map((t, idx) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-0.5 h-5 w-5 rounded-full border border-[#30363d] text-xs text-[#8b949e] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleCopyPrompt}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="mt-5 w-full h-11 font-semibold btn-ghost inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied" : "Copy AI Fix Prompt"}
            </motion.button>

            <p className="mt-3 text-xs text-[var(--ink)]/55">
              After every scan, get a fix prompt you can paste into Cursor, Lovable, Bolt, or Replit.
            </p>
          </motion.div>
        </section>

        {/* Common mistakes */}
        <section className="mt-12 md:mt-16">
          <div className="max-w-3xl">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--ink)]">
              What AI-built sites often miss
            </h3>
            <p className="mt-3 text-sm md:text-base text-[var(--ink)]/60">
              These are the launch hygiene issues that make a “done” site feel unfinished the moment you share the link.
            </p>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Ugly link preview", desc: "Your link shows no image or wrong title." },
              { title: "Missing favicon", desc: "Browser tab still looks unfinished." },
              { title: "Generic metadata", desc: "Every page says the same AI-generated title." },
              { title: "Broken route", desc: "A public page or CTA leads to 404." },
              { title: "Placeholder CTA", desc: "Buttons still point to # or empty links." },
              { title: "Missing sitemap/robots", desc: "Search crawlers get no basic launch hints." },
            ].map((c, idx) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: idx * 0.05, duration: 0.35 }}
                whileHover={{ y: -2 }}
                className="rounded-2xl intel-panel p-5"
              >
                <div className="text-[var(--ink)] font-medium">{c.title}</div>
                <div className="mt-2 text-sm text-[var(--ink)]/60">{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12 md:mt-16">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--ink)]">How it works</h3>
          <div className="mt-6 grid md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Paste URL", desc: "Public site link only" },
              { step: "2", title: "Run Launch Check", desc: "Seconds to scan basics" },
              { step: "3", title: "Copy AI Fix Prompt", desc: "Paste into your builder" },
              { step: "4", title: "Rescan and Share", desc: "Ship with confidence" },
            ].map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: idx * 0.05, duration: 0.35 }}
                className="rounded-2xl intel-panel p-5"
              >
                <div className="text-xs text-[var(--ink)]/55 font-mono">Step {s.step}</div>
                <div className="mt-2 text-[var(--ink)] font-medium">{s.title}</div>
                <div className="mt-1 text-sm text-[var(--ink)]/60">{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Optional share preview before/after */}
        <section className="mt-12 md:mt-16 pb-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--ink)]">
                Share preview, before and after
              </h3>
              <p className="mt-3 text-sm md:text-base text-[var(--ink)]/60 max-w-2xl">
                A clean OG image + title + description is the fastest way to make your project look legit when you post it.
              </p>
            </div>
          </div>

          <div className="mt-6 grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl intel-panel border border-white/10 p-5">
              <div className="text-xs text-[var(--ink)]/55 mb-3">Before</div>
              <div className="rounded-xl bg-black/25 border border-white/10 overflow-hidden">
                <div className="h-36 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] flex items-center justify-center text-[var(--ink)]/40 text-sm">
                  No OG image
                </div>
                <div className="p-4">
                  <div className="text-[var(--ink)]/75 font-medium">Example</div>
                  <div className="mt-1 text-sm text-[var(--ink)]/45">AI-built website</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl intel-panel border border-white/10 p-5">
              <div className="text-xs text-[var(--ink)]/55 mb-3">After</div>
              <div className="rounded-xl bg-black/25 border border-white/10 overflow-hidden">
                <div className="h-36 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.18),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] flex items-center justify-center text-[var(--ink)]/75 text-sm">
                  Clean preview image
                </div>
                <div className="p-4">
                  <div className="text-[var(--ink)] font-medium">Launch-ready: metadata + preview</div>
                  <div className="mt-1 text-sm text-[var(--ink)]/60">Clear title, description, and image for sharing</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
