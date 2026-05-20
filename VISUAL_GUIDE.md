# 🎨 LaunchScan Dual-Theme Visual Guide

## Theme Transition Flow

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIG PAGE (/dashboard/new-scan-pipeline)                  │
│  Theme: LAUNCH GATE (Cream/Paper Receipt)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Background: Cream (#EDE8DC) + subtle paper grid             │
│  Typography: Ink (#111111) with shadow                       │
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │ 🏷️ LAUNCH GATE SCAN CONFIGURATION           │            │
│  ├─────────────────────────────────────────────┤            │
│  │                                              │            │
│  │  Target URL: [__________________]           │            │
│  │                                              │            │
│  │  Scan Mode: ○ Quick  ● Standard  ○ Deep     │            │
│  │                                              │            │
│  │  ┌──────────────────────────────┐          │            │
│  │  │ 🖥️ TERMINAL SAMPLE OUTPUT     │          │            │
│  │  │ ● ● ●                        │          │            │
│  │  │                              │          │            │
│  │  │ Launch Readiness: 72/100    │          │            │
│  │  │ Coverage: 91%               │          │            │
│  │  │                              │          │            │
│  │  │ Top Fixes:                  │          │            │
│  │  │ 1. Add OG image             │          │            │
│  │  │ 2. Add favicon              │          │            │
│  │  └──────────────────────────────┘          │            │
│  │                                              │            │
│  │  [START SCAN] ← Blood red (#8B1A1A)        │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                         ⬇️ CLICK START SCAN ⬇️

┌─────────────────────────────────────────────────────────────┐
│  PIPELINE PAGE (Active Scan)                                  │
│  Theme: LAUNCH CONSOLE (Graphite Ops)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Background: Graphite (#1C2029) + coord grid + scanlines     │
│  Typography: Cream (#EDE8DC) monospace                       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ● SYSTEM ACTIVE    23:45:12    🏷️ LAUNCH GATE        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Target: https://example.com█                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ID: abc123 | MODE: Standard | ▓▓▓▓░ 80% | 12 pgs | ... ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  PIPELINE STAGES:                                             │
│  ┌───────────────────────────────┐                          │
│  │ ✓ Target Analysis    DONE     │  [Evidence stream...]   │
│  │ ◉ Page Discovery     RUNNING  │  > Crawling /about      │
│  │ ○ Link Checker       PENDING  │  > Found 23 links       │
│  │ ○ SEO Validation     PENDING  │                         │
│  └───────────────────────────────┘                          │
│                                                               │
│  [Scan sweep animation moving down] 🌊                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                         ⬇️ SCAN COMPLETES ⬇️

┌─────────────────────────────────────────────────────────────┐
│  COMPLETION SUMMARY                                           │
│  Theme: LAUNCH CONSOLE (Dark Ops)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                  🏷️ MISSION COMPLETE                         │
│                                                               │
│                      ✓ SAFE TO SHARE                         │
│            Your site looks good! No critical...              │
│                                                               │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │ LAUNCH READINESS│  SCAN COVERAGE  │   CONFIDENCE    │   │
│  │                 │                 │                 │   │
│  │      85/100     │       91%       │      HIGH       │   │
│  │ Public launch   │ Checklist       │ Result          │   │
│  │ hygiene...      │ verified        │ reliability     │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Target: https://example.com                           │  │
│  │ Mode: LAUNCH CHECK | Fit: IDEAL | Duration: 3.2s     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚠️ SCOPE NOTE: LaunchScan checks launch hygiene...         │
│                                                               │
│  [OPEN FULL REPORT] ← Emerald green                         │
│  [SCAN ANOTHER SITE]                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                      ⬇️ CLICK OPEN REPORT ⬇️

┌─────────────────────────────────────────────────────────────┐
│  REPORT PAGE (/dashboard/reports/pipeline-result)            │
│  Theme: LAUNCH CONSOLE (Dark Intel Briefing)                │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [L] LaunchScan        🏷️ LAUNCH REPORT   [NEW SCAN]  │  │
│  │                                                        │  │
│  │ https://example.com                                   │  │
│  │ Scanned Jan 1 • Standard Scan • 3.2s         [85]    │  │
│  │                                            Launch Score│  │
│  │────────────────────────────────────────────────────── │  │
│  │ OVERVIEW | PAGES | LINKS | ISSUES | SEO | ...        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ EXECUTIVE SUMMARY                                     │  │
│  │                                                        │  │
│  │ [LAUNCH READINESS: READY] Emerald badge              │  │
│  │                                                        │  │
│  │ LaunchScan scanned 12 pages and found 3 warnings.    │  │
│  │ No critical blockers. Most issues related to SEO...  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │ PAGES   │ LINKS   │ FORMS   │ DURATION│ ← Telemetry     │
│  │   12    │   47    │    3    │  3.2s   │   cells         │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SCORE BREAKDOWN                                       │  │
│  │                                                        │  │
│  │ Starting Score............................ +100       │  │
│  │ Critical Issues (0 × 15 points).......... +0         │  │
│  │ Warnings (3 × 4 points).................. -12        │  │
│  │ ─────────────────────────────────────────────         │  │
│  │ Final Launch Score........................ 85         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TOP 5 PRIORITY FIXES                                  │  │
│  │                                                        │  │
│  │ [WARNING] Missing meta description on /about         │  │
│  │ Improves search engine previews...                   │  │
│  │ Quick Fix: Add <meta name="description"...           │  │
│  │                                                        │  │
│  │ [WARNING] No sitemap.xml found                       │  │
│  │ ...                                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette Reference

### Launch Gate (Light/Cream)
- **Background**: `#EDE8DC` (cream) with paper grid
- **Text**: `#111111` (ink) with subtle shadow
- **Accent**: `#8B1A1A` (blood red) for CTAs
- **Cards**: `rgba(237, 232, 220, 0.85)` (translucent cream)
- **Borders**: `rgba(17, 17, 17, 0.12)` (subtle ink)

### Launch Console (Dark/Graphite)
- **Background**: `#1C2029` (graphite) with coord grid
- **Text Primary**: `#EDE8DC` (cream)
- **Text Secondary**: `rgba(237, 232, 220, 0.62)`
- **Text Tertiary**: `rgba(237, 232, 220, 0.38)`
- **Success**: `#4ade80` (emerald-400)
- **Warning**: `#fbbf24` (amber-400)
- **Error**: `#f87171` (red-400)
- **Cards**: `rgba(28, 32, 41, 0.97)` (dark translucent)

## Visual Effects Active

### Light Theme (Config)
- ✓ Film grain overlay
- ✓ Paper grid pattern
- ✓ Subtle card shadows
- ✓ Text shadow on headlines
- ✓ Terminal window with macOS dots (dark module)

### Dark Theme (Pipeline/Reports)
- ✓ Scanline overlay (horizontal lines)
- ✓ Scan sweep animation (vertical moving line)
- ✓ Terminal cursor blink
- ✓ Signal dot pulse animations
- ✓ Coord grid pattern
- ✓ Progress bar gradient (terminal green → emerald)
- ✓ Telemetry cell borders glow on active

## Typography Styles

### Launch Gate
```css
font-family: 'Geist Sans'
Headlines: ink color + text-shadow
Body: ink 80% opacity
Labels: Geist Mono, uppercase, bordered
```

### Launch Console
```css
font-family: 'Geist Mono' (headers), 'Geist Sans' (body)
Headers: UPPERCASE, tracking-wide
Data/Metrics: Monospace, tabular-nums
Colors: cream with opacity variants
```

## Animation Timings
- Scanlines: Static overlay, 2px height, 4px spacing
- Scan sweep: 4s linear loop, vertical movement
- Cursor blink: 1s steps, on/off
- Signal pulse: Variable (2s active, 1.5s warn, 0.8s critical)
- Transitions: 150ms cubic-bezier for colors, 200ms for interactive elements

## Responsive Behavior
- Grid patterns scale with viewport
- Cards stack vertically on mobile
- Telemetry cells become 2-column on tablet, 4-column on desktop
- Terminal window stays readable at all sizes
- Scanline overlay adjusts to container height

---

**Visual Identity Summary**:
- **Config**: Clean, professional, receipt-like with subtle vintage warmth
- **Pipeline**: High-tech ops console with military/aerospace aesthetics
- **Reports**: Professional intelligence briefing with clear data hierarchy

The dual-theme creates a clear mental model: "planning" (light) → "execution" (dark ops) → "analysis" (dark intel).
