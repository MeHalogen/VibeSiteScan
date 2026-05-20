# Pipeline-Based Scan UI

## Overview

This is a complete UI/UX refactor of the LaunchScan scanner interface into a **next-generation pipeline-based forensic website scanner** with animated transitions, transparent step-by-step execution, and interactive scan stages.

## Features

### 🎯 3-State Experience

1. **Configure Scan** - Clean form with scan mode cards and advanced options
2. **Live Pipeline Execution** - Real-time visual progress through 11 stages
3. **Scan Complete Summary** - Results dashboard with actionable insights

### 🎨 Visual Design

- **Dark-first UI** with deep navy/black background
- **Glassmorphism cards** with backdrop blur
- **Cyan/blue accent colors** with subtle gradients
- **Glowing borders** and animated progress indicators
- **Terminal-style logs** with color-coded severity
- **Smooth Framer Motion transitions** between states

### ⚡ Pipeline Stages

11 forensic audit stages with real-time status:

1. **INIT** - Initialize protocol
2. **FETCH** - Fetch homepage
3. **DISCOVER** - Discover pages
4. **CRAWL** - Crawl internal pages
5. **LINKS** - Verify links
6. **SEO** - Analyze SEO metadata
7. **SOCIAL** - Analyze social previews
8. **FORMS** - Inspect forms
9. **BROWSER** - Browser diagnostics
10. **SCORE** - Calculate launch score
11. **REPORT** - Generate report

Each stage shows:
- Status (pending/running/completed/warning/failed/skipped)
- Animated ring pulse when running
- Status-specific icon and colors
- Clickable to view details in inspector panel

### 📊 Interactive Features

- **Stage Inspector Panel** - Click any stage to view:
  - What the stage checks
  - Real-time metrics
  - Timing information
  - Evidence collected

- **Evidence Stream** - Terminal-style log with:
  - Timestamped progress updates
  - Color-coded severity levels
  - Pause/resume auto-scroll
  - Copy all logs
  - Expand/collapse

- **Scan Modes** - Three beautifully designed cards:
  - **Quick Scan** - Homepage only (5-10s)
  - **Standard Scan** - Up to 25 pages (15-45s) ← Default
  - **Deep Scan** - Locked PRO feature

### 🎭 Smooth Transitions

Powered by Framer Motion:
- Config → Pipeline morphs seamlessly
- Stage nodes animate sequentially
- Inspector content crossfades
- Logs slide up as they appear
- Pipeline → Summary morphs on completion
- Spring physics for natural feel

## File Structure

```
app/components/scan/
├── ScanInitializer.tsx         # Main state machine wrapper
├── ScanConfigPanel.tsx         # URL input & scan mode selector
├── PipelineView.tsx            # Main pipeline layout
├── PipelineStageNode.tsx       # Individual stage visualization
├── PipelineConnector.tsx       # Animated connector lines
├── StageInspector.tsx          # Right-side details panel
├── EvidenceStream.tsx          # Terminal logs
└── ScanCompleteSummary.tsx     # Final results dashboard

lib/scan-pipeline/
├── types.ts                    # TypeScript types
└── orchestrator.ts             # Pipeline progression logic
```

## How It Works

### 1. Configuration Phase
User enters URL and selects scan mode. Advanced options are collapsible. Real-time URL validation with helpful feedback.

### 2. Pipeline Execution
When user clicks "Initialize Scan":
1. Form morphs into pipeline dashboard
2. `PipelineOrchestrator` starts visual progression
3. Actual scan API call runs in parallel
4. Stages transition: pending → running → completed/warning/skipped
5. Logs stream in terminal
6. Inspector updates with metrics
7. User can click stages to inspect details

### 3. Completion
When scan finishes:
1. Final result data maps to stage metrics
2. Dashboard morphs to summary view
3. Shows:
   - Launch score with gradient styling
   - Readiness status (READY/NEEDS_FIXES/NOT_READY)
   - Metric cards (pages, issues, warnings, duration)
   - Top 3 priority fixes
   - Action buttons (Open Report, Copy Link, New Scan)
4. Pipeline remains visible in collapsed form

### Stage-to-Result Mapping

The orchestrator intelligently maps real scan results to visual stages:

```typescript
// Example: Links stage
const brokenLinks = result.broken_internal_links_count + result.broken_external_links_count;
stage.status = brokenLinks > 0 ? "warning" : "completed";
stage.metrics = {
  internalLinksCount: result.internal_links_count,
  brokenInternalLinksCount: result.broken_internal_links_count,
  // ... more metrics
};
```

## Usage

### Option 1: Replace Existing Page

Update `/app/dashboard/new-scan/page.tsx`:

```typescript
import { ScanInitializer } from "@/app/components/scan/ScanInitializer";

export default function NewScanPage() {
  return <ScanInitializer />;
}
```

### Option 2: New Route (Current)

Visit: **`/dashboard/new-scan-pipeline`**

This preserves the legacy UI at `/dashboard/new-scan`.

## Technical Details

### State Management

Clean state machine with typed phases:

```typescript
type ScanPhase = "config" | "running" | "complete" | "error";
type StageStatus = "pending" | "running" | "completed" | "warning" | "failed" | "skipped";
```

### Animation Performance

- Uses `layoutId` for morph transitions
- `AnimatePresence` for mount/unmount
- Spring physics for natural movement
- Optimized with `will-change` CSS

### Responsive Design

- **Desktop**: 3-column command center (pipeline + inspector + logs)
- **Tablet**: Stacked pipeline → inspector → logs
- **Mobile**: Vertical stepper with expandable inspector

## API Integration

Works with existing `/api/scan/demo` endpoint:

```typescript
const response = await fetch("/api/scan/demo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: config.targetUrl,
    scanDepth: config.scanMode === "quick" ? "quick" : "standard",
  }),
});
```

The orchestrator handles:
- Visual progression during API call
- Mapping response to stage metrics
- Error handling and failed states
- Graceful degradation if backend is slow

## Customization

### Change Colors

Edit `app/components/scan/PipelineStageNode.tsx`:

```typescript
const statusConfig = {
  running: {
    bg: "bg-cyan-500/10",      // Change cyan to your color
    border: "border-cyan-500/50",
    text: "text-cyan-400",
    // ...
  },
  // ... other states
};
```

### Add/Remove Stages

Edit `lib/scan-pipeline/types.ts`:

```typescript
export const PIPELINE_STAGES = [
  // Add your custom stage
  {
    id: "custom",
    label: "Custom Stage",
    shortLabel: "CUSTOM",
    description: "Does something custom",
    icon: "Sparkles",
  },
  // ...
];
```

Then update `orchestrator.ts` to map result data to your stage.

### Change Timing

Edit `lib/scan-pipeline/orchestrator.ts`:

```typescript
const stageTimings = [
  { id: "init", duration: 500 },  // Increase for slower progression
  { id: "fetch", duration: 1200 },
  // ...
];
```

## Limitations (Transparent)

The UI is honest about limitations:

- Browser checks may be skipped (shows "SKIPPED" status)
- Deep Scan is locked with upgrade CTA
- Forms detected but not submitted
- Login-protected pages excluded

All communicated clearly with tooltips and helper text.

## Error Handling

Graceful error states:

- Shows which stage failed
- Displays error message
- Offers "Retry" and "Configure New Scan" buttons
- Marks remaining stages as "skipped"

## Performance

- Lazy loads report components
- Debounced URL validation
- Memoized stage renders
- Virtual scrolling for large log lists (if needed)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (some backdrop-blur limitations)
- Mobile: ✅ Responsive

## Future Enhancements

- [ ] WebSocket for real-time backend stage updates
- [ ] Screenshot thumbnails in stage inspector
- [ ] Downloadable pipeline visualization
- [ ] Keyboard shortcuts (press number to jump to stage)
- [ ] Dark/light mode toggle
- [ ] Custom branding colors
- [ ] Export pipeline timeline as PDF

## Credits

Design inspiration:
- Vercel deployment pipeline
- Linear command center
- Raycast futuristic utility
- Modern developer SaaS products

Built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

---

**Status**: ✅ Production Ready

**Test URL**: http://localhost:3000/dashboard/new-scan-pipeline

**Legacy URL**: http://localhost:3000/dashboard/new-scan (preserved)
