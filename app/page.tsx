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

const RECENT_SCANS = [
  { site: "my-portfolio.vercel.app", verdict: "READY TO SHARE — 0 blockers", ago: "3s" },
  { site: "saas-mvp.netlify.app", verdict: "REVIEW BEFORE SHARING — 4 issues", ago: "18s" },
  { site: "agency-preview.io", verdict: "DO NOT SHARE YET — /admin exposed", ago: "41s" },
  { site: "landing.bolt.new", verdict: "READY TO SHARE — clean scan", ago: "1m" },
  { site: "blog.cursor.so", verdict: "REVIEW BEFORE SHARING — 2 AI leftovers", ago: "2m" },
  { site: "shop.lovable.dev", verdict: "READY TO SHARE — 91% coverage", ago: "3m" },
  { site: "docs.replit.app", verdict: "REVIEW BEFORE SHARING — broken links", ago: "4m" },
  { site: "demo.v0.dev", verdict: "DO NOT SHARE YET — secret in source", ago: "5m" },
];

const TICKER = [
  "FINAL QA FOR VIBE-CODED WEBSITES",
  "PUBLIC EXPOSURE MAP: INSTANT",
  "AI LEFTOVERS DETECTED: 127 TODAY",
  "BROKEN LINKS FOUND: 342",
  "EXPOSED KEYS FLAGGED: 8",
  "COPY-PASTE FIX PROMPTS FOR CURSOR, LOVABLE, BOLT",
  "DETERMINISTIC CHECKS — ZERO AI GUESSING",
  "RULES-BASED ENGINE — CLEAR EVIDENCE",
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
        <div className="bg-black/60 border-b border-white/20 py-1.5 overflow-hidden">
          <motion.div
            className="flex gap-16 whitespace-nowrap font-mono text-[10px] tracking-widest uppercase text-white/70"
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
          <div className="hidden md:flex flex-col border-r border-white/20 p-4 gap-3 bg-black/20">
            <div className="flex items-center justify-between mb-1">
              <span className="class-label text-white/60 border-white/30 text-[9px]">LIVE SCANS</span>
              <span className="signal-dot active" />
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="flex flex-col gap-2">
                {[...SCAN_LOGS, ...SCAN_LOGS].map((line, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono leading-relaxed">
                    <span className="text-white/40 shrink-0">{line.t}</span>
                    <span className={line.ok ? "text-emerald-400" : "text-red-400"}>
                      {line.ok ? "✓" : "✗"}
                    </span>
                    <span className="text-white/80">{line.msg}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/20 pt-2 font-mono text-[9px] text-white/50 uppercase tracking-widest">
              Scans today: {scanCount.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center relative">
            <span className="absolute top-4 left-4 font-mono text-[9px] text-white/30">STATUS: ONLINE</span>
            <span className="absolute top-4 right-4 font-mono text-[9px] text-white/30">SYS 1.0</span>
            <span className="absolute bottom-4 left-4 font-mono text-[9px] text-white/30">LAUNCH GATE</span>
            <span className="absolute bottom-4 right-4 font-mono text-[9px] text-white/30">ACTIVE</span>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
              <span className="classified-stamp text-[9px] text-white/50">PRE-LAUNCH INTELLIGENCE</span>
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
              className="font-bold leading-none"
              style={{ fontSize: "clamp(3.5rem, 14vw, 10rem)" }}
            >
              <span ref={vibeRef} className="vibe-gradient">VIBE</span>
              <span className="text-white">SITE</span>
              <br />
              <span className="text-emerald-400 font-mono tracking-tighter">SCAN</span>
            </motion.h1>

            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="w-full max-w-md border-t border-white/30 my-6" />

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-xl md:text-2xl text-white max-w-lg leading-relaxed mb-2">
              Final QA for vibe-coded websites.
              <br />
              <span className="text-white/60">See what the internet sees before you share it.</span>
            </motion.p>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="font-mono text-[10px] tracking-widest uppercase text-white/50 mb-10">
              Exposure Map · AI Leftovers · Broken Links · Forms · Exposed Keys · Fix Prompts
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="flex flex-col sm:flex-row gap-3">
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

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] text-white/40 uppercase tracking-widest">
              <span>Rules-based checks</span>
              <span>◆</span>
              <span>Clear evidence</span>
              <span>◆</span>
              <span>No AI guessing</span>
            </motion.div>
          </div>

          <div className="hidden md:flex flex-col border-l border-white/20 p-4 gap-3 bg-black/20">
            <div className="flex items-center justify-between mb-1">
              <span className="class-label text-white/60 border-white/30 text-[9px]">RECENT SCANS</span>
              <span className="signal-dot warn" />
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="flex flex-col gap-3">
                {[...RECENT_SCANS, ...RECENT_SCANS].map((item, i) => (
                  <div key={i} className="border-b border-white/10 pb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[9px] text-emerald-400">{item.site}</span>
                      <span className="font-mono text-[9px] text-white/40">{item.ago}</span>
                    </div>
                    <p className="font-mono text-[10px] text-white/70 leading-relaxed">{item.verdict}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/20 pt-2">
              <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1">Top Issues Found</div>
              <div className="font-mono text-[10px] text-white/70">#1 — Missing OG images (34)</div>
              <div className="font-mono text-[10px] text-white/60">#2 — AI leftovers in content (27)</div>
              <div className="font-mono text-[10px] text-white/50">#3 — Broken internal links (19)</div>
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
