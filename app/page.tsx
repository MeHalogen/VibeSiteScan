"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SCAN_LOGS = [
  { t: "14:23:01", msg: "SCAN INITIATED — example.com", ok: true },
  { t: "14:23:02", msg: "Target validated — 47 pages detected", ok: true },
  { t: "14:23:03", msg: "WARN: Missing OG image on homepage", ok: false },
  { t: "14:23:04", msg: "Crawling /about /pricing /blog...", ok: true },
  { t: "14:23:05", msg: "Critical: 404 on /contact-us", ok: false },
  { t: "14:23:06", msg: "Launch Readiness: 72/100 — FIX REQUIRED", ok: false },
  { t: "14:23:07", msg: "12 broken links detected", ok: false },
  { t: "14:23:08", msg: "SEO check: PASS — metadata complete", ok: true },
  { t: "14:23:09", msg: "Console errors: 3 warnings logged", ok: false },
  { t: "14:23:10", msg: "Generating launch report...", ok: true },
  { t: "14:23:11", msg: "SCAN COMPLETE — report ready", ok: true },
  { t: "14:23:12", msg: "Decision: FIX BEFORE SHARING", ok: false },
];

const RECENT_SCANS = [
  { site: "startup-x.com", verdict: "SAFE TO SHARE — 94/100", ago: "3s" },
  { site: "portfolio.dev", verdict: "FIX BEFORE SHARING — 72/100", ago: "18s" },
  { site: "agency-site.io", verdict: "DO NOT SHIP — 45/100", ago: "41s" },
  { site: "saas-app.com", verdict: "SAFE TO SHARE — 88/100", ago: "1m" },
  { site: "blog.example", verdict: "FIX BEFORE SHARING — 67/100", ago: "2m" },
  { site: "shop.store", verdict: "SAFE TO SHARE — 91/100", ago: "3m" },
  { site: "docs.product", verdict: "FIX BEFORE SHARING — 78/100", ago: "4m" },
  { site: "demo.tech", verdict: "DO NOT SHIP — 52/100", ago: "5m" },
];

const TICKER = [
  "47 SITES SCANNED TODAY",
  "LAUNCH READINESS: INSTANT",
  "BROKEN LINKS DETECTED: 127",
  "MISSING OG IMAGES: 34",
  "AVERAGE SCORE: 76/100",
  "SITES SAVED FROM EMBARRASSMENT: 12",
  "SCAN DEPTH: COMPREHENSIVE",
  "LOCAL SCANS. ZERO SHAME.",
];

export default function HomePage() {
  const [scanCount, setScanCount] = useState(2_847);

  useEffect(() => {
    const id = setInterval(
      () => setScanCount((n) => n + Math.floor(Math.random() * 2)),
      4000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen">
      <section className="bg-graphite text-cream relative overflow-hidden scanline-overlay bg-coord-grid-dark">
        <div className="bg-black/40 border-b border-white/10 py-1.5 overflow-hidden">
          <motion.div
            className="flex gap-16 whitespace-nowrap font-mono text-[10px] tracking-widest uppercase text-white/50"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          >
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="flex items-center gap-4">
                <span className="text-emerald-400">◆</span>
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] min-h-[calc(100vh-2.5rem)]">
          <div className="hidden md:flex flex-col border-r border-white/10 p-4 gap-3">
            <div className="flex items-center justify-between mb-1">
              <span className="class-label text-white/40 border-white/20 text-[9px]">LIVE SCANS</span>
              <span className="signal-dot active" />
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="flex flex-col gap-2">
                {[...SCAN_LOGS, ...SCAN_LOGS].map((line, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono leading-relaxed">
                    <span className="text-white/25 shrink-0">{line.t}</span>
                    <span className={line.ok ? "text-emerald-400/70" : "text-red-400/70"}>
                      {line.ok ? "✓" : "✗"}
                    </span>
                    <span className="text-white/50">{line.msg}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/10 pt-2 font-mono text-[9px] text-white/30 uppercase tracking-widest">
              Scans today: {scanCount.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center relative">
            <span className="absolute top-4 left-4 font-mono text-[9px] text-white/15">STATUS: ONLINE</span>
            <span className="absolute top-4 right-4 font-mono text-[9px] text-white/15">SYS 1.0</span>
            <span className="absolute bottom-4 left-4 font-mono text-[9px] text-white/15">LAUNCH GATE</span>
            <span className="absolute bottom-4 right-4 font-mono text-[9px] text-white/15">ACTIVE</span>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
              <span className="classified-stamp text-[9px]">PRE-LAUNCH INTELLIGENCE</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="font-bold leading-none text-cream"
              style={{ fontSize: "clamp(3.5rem, 14vw, 10rem)" }}
            >
              LAUNCH
              <br />
              <span className="text-emerald-400 font-mono tracking-tighter">SCAN</span>
            </motion.h1>

            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="w-full max-w-md border-t border-white/20 my-6" />

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-xl md:text-2xl text-white/70 max-w-lg leading-relaxed mb-2">
              Scan any website for launch readiness.
              <br />
              <span className="text-white/40">Know before they know.</span>
            </motion.p>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="font-mono text-[10px] tracking-widest uppercase text-white/30 mb-10">
              SEO · Links · Forms · Console · Meta · Mobile
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/new-scan-pipeline" className="px-8 py-3 bg-emerald-600 text-white font-mono text-xs tracking-widest uppercase hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20">
                Run Free Scan
              </Link>
              <Link href="/r/sample" className="px-8 py-3 border border-white/20 text-white/60 font-mono text-xs tracking-widest uppercase hover:border-white/50 hover:text-white transition-colors">
                View Sample Report
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] text-white/25 uppercase tracking-widest">
              <span>Instant results</span>
              <span>◆</span>
              <span>No signup</span>
              <span>◆</span>
              <span>100% Free</span>
            </motion.div>
          </div>

          <div className="hidden md:flex flex-col border-l border-white/10 p-4 gap-3">
            <div className="flex items-center justify-between mb-1">
              <span className="class-label text-white/40 border-white/20 text-[9px]">RECENT SCANS</span>
              <span className="signal-dot warn" />
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="flex flex-col gap-3">
                {[...RECENT_SCANS, ...RECENT_SCANS].map((item, i) => (
                  <div key={i} className="border-b border-white/5 pb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[9px] text-emerald-400/70">{item.site}</span>
                      <span className="font-mono text-[9px] text-white/20">{item.ago}</span>
                    </div>
                    <p className="font-mono text-[10px] text-white/50 leading-relaxed">{item.verdict}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/10 pt-2">
              <div className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-1">Top Issues</div>
              <div className="font-mono text-[10px] text-white/50">#1 — Missing OG images (34)</div>
              <div className="font-mono text-[10px] text-white/40">#2 — Broken links (127)</div>
              <div className="font-mono text-[10px] text-white/30">#3 — Console errors (89)</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
