"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ScanInitializer } from "@/app/components/scan/ScanInitializer";

const SCAN_LOGS = [
  { t: "14:23:01", msg: "SCAN INITIATED — my-saas.vercel.app", ok: true },
  { t: "14:23:02", msg: "Target validated — 14 pages detected", ok: true },
  { t: "14:23:03", msg: "WARN: Missing OG image on homepage", ok: false },
  { t: "14:23:04", msg: "Crawling /about /pricing /dashboard...", ok: true },
  { t: "14:23:05", msg: "CRITICAL: /dashboard publicly reachable (no auth redirect)", ok: false },
  { t: "14:23:06", msg: "AI Leftover: 'John Doe' found in testimonial", ok: false },
  { t: "14:23:07", msg: "5 broken internal links detected", ok: false },
  { t: "14:23:08", msg: "Share preview: INCOMPLETE — no og:image", ok: false },
  { t: "14:23:09", msg: "Console errors: 2 JS errors on homepage", ok: false },
  { t: "14:23:10", msg: "Form on /contact: no spam protection detected", ok: false },
  { t: "14:23:11", msg: "Generating copy-paste fix prompts...", ok: true },
  { t: "14:23:12", msg: "Decision: REVIEW BEFORE SHARING — 7 issues", ok: false },
];

// Highlighted proof rows shown at top of left panel
const PROOF_ROWS = [
  { msg: "scan initiated — my-saas.vercel.app", ok: true },
  { msg: "14 pages detected", ok: true },
  { msg: "/dashboard publicly reachable", ok: false },
  { msg: "missing og:image on homepage", ok: false },
  { msg: '"John Doe" found in testimonial', ok: false },
  { msg: "fix prompts generated", ok: true },
];

// Ambient logs shown below proof rows
const AMBIENT_LOGS = [
  { t: "12:31:01", msg: "fetch complete", ok: true },
  { t: "12:31:02", msg: "placeholder link detected", ok: false },
  { t: "12:31:03", msg: "sitemap checked", ok: true },
  { t: "12:31:04", msg: "console warning found", ok: false },
  { t: "12:31:05", msg: "report compiled", ok: true },
  { t: "12:31:06", msg: "exposed key pattern found", ok: false },
  { t: "12:31:07", msg: "og:title missing on /blog", ok: false },
  { t: "12:31:08", msg: "robots.txt present", ok: true },
  { t: "12:31:09", msg: "form missing honeypot", ok: false },
  { t: "12:31:10", msg: "404 on /contact-old", ok: false },
];

const RECENT_SCANS = [
  { site: "my-portfolio.vercel.app", verdict: "READY TO SHARE", detail: "0 blockers", ago: "3s", status: "ready" },
  { site: "saas-mvp.netlify.app", verdict: "REVIEW BEFORE SHARING", detail: "4 issues", ago: "18s", status: "review" },
  { site: "agency-preview.io", verdict: "DO NOT SHARE YET", detail: "/admin exposed", ago: "41s", status: "block" },
  { site: "landing.bolt.new", verdict: "READY TO SHARE", detail: "clean scan", ago: "1m", status: "ready" },
  { site: "blog.cursor.so", verdict: "REVIEW BEFORE SHARING", detail: "2 AI leftovers", ago: "2m", status: "review" },
  { site: "shop.lovable.dev", verdict: "READY TO SHARE", detail: "91% coverage", ago: "3m", status: "ready" },
  { site: "docs.replit.app", verdict: "REVIEW BEFORE SHARING", detail: "broken links", ago: "4m", status: "review" },
  { site: "demo.v0.dev", verdict: "DO NOT SHARE YET", detail: "secret in source", ago: "5m", status: "block" },
];

// Leaner ticker — fewer, punchier items
const TICKER_ITEMS = [
  { label: "SITES SCANNED TODAY", value: null, dynamic: true },
  { label: "BROKEN LINKS FOUND", value: "342" },
  { label: "EXPOSED KEYS FLAGGED", value: "8" },
  { label: "RULES-BASED ENGINE", value: null },
  { label: "NO AI GUESSING", value: null },
];

export default function HomePage() {
  const [scanCount, setScanCount] = useState(2_847);
  const [showScanner, setShowScanner] = useState(false);
  const vibeRef = useRef<HTMLSpanElement>(null);
  const mouseX = useRef(0);
  const autoPos = useRef(0);
  const rafRef = useRef<number>(0);
  const lastMouseTime = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth) * 100;
      lastMouseTime.current = Date.now();
    };
    window.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      if (!vibeRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      const timeSinceMouse = Date.now() - lastMouseTime.current;
      let pos: number;
      if (timeSinceMouse < 200) {
        // Mouse is active — follow cursor
        pos = mouseX.current;
      } else {
        // No mouse — auto-flow slowly
        autoPos.current = (autoPos.current + 0.3) % 100;
        pos = autoPos.current;
      }
      vibeRef.current.style.backgroundPosition = `${pos}% 50%`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setScanCount((n) => n + Math.floor(Math.random() * 2)),
      4000
    );
    return () => clearInterval(id);
  }, []);

  const scrollToScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
      document.getElementById('scanner-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen">
      <section className="bg-[#0a0e14] text-cream relative overflow-hidden scanline-overlay bg-coord-grid-dark">

        {/* ── TOP NAV ── */}
        <div className="relative z-20 border-b border-white/10 bg-black/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-cream">VibeSiteScan</Link>
            <nav className="flex items-center gap-4">
              <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
              <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">Sign in</Link>
              <Link
                href="/dashboard/new-scan-pipeline"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Scan a site
              </Link>
            </nav>
          </div>
        </div>

        {/* ── TOP TICKER ── */}
        <div className="bg-black/70 border-b border-white/10 py-2 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap font-mono text-[10px] tracking-wider uppercase"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-8 px-8">
                <span className="text-emerald-500/60">·</span>
                {item.dynamic ? (
                  <span>
                    <span className="text-white/55">{item.label}:</span>
                    {" "}
                    <span className="text-white/90">{scanCount.toLocaleString()}</span>
                  </span>
                ) : item.value ? (
                  <span>
                    <span className="text-white/55">{item.label}:</span>
                    {" "}
                    <span className="text-white/90">{item.value}</span>
                  </span>
                ) : (
                  <span className="text-white/60">{item.label}</span>
                )}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-2.5rem)]">

          {/* ── LEFT PANEL ── */}
          <div className="hidden md:flex flex-col border-r border-white/10 bg-black/25">

            {/* Heading */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
              <span className="font-mono text-[12px] font-semibold tracking-widest uppercase text-white/85">Live Scans</span>
              <span className="signal-dot active" />
            </div>

            {/* Layer 1: Readable proof rows */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex flex-col gap-2">
                {PROOF_ROWS.map((row, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[11px] shrink-0 mt-px ${row.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {row.ok ? "✓" : "✗"}
                    </span>
                    <span className={`font-mono text-[11px] leading-snug ${row.ok ? "text-white/80" : "text-white/75"}`}>
                      {row.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer 2: Ambient terminal stream */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
              <div className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-2">Terminal stream</div>
              <div className="flex flex-col gap-1.5">
                {[...AMBIENT_LOGS, ...AMBIENT_LOGS].map((line, i) => (
                  <div key={i} className="flex gap-2 font-mono text-[9px] leading-relaxed">
                    <span className="text-white/25 shrink-0">{line.t}</span>
                    <span className={line.ok ? "text-emerald-600/60" : "text-red-600/60"}>{line.ok ? "✓" : "✗"}</span>
                    <span className="text-white/35">{line.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10">
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                Scans today: <span className="text-white/80">{scanCount.toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* ── CENTER HERO ── */}
          <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center relative">

            {/* Radial vignette for hero focus */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 80%)" }}
            />

            {/* Subtle glow behind SCAN */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 40% 30% at 50% 62%, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
            />

            <span className="absolute top-4 left-4 font-mono text-[9px] text-white/20">STATUS: ONLINE</span>
            <span className="absolute top-4 right-4 font-mono text-[9px] text-white/20">SYS 1.0</span>
            <span className="absolute bottom-4 left-4 font-mono text-[9px] text-white/20">LAUNCH GATE</span>
            <span className="absolute bottom-4 right-4 font-mono text-[9px] text-white/20">ACTIVE</span>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6 relative z-10">
              <span className="classified-stamp text-[9px] text-white/45">PRE-LAUNCH INTELLIGENCE</span>
            </motion.div>

            <style>{`
              .vibe-gradient {
                background: linear-gradient(90deg, #6b0000, #b91c1c, #ef4444, #fca5a5, #b91c1c, #6b0000);
                background-size: 300% 300%;
                background-position: 0% 50%;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
            `}</style>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="font-bold leading-none relative z-10"
              style={{ fontSize: "clamp(3.5rem, 14vw, 10rem)" }}
            >
              <span ref={vibeRef} className="vibe-gradient">VIBE</span>
              <span className="text-white">SITE</span>
              <br />
              <span className="text-emerald-400 font-mono tracking-tighter">SCAN</span>
            </motion.h1>

            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="w-full max-w-md border-t border-white/25 my-7 relative z-10" />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-xl md:text-2xl text-white/95 max-w-lg leading-relaxed mb-2 relative z-10"
            >
              Final QA for vibe-coded websites.
              <br />
              <span className="text-white/65">See what the internet can see before you share it.</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="font-mono text-[11px] tracking-widest uppercase text-white/50 mb-10 relative z-10"
            >
              Exposure Map · Exposed Keys · AI Leftovers · Broken Links · Dead Forms · Fix Prompts
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="flex flex-col sm:flex-row gap-3 relative z-10"
            >
              <button
                onClick={scrollToScanner}
                className="px-8 py-3 bg-emerald-600 text-white font-mono text-xs tracking-widest uppercase hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Scan My Site
              </button>
              <Link href="/r/sample" className="px-8 py-3 border border-white/30 text-white/80 font-mono text-xs tracking-widest uppercase hover:border-white/50 hover:text-white transition-colors">
                View Sample Report
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-5 font-mono text-[11px] text-white/55 uppercase tracking-widest relative z-10"
            >
              <span className="text-white/70">Rules-based checks</span>
              <span className="text-emerald-500/60">◆</span>
              <span className="text-white/70">Clear evidence</span>
              <span className="text-emerald-500/60">◆</span>
              <span className="text-white/70">No AI guessing</span>
            </motion.div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="hidden md:flex flex-col border-l border-white/10 bg-black/25">

            {/* Heading */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
              <span className="font-mono text-[12px] font-semibold tracking-widest uppercase text-white/85">Recent Scans</span>
              <span className="signal-dot warn" />
            </div>

            {/* Scan rows */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
              <div className="flex flex-col">
                {[...RECENT_SCANS, ...RECENT_SCANS].map((item, i) => (
                  <div key={i} className="py-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[11px] text-white/80 truncate pr-2">{item.site}</span>
                      <span className="font-mono text-[9px] text-white/30 shrink-0">{item.ago}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] font-medium tracking-wide ${
                        item.status === "ready" ? "text-emerald-400/90"
                        : item.status === "block" ? "text-red-400/90"
                        : "text-amber-400/80"
                      }`}>
                        {item.verdict}
                      </span>
                      <span className="text-white/20 text-[9px]">·</span>
                      <span className="font-mono text-[10px] text-white/45">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top issues footer */}
            <div className="px-4 py-3 border-t border-white/10">
              <div className="font-mono text-[10px] font-medium text-white/65 uppercase tracking-widest mb-2">Top Issues Found</div>
              <div className="flex flex-col gap-1">
                <div className="font-mono text-[10px] text-white/60">#1 — Missing OG images <span className="text-white/35">(34)</span></div>
                <div className="font-mono text-[10px] text-white/55">#2 — AI leftovers in content <span className="text-white/30">(27)</span></div>
                <div className="font-mono text-[10px] text-white/50">#3 — Broken internal links <span className="text-white/28">(19)</span></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {showScanner && (
        <section id="scanner-section" className="min-h-screen">
          <ScanInitializer />
        </section>
      )}
    </div>
  );
}
