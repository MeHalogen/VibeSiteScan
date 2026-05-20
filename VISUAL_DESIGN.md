# Pipeline UI - Visual Design Reference

## Color Palette

### Base Colors
- **Background**: `#050812` (Deep navy-black)
- **Cards**: `slate-900/70` (Glassmorphic slate with 70% opacity)
- **Borders**: `cyan-400/10` (Subtle cyan glow at 10%)

### Accent Colors
- **Primary**: `cyan-500` → `blue-600` (Gradient)
- **Success**: `green-400` (Completed states)
- **Warning**: `amber-400` (Warning states)
- **Error**: `red-400` (Failed states)
- **Neutral**: `slate-400` (Pending/info)

### Status Colors
```css
pending: bg-slate-800/50, border-slate-700, text-slate-500
running: bg-cyan-500/10, border-cyan-500/50, text-cyan-400 + animated ring
completed: bg-green-500/10, border-green-500/50, text-green-400
warning: bg-amber-500/10, border-amber-500/50, text-amber-400
failed: bg-red-500/10, border-red-500/50, text-red-400
skipped: bg-slate-800/30, border-slate-700/50, text-slate-600
```

## Typography

### Font Stack
- **Primary**: Inter (sans-serif) - body text, labels, buttons
- **Monospace**: JetBrains Mono - URLs, logs, technical content

### Hierarchy
```
Page Title: text-5xl font-bold text-white (48px)
Section Title: text-4xl font-bold text-white (36px)
Card Title: text-2xl font-bold text-white (24px)
Labels: text-sm font-bold uppercase tracking-wider (12px)
Body: text-slate-300 text-sm (14px)
Small: text-xs text-slate-500 (11px)
Logs: text-xs font-mono (11px monospace)
```

## Layout Structure

### State 1: Configure
```
┌─────────────────────────────────────────────────────┐
│              INITIALIZE_SCAN (Title)                │
│        Deploy forensic website audit protocol       │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────┐ ┌──────────────────┐
│ Configuration Panel (L)      │ │ Capabilities (R)│
│                              │ │                 │
│ TARGET_URL //                │ │ SCAN_CAPABILITIES│
│ [input: large monospace]     │ │                 │
│                              │ │ • HTTP status   │
│ SCAN_MODE //                 │ │ • SEO metadata  │
│ ┌────┐ ┌────┐ ┌────┐        │ │ • Links        │
│ │QUICK│STAND│DEEP│        │ │ • Social tags  │
│ └────┘ └────┘ └────┘        │ │ • Forms        │
│                              │ │ • Robots.txt   │
│ > Advanced Options           │ │ • Coverage     │
│                              │ │                 │
│ [Initialize Scan Button]     │ │ [Helper text]   │
└──────────────────────────────┘ └──────────────────┘
```

### State 2: Pipeline Running
```
┌─────────────────────────────────────────────────────────────┐
│ SCAN_PIPELINE_ACTIVE                                        │
│ Target: example.com | Mode: STANDARD | ID: scan_123 | 12s  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐ ┌────────────────────┐
│ PIPELINE_STAGES (Left)           │ │ Inspector (Right) │
│                                  │ │                   │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │ │ Stage: FETCH      │
│ │ ✓││ ✓││⟳ ││⋯ ││⋯ ││⋯ │  │ │                   │
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │ │ Status: RUNNING   │
│ INIT FETCH DISC CRAWL LINKS SEO │ │                   │
│                                  │ │ Metrics:          │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │ │ • Status: 200     │
│ │⋯ ││⋯ ││⋯ ││⋯ ││⋯ │       │ │ • Time: 245ms     │
│ └──┘ └──┘ └──┘ └──┘ └──┘       │ │ • Type: text/html │
│ SOCIAL FORMS BROWSER SCORE REPORT│ │                   │
└──────────────────────────────────┘ └────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ EVIDENCE_STREAM (Bottom)                                  │
│ [00:01] Protocol initialized                              │
│ [00:02] Homepage fetched: 200 OK                          │
│ [00:03] Discovered 18 internal links                      │
│ [00:05] Scanning /about...                                │
│ [...auto-scrolling logs...]                               │
└──────────────────────────────────────────────────────────┘
```

### State 3: Complete Summary
```
┌─────────────────────────────────────────────────────┐
│                   ✓ (Icon)                          │
│              SCAN_COMPLETE (Title)                  │
│        Forensic audit report generated.             │
└─────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌─────────────────────────┐
│      82               │ │    READY                │
│  (huge gradient)      │ │  (status badge)         │
│  Launch Score         │ │  Site is ready for      │
└──────────────────────┘ └─────────────────────────┘

┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 7  │ │ 2  │ │ 5  │ │15s │
│Pages││Crit││Warn││Time│
└────┘ └────┘ └────┘ └────┘

┌─────────────────────────────────────────────────┐
│ Top Priority Fixes:                             │
│ ⚠ Missing meta description on 3 pages          │
│ ⚠ Missing og:image on homepage                 │
│ ⚠ Broken external link: /old-blog              │
└─────────────────────────────────────────────────┘

[Open Full Report] [Copy Share Link] [Run Another]
```

## Component Styling

### Stage Node (Default)
```
┌─────────────────┐
│   ┌─────────┐   │  ← Outer border (2px)
│   │  [Icon] │   │  ← Icon container (48x48)
│   │   ●     │   │  ← Status indicator (top-right)
│   └─────────┘   │
│      INIT       │  ← Label (uppercase)
└─────────────────┘
Size: ~100x120px
Padding: 16px
Border-radius: 12px
```

### Stage Node (Running)
```
┌━━━━━━━━━━━━━━━━━┐ ← Animated cyan glow ring
┃   ┌─────────┐   ┃
┃   │ [Globe] │   ┃ ← Cyan colored icon
┃   │   ⟳     │   ┃ ← Spinning loader
┃   └─────────┘   ┃
┃     FETCH       ┃ ← Cyan text
┗━━━━━━━━━━━━━━━━━┛
Background pulse: opacity [0.5→0.8→0.5] (2s loop)
```

### Connector Line
```
[Stage A] ────────── [Stage B]
          ▓░░░░░░░░  ← Shimmer effect (animated)
          
Inactive: slate-700 (1px)
Active: cyan-500/50 (2px)
Animating: gradient shimmer left→right
```

### Inspector Panel
```
┌─────────────────────────────────────┐
│ Fetch Homepage               RUNNING│ ← Header
├─────────────────────────────────────┤
│ Request target URL, capture status  │ ← Description
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Started: 12:34:56 PM           │ │ ← Timing card
│ └─────────────────────────────────┘ │
│                                     │
│ Metrics Collected:                  │
│ ┌─────────────────────────────────┐ │
│ │ Status Code         200        │ │
│ │ Response Time       245ms      │ │
│ │ Content Type        text/html  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Evidence Stream
```
┌─────────────────────────────────────────────────┐
│ EVIDENCE_STREAM    [120 logs]   [⏸][📋][▼]    │ ← Header
├─────────────────────────────────────────────────┤
│ [12:34:56] Protocol initialized                 │ ← Cyan (info)
│ [12:34:57] Homepage fetched: 200 OK            │ ← Green (success)
│ [12:34:58] Missing meta description            │ ← Amber (warning)
│ [12:34:59] External link timeout               │ ← Red (error)
│ ...auto-scroll...                               │
└─────────────────────────────────────────────────┘
Font: JetBrains Mono 11px
Background: slate-950/50
Max-height: 256px
```

## Animations

### Morph Transitions
```
Config Panel → Pipeline View
├─ Opacity: 1 → 0 → 1
├─ Scale: 1 → 0.95 → 1
├─ Duration: 500ms
└─ Easing: spring

Running → Complete
├─ Layout shift with layoutId
├─ Cards morph positions
├─ Duration: 600ms
└─ Easing: anticipate
```

### Stage Node Sequence
```
Stage 1: delay 0ms
Stage 2: delay 50ms
Stage 3: delay 100ms
...
Stage 11: delay 500ms

Each: opacity 0→1, scale 0.8→1
Duration: 300ms
Easing: ease-out
```

### Running Pulse
```
Background glow:
├─ Opacity: [0.5, 0.8, 0.5]
├─ Duration: 2000ms
├─ Repeat: Infinity
└─ Easing: easeInOut

Ring animation:
├─ Border glow
├─ Rotate icon (if spinner)
└─ Subtle scale [1, 1.02, 1]
```

### Connector Shimmer
```
Gradient position:
├─ X: [-40px, +40px]
├─ Duration: 1500ms
├─ Repeat: Infinity
└─ Easing: linear

Gradient: transparent → cyan-400 → transparent
Width: 32px
```

## Responsive Breakpoints

### Desktop (1920px+)
```
┌───────────────────────────────────────┐
│ Header (full width)                   │
├────────────────────┬──────────────────┤
│ Pipeline (2/3)     │ Inspector (1/3)  │
│                    │                  │
├────────────────────┴──────────────────┤
│ Evidence Stream (full width)          │
└───────────────────────────────────────┘
```

### Laptop (1280px)
```
┌───────────────────────────────────────┐
│ Header                                │
├──────────────────┬────────────────────┤
│ Pipeline (60%)   │ Inspector (40%)    │
├──────────────────┴────────────────────┤
│ Evidence Stream                        │
└───────────────────────────────────────┘
```

### Tablet (768px)
```
┌───────────────────────────────────────┐
│ Header                                │
├───────────────────────────────────────┤
│ Pipeline (full width, 2 cols)         │
├───────────────────────────────────────┤
│ Inspector (collapsible)               │
├───────────────────────────────────────┤
│ Evidence Stream (collapsed default)   │
└───────────────────────────────────────┘
```

### Mobile (375px)
```
┌──────────────────────┐
│ Header (compact)     │
├──────────────────────┤
│ ┌──┐                │
│ │✓ │ INIT          │
│ └──┘                │
│ ─────                │
│ ┌──┐                │
│ │⟳ │ FETCH (active)│
│ └──┘ [Tap to expand]│
│ ─────                │
│ ┌──┐                │
│ │⋯ │ DISCOVER       │
│ └──┘                │
├──────────────────────┤
│ [Evidence collapsed] │
└──────────────────────┘
```

## Glassmorphism Effect

```css
.glass-card {
  background: rgba(15, 23, 42, 0.7);  /* slate-900/70 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(34, 211, 238, 0.1);  /* cyan-400/10 */
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(6, 182, 212, 0.05);  /* cyan glow */
}
```

## Hover States

```css
.stage-node:hover {
  transform: scale(1.02);
  border-color: rgba(34, 211, 238, 0.3);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
}

.button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
}
```

## Accessibility

- All interactive elements have focus rings (cyan-500/50, 2px)
- Minimum contrast ratio 4.5:1 for text
- ARIA labels on icon-only buttons
- Keyboard navigation support
- Screen reader announcements for stage changes
- Motion can be reduced with `prefers-reduced-motion`

---

**Result**: A premium, futuristic, professional pipeline UI that feels like a next-generation developer tool while remaining accessible and performant.
