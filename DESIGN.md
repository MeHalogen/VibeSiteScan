# VibeSiteScan Design System

## 🎨 Visual Identity

**Theme**: Terminal / Cyberpunk / Developer Console  
**Vibe**: Forensic Analysis Tool, Professional Scanner, Matrix-inspired

## Color Palette

### Primary Colors
- **Cyan/Blue Accent**: `#06b6d4` (cyan-500) to `#2563eb` (blue-600)
- **Background Dark**: `#0a0e1a` (deep navy black)
- **Card Background**: `#151b2b` (slightly lighter navy)
- **Border Color**: `#1e293b` (slate-800)

### Status Colors
- **Success/Ready**: `#00ff88` (bright green with glow)
- **Warning**: `#ffaa00` (amber)
- **Critical/Error**: `#ff3366` (red)
- **Info**: `#06b6d4` (cyan)

### Text Colors
- **Primary**: `#e0e7ff` (light lavender-white)
- **Secondary**: `#94a3b8` (slate-400)
- **Muted**: `#64748b` (slate-500)
- **Accent**: `#22d3ee` (cyan-400)

## Typography

### Fonts
- **Primary**: JetBrains Mono (monospace) - for terminal aesthetic
- **Fallback**: Fira Code, Monaco, Consolas, monospace

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Text Styles
- All text uses UPPERCASE for labels and headers
- Tracking: wider letter spacing for headers
- Code/URLs: cyan-400 color with font-mono

## Components

### Headers
- Sticky top navigation
- Gradient logo icon (cyan to blue)
- Lambda (λ) symbol for brand
- "FORENSIC_AUDIT_v2.0" subtitle

### Tabs
- Pill-shaped buttons
- Active state: gradient background + border glow
- Icon prefixes (◉, ▣, ⚡, ⚠, etc.)
- Badge counts on each tab

### Cards
- Dark background with subtle border
- Hover state: border glow (cyan)
- Rounded corners (8px)
- Inner shadow for depth

### Buttons
- Primary: Gradient cyan to blue with glow
- Hover: increased glow intensity
- Disabled: slate gradient
- All UPPERCASE text

### Tables
- Zebra striping on hover only
- Monospace font for URLs and codes
- Color-coded status badges
- Truncate long text with tooltips

### Badges/Status
- Small pills with border
- Background: 10-20% opacity of status color
- Border: 30-50% opacity of status color
- Uppercase text

### Modals
- Full-screen overlay with blur
- Centered card with glow border
- Sticky header with close button
- Scrollable content area

## Icons & Symbols

Terminal-style icons used throughout:
- `█` Block/solid
- `◉` Circle/target
- `▣` Square/grid
- `⚡` Lightning/fast
- `⚠` Warning
- `◈` Diamond/important
- `♦` Small diamond
- `▤` Form/input
- `▶` Play/console
- `✓` Check/passed
- `↻` Refresh/cycle
- `◎` Coverage/scope
- `→` Arrow/action
- `●` Bullet point

## Layout

### Container
- Max width: 1800px
- Padding: 24px (6 Tailwind units)
- Responsive breakpoints: md (768px), lg (1024px), xl (1280px)

### Spacing
- Sections: 24px gap (6 units)
- Cards: 16px gap (4 units)
- Elements: 12px gap (3 units)
- Tight: 8px gap (2 units)

### Grid
- 2 columns on mobile
- 4 columns on tablet
- 6-8 columns on desktop
- Auto-fit for metric cards

## Animations

### Transitions
- All: 200-300ms ease
- Hover: scale(1.02) + glow increase
- Loading: spin animation for icons
- Fast Refresh: fade in/out

### Shadows
- Cards: `shadow-2xl shadow-black/50`
- Buttons: `shadow-lg shadow-cyan-500/20`
- Hover: `shadow-cyan-500/40`
- Glow effect: `text-shadow: 0 0 20px {color}80`

## Special Effects

### Glow
- Score numbers: text-shadow with color + 80% opacity
- Buttons: box-shadow with accent color
- Borders: gradient borders on active states

### Gradients
- Buttons: `from-cyan-500 to-blue-600`
- Icons: `from-cyan-500 to-blue-600`
- Subtle backgrounds: 20% opacity overlays

### Border States
- Default: `border-[#1e293b]`
- Hover: `border-cyan-500/30`
- Active: `border-cyan-500/50` + 2px width
- Focus: `ring-2 ring-cyan-500/50`

## Accessibility

- All interactive elements have focus states
- Color contrast meets WCAG AA standards
- Keyboard navigation supported
- Screen reader labels on icons
- Skip to content links (future)

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Horizontal scroll for tables
- Collapsed navigation
- Stacked cards

### Tablet (768px - 1024px)
- 2 column grid
- Visible navigation
- Side-by-side cards

### Desktop (> 1024px)
- Full 12 column grid
- Sticky headers
- Expanded tables
- Multi-column layouts

## Code Examples

### Card Component
```tsx
<div className="bg-[#151b2b] border border-[#1e293b] rounded-lg p-6 hover:border-cyan-500/30 transition-all">
  <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
    <span>◉</span> SECTION_TITLE
  </h2>
  <div className="text-slate-300">Content</div>
</div>
```

### Button
```tsx
<button className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded border border-cyan-400/30 hover:border-cyan-400/60 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 uppercase tracking-wider">
  → ACTION_TEXT
</button>
```

### Badge
```tsx
<span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 text-xs font-bold uppercase">
  LABEL
</span>
```

## Future Enhancements

- [ ] Dark/light mode toggle (currently dark only)
- [ ] Custom color themes (matrix green, hacker red, etc.)
- [ ] Animated scan progress bars
- [ ] Chart.js integration for visualizations
- [ ] Export branded PDF reports
- [ ] White-label customization
- [ ] Animated terminal typing effects
- [ ] Sound effects for scan completion (optional)
