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
import { NavAccount } from "@/app/components/NavAccount";

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
    label: string;
    title: string;
    subtitle: string;
    details: string;
    duration: string;
    badge?: "Free" | "Default" | "Pro";
    disabled?: boolean;
  }> = [
    {
      id: "quick",
      label: "01",
      title: "Quick Pass",
      subtitle: "Homepage only",
      details: "Best for landing pages",
      duration: "5–10 sec",
      badge: "Free",
    },
    {
      id: "standard",
      label: "02",
      title: "Launch Check",
      subtitle: "Homepage + public routes",
      details: "Best before public sharing",
      duration: "15–45 sec",
      badge: "Default",
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: "standard" as any,
      label: "03",
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
- Don't introduce breaking route changes.

Site URL: <PASTE_YOUR_URL_HERE>`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(sampleFixPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#05080d", color: "#f0f4ff" }}
    >
      {/* Dark grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
        }}
      />
      {/* Green radial spotlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 35%, rgba(49,233,129,0.04) 0%, transparent 70%)",
        }}
      />
      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Decorative corner labels — hidden on mobile */}
      <span className="hidden sm:block absolute top-4 left-4 font-mono text-[9px] text-white/20 pointer-events-none select-none">STATUS: READY</span>
      <span className="hidden sm:block absolute top-4 right-4 font-mono text-[9px] text-white/20 pointer-events-none select-none">ENGINE: RULES-BASED</span>
      <span className="hidden sm:block absolute bottom-4 left-4 font-mono text-[9px] text-white/20 pointer-events-none select-none">MODE: PRE-LAUNCH</span>
      <span className="hidden sm:block absolute bottom-4 right-4 font-mono text-[9px] text-white/20 pointer-events-none select-none">NO AI GUESSING</span>

      <div className="container mx-auto px-4 py-8 md:py-10 max-w-7xl relative">

        {/* ── NAV ── */}
        <header
          className="flex items-center justify-between gap-4 mb-10 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 flex items-center justify-center"
              style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(49,233,129,0.07)" }}
            >
              <span className="font-mono font-semibold text-white text-sm">V</span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-white text-[15px]">VibeSite Scan</div>
              <div className="font-mono text-[10px] tracking-wide" style={{ color: "rgba(240,244,255,0.55)" }}>
                Final QA for AI-built websites
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/r/sample" className="font-mono text-xs tracking-wide transition-colors" style={{ color: "rgba(240,244,255,0.62)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,244,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,244,255,0.62)")}
            >
              Sample Report
            </Link>
            <Link href="/pricing" className="font-mono text-xs tracking-wide transition-colors" style={{ color: "rgba(240,244,255,0.62)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,244,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,244,255,0.62)")}
            >
              Pricing
            </Link>
            <NavAccount />
          </nav>
        </header>

        {/* ── HERO ── */}
        <section className="text-center mb-10 md:mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06 }}
            className="font-mono text-[11px] uppercase tracking-[0.2em] mb-4"
            style={{ color: "rgba(49,233,129,0.6)" }}
          >
            SCAN CONFIGURATION
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl md:text-5xl font-semibold tracking-tight text-white/95"
          >
            Configure your launch scan.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5 }}
            className="mt-4 text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: "rgba(240,244,255,0.68)" }}
          >
            Choose scan depth. We&apos;ll check public routes, metadata, links, forms, and launch hygiene before you share.
          </motion.p>

          {/* ── COMMAND BAR ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="mt-8 max-w-3xl mx-auto"
          >
            {/* Target URL label */}
            <div className="text-left mb-2 font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(49,233,129,0.7)" }}>
              TARGET URL
            </div>
            <div
              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2"
              style={{ background: "rgba(10,16,26,0.80)", border: "1px solid rgba(255,255,255,0.13)" }}
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => { setTargetUrl(e.target.value); validateUrl(e.target.value); }}
                  onKeyDown={(e) => e.key === "Enter" && handleStartScan()}
                  placeholder="https://your-site.com"
                  className="w-full h-13 px-4 sm:px-5 font-mono text-sm sm:text-base outline-none transition-all placeholder:text-white/25"
                  style={{
                    background: "rgba(5,8,13,0.9)",
                    border: urlError
                      ? "1px solid rgba(255,77,94,0.75)"
                      : isValidUrl
                      ? "1px solid rgba(49,233,129,0.6)"
                      : "1px solid rgba(255,255,255,0.14)",
                    color: "#f0f4ff",
                    height: "3.25rem",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(49,233,129,0.7)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(49,233,129,0.12), inset 0 0 12px rgba(49,233,129,0.03)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = urlError
                      ? "rgba(255,77,94,0.75)"
                      : isValidUrl
                      ? "rgba(49,233,129,0.6)"
                      : "rgba(255,255,255,0.14)";
                    e.target.style.boxShadow = "none";
                  }}
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
                whileHover={{ y: -1, boxShadow: "0 0 20px rgba(49,233,129,0.3)" }}
                whileTap={{ scale: 0.99 }}
                className="h-12 px-6 font-mono text-xs font-semibold tracking-widest uppercase inline-flex items-center justify-center gap-2 transition-all shrink-0"
                style={{ background: "#31e981", color: "#05080d", height: "3.25rem" }}
              >
                Run Free Scan <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-[11px]"
              style={{ color: "rgba(240,244,255,0.60)" }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />Public pages only
              </span>
              <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />No code required
              </span>
              <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
              <Link href="/r/sample" className="inline-flex items-center gap-1 hover:text-white/80 transition-colors">
                View sample report <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {urlError && (
              <div className="mt-3 font-mono text-xs text-red-400 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />{urlError}
              </div>
            )}
          </motion.div>

          {/* ── TRUST CHIPS ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.30, duration: 0.5 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            {["Works with Vercel", "Works with Netlify", "Works with Replit", "Built for Lovable/Bolt/Cursor", "Public pages only", "No code required"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors cursor-default"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  color: "rgba(240,244,255,0.72)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "rgba(49,233,129,0.6)" }} />
                {pill}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ── MAIN TWO-COLUMN ── */}
        <section className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* ── LEFT: SCAN CONFIGURATION ── */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14, duration: 0.5 }}
            className="p-6 md:p-8"
            style={{ background: "rgba(10,16,26,0.72)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Panel label */}
            <div className="flex items-start justify-between gap-4 mb-7">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-2" style={{ color: "rgba(49,233,129,0.6)" }}>
                  [01] SCAN CONFIGURATION
                </div>
                <h2 className="text-lg font-semibold text-white/90">Launch Check Setup</h2>
                <p className="mt-1 text-sm" style={{ color: "rgba(240,244,255,0.65)" }}>
                  Choose scan depth. We&apos;ll generate a fix prompt after the report.
                </p>
              </div>
              <span
                className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 shrink-0"
                style={{ border: "1px solid rgba(49,233,129,0.3)", color: "rgba(49,233,129,0.7)", background: "rgba(49,233,129,0.06)" }}
              >
                Free
              </span>
            </div>

            {/* ── SCAN MODE ── */}
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-3" style={{ color: "rgba(49,233,129,0.6)" }}>
              [02] SCAN MODE
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {tierCards.map((tier) => {
                const selected = !tier.disabled && scanMode === tier.id;
                const badge =
                  tier.badge === "Default" ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 tracking-wide"
                      style={{ background: "rgba(49,233,129,0.1)", color: "rgba(49,233,129,0.8)", border: "1px solid rgba(49,233,129,0.2)" }}>
                      Default
                    </span>
                  ) : tier.badge === "Free" ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 tracking-wide"
                      style={{ background: "rgba(49,233,129,0.07)", color: "rgba(49,233,129,0.7)", border: "1px solid rgba(49,233,129,0.15)" }}>
                      Free
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] px-2 py-0.5 tracking-wide inline-flex items-center gap-1"
                      style={{ background: "rgba(246,184,75,0.08)", color: "rgba(246,184,75,0.7)", border: "1px solid rgba(246,184,75,0.2)" }}>
                      <Lock className="w-2.5 h-2.5" />Pro
                    </span>
                  );

                return (
                  <motion.button
                    key={tier.title}
                    type="button"
                    onClick={() => !tier.disabled && setScanMode(tier.id)}
                    whileHover={tier.disabled ? undefined : { y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="text-left p-4 transition-all"
                    style={{
                      background: selected ? "rgba(49,233,129,0.06)" : "rgba(5,8,13,0.6)",
                      border: selected ? "1px solid rgba(49,233,129,0.45)" : "1px solid rgba(255,255,255,0.07)",
                      boxShadow: selected ? "0 0 16px rgba(49,233,129,0.08)" : "none",
                      opacity: tier.disabled ? 0.45 : 1,
                      cursor: tier.disabled ? "not-allowed" : "pointer",
                    }}
                    disabled={tier.disabled}
                  >
                    <div className="font-mono text-[10px] tracking-widest mb-2"
                      style={{ color: selected ? "rgba(49,233,129,0.7)" : "rgba(255,255,255,0.22)" }}>
                      {tier.label}
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-semibold text-white/85 text-sm">{tier.title}</div>
                      {badge}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(240,244,255,0.70)" }}>{tier.subtitle}</div>
                    <div className="text-[11px] mt-1" style={{ color: "rgba(240,244,255,0.52)" }}>{tier.details}</div>
                    <div className="mt-3 font-mono text-[11px]"
                      style={{ color: selected ? "rgba(49,233,129,0.80)" : "rgba(240,244,255,0.58)" }}>
                      {tier.duration}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* ── OPTIONAL CHECKS ── */}
            <div className="mt-7" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setOptionalOpen((v) => !v)}
                className="w-full flex items-center justify-between"
              >
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(49,233,129,0.6)" }}>
                  [03] OPTIONAL MODULES
                </div>
                <span className="font-mono text-[10px] tracking-widest" style={{ color: "rgba(240,244,255,0.55)" }}>
                  {optionalOpen ? "HIDE ↑" : "SHOW ↓"}
                </span>
              </button>

              {optionalOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 grid sm:grid-cols-2 gap-3"
                >
                  {[
                    { label: "External links", value: includeExternalLinks, setter: setIncludeExternalLinks, hint: "Catch dead outbound links" },
                    { label: "Forms", value: includeFormChecks, setter: setIncludeFormChecks, hint: "Basic form structure checks" },
                    { label: "Sitemap & robots", value: includeSitemapDiscovery, setter: setIncludeSitemapDiscovery, hint: "Launch hygiene essentials" },
                    { label: "Browser basics", value: includeBrowserChecks, setter: setIncludeBrowserChecks, hint: "Light browser checks" },
                    { label: "Image alt basics", value: includeImageAccessibility, setter: setIncludeImageAccessibility, hint: "Quick accessibility signal" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => opt.setter(!opt.value)}
                      className="p-4 text-left flex items-start justify-between gap-4 transition-all"
                      style={{
                        background: opt.value ? "rgba(49,233,129,0.04)" : "rgba(5,8,13,0.5)",
                        border: opt.value ? "1px solid rgba(49,233,129,0.22)" : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-white/85">{opt.label}</div>
                        <div className="text-[11px] mt-1" style={{ color: "rgba(240,244,255,0.60)" }}>{opt.hint}</div>
                      </div>
                      <div
                        className="h-6 w-11 p-0.5 flex items-center shrink-0 transition-colors"
                        style={{
                          borderRadius: "9999px",
                          background: opt.value ? "rgba(49,233,129,0.22)" : "rgba(255,255,255,0.05)",
                          border: opt.value ? "1px solid rgba(49,233,129,0.38)" : "1px solid rgba(255,255,255,0.09)",
                        }}
                      >
                        <div
                          className="h-5 w-5 rounded-full transition-transform"
                          style={{
                            background: opt.value ? "#31e981" : "rgba(255,255,255,0.35)",
                            transform: opt.value ? "translateX(1.25rem)" : "translateX(0)",
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* ── PRIMARY CTA ── */}
            <div className="mt-7">
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-3" style={{ color: "rgba(49,233,129,0.6)" }}>
                [04] RUN SCAN
              </div>
              <motion.button
                onClick={handleStartScan}
                whileHover={{ y: -1, boxShadow: "0 0 24px rgba(49,233,129,0.3)" }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 font-mono text-sm font-semibold tracking-widest uppercase inline-flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "#31e981",
                  color: "#05080d",
                  opacity: !targetUrl.trim() ? 0.45 : 1,
                  cursor: !targetUrl.trim() ? "not-allowed" : "pointer",
                }}
              >
                Run Free Scan <ArrowRight className="w-4 h-4" />
              </motion.button>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] tracking-widest"
                style={{ color: "rgba(240,244,255,0.58)" }}>
                <span style={{ color: "rgba(49,233,129,0.5)" }}>◆</span>
                <span>RULES-BASED CHECKS</span>
                <span style={{ color: "rgba(49,233,129,0.5)" }}>◆</span>
                <span>CLEAR EVIDENCE</span>
                <span style={{ color: "rgba(49,233,129,0.5)" }}>◆</span>
                <span>NO AI GUESSING</span>
                <span style={{ color: "rgba(49,233,129,0.5)" }}>◆</span>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: SCAN PREVIEW ── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="p-6 md:p-8 lg:sticky lg:top-8"
            style={{ background: "rgba(10,16,26,0.72)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-1"
                  style={{ color: "rgba(49,233,129,0.6)" }}>
                  SCAN PREVIEW
                </div>
                <h2 className="text-lg font-semibold text-white/90">Sample Launch Decision</h2>
              </div>
              <span
                className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,244,255,0.38)", background: "rgba(255,255,255,0.03)" }}
              >
                Sample
              </span>
            </div>

            {/* Terminal window */}
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(5,8,13,0.8)", overflow: "hidden" }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: "rgba(240,244,255,0.28)" }}>
                  SAMPLE OUTPUT
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 font-mono text-xs font-medium tracking-widest uppercase"
                    style={{ background: "rgba(255,77,94,0.14)", color: "#ff4d5e", border: "1px solid rgba(255,77,94,0.28)" }}
                  >
                    Fix Before Sharing
                  </span>
                  <span className="font-mono text-[10px] tracking-widest uppercase"
                    style={{ color: "rgba(240,244,255,0.52)" }}>
                    Launch Readiness
                  </span>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="font-semibold tracking-tight text-white/90" style={{ fontSize: "2.5rem", lineHeight: 1 }}>
                    72<span className="text-xl" style={{ color: "rgba(240,244,255,0.32)" }}>/100</span>
                  </div>
                  <div className="text-right font-mono text-sm" style={{ color: "rgba(240,244,255,0.65)" }}>
                    <div>Coverage: <span className="text-emerald-400">91%</span></div>
                    <div>Confidence: <span className="text-white/75">High</span></div>
                  </div>
                </div>

                <div className="mt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.25rem" }}>
                  <div className="font-mono text-[11px] uppercase tracking-widest mb-3"
                    style={{ color: "rgba(240,244,255,0.58)" }}>
                    Top Blockers
                  </div>
                  <ol className="space-y-2">
                    {["Missing OG image", "Broken internal link", "Dead contact form", "Placeholder CTA links"].map((t, idx) => (
                      <li key={t} className="flex items-start gap-3 font-mono text-sm"
                        style={{ color: "rgba(240,244,255,0.72)" }}>
                        <span
                          className="mt-0.5 h-5 w-5 flex items-center justify-center text-[10px] shrink-0"
                          style={{ border: "1px solid rgba(255,77,94,0.28)", color: "#ff4d5e" }}
                        >
                          {String(idx + 1).padStart(2, "0")}
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
              className="mt-4 w-full h-11 font-mono text-xs font-semibold tracking-widest uppercase inline-flex items-center justify-center gap-2 transition-all"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.14)",
                color: copied ? "#31e981" : "rgba(240,244,255,0.72)",
              }}
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied ✓" : "Copy AI Fix Prompt"}
            </motion.button>

            <p className="mt-3 font-mono text-[11px] text-center" style={{ color: "rgba(240,244,255,0.50)" }}>
              After every scan, get evidence and copy-paste fix prompts for Cursor, Lovable, Bolt, or Replit.
            </p>
          </motion.div>
        </section>

        {/* ── COMMON MISTAKES ── */}
        <section className="mt-12 md:mt-16">
          <div className="max-w-3xl mb-6">
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-3"
              style={{ color: "rgba(49,233,129,0.6)" }}>
              WHAT AI BUILDERS MISS
            </div>
            <h3 className="text-2xl font-semibold text-white/85">Common launch hygiene issues</h3>
            <p className="mt-2 text-sm" style={{ color: "rgba(240,244,255,0.60)" }}>
              These are the issues that make a &quot;done&quot; site feel unfinished the moment you share the link.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                className="p-5 transition-all"
                style={{ background: "rgba(10,16,26,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-white/80 font-medium text-sm">{c.title}</div>
                <div className="mt-2 text-sm" style={{ color: "rgba(240,244,255,0.60)" }}>{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mt-12 md:mt-16 pb-12">
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-3"
            style={{ color: "rgba(49,233,129,0.6)" }}>
            HOW IT WORKS
          </div>
          <h3 className="text-2xl font-semibold text-white/85 mb-6">Four steps to launch-ready.</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { step: "01", title: "Paste URL", desc: "Public site link only" },
              { step: "02", title: "Run Scan", desc: "Seconds to scan basics" },
              { step: "03", title: "Copy Fix Prompt", desc: "Paste into your builder" },
              { step: "04", title: "Rescan & Share", desc: "Ship with confidence" },
            ].map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: idx * 0.07, duration: 0.35 }}
                className="p-5"
                style={{ background: "rgba(10,16,26,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="font-mono text-[11px] tracking-widest mb-2"
                  style={{ color: "rgba(49,233,129,0.52)" }}>{s.step}</div>
                <div className="text-white/80 font-medium text-sm">{s.title}</div>
                <div className="mt-1 text-sm" style={{ color: "rgba(240,244,255,0.55)" }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
