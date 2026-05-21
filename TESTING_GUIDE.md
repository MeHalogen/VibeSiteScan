# 🧪 Testing Guide: Dual-Theme System

## Quick Test Procedure

### 1. Start Development Server
```bash
cd /Users/mehalsrivastava/GitHub/VibeSiteScan
npm run dev
```

### 2. Navigate to Pipeline Config
```
http://localhost:3000/dashboard/new-scan-pipeline
```

**Expected Appearance**:
- ✅ Cream background (#EDE8DC)
- ✅ Paper grid pattern (subtle lines)
- ✅ Ink (#111111) text with slight shadow on headlines
- ✅ Blood-red (#8B1A1A) "Start Scan" button
- ✅ Intel panel cards (translucent cream with shadow)
- ✅ Terminal window sample (dark module with macOS dots)
- ✅ Film grain overlay across entire page

### 3. Enter Test Data and Start Scan
```
Target URL: https://example.com
Scan Mode: Standard
Click: [Start Scan]
```

**Expected Transition**:
- ✅ Background changes to graphite (#1C2029)
- ✅ Coord grid pattern appears (darker)
- ✅ Scanline overlay visible (horizontal lines)
- ✅ Scan sweep animation begins (vertical moving line)

### 4. Observe Active Pipeline
**Top Bar Should Show**:
- ✅ "● SYSTEM ACTIVE" in emerald-400
- ✅ Live timestamp (updating)
- ✅ "LAUNCH GATE" classified stamp (red, rotated)

**Target URL Should Show**:
- ✅ URL in monospace font
- ✅ Blinking terminal cursor (█) at end

**Telemetry Strip Should Show**:
- ✅ Multiple metric cells with borders
- ✅ Monospace font for all data
- ✅ Active cells have green glow

**Pipeline Modules**:
- ✅ Dark panel (intel-panel-dark) per stage
- ✅ Status indicators (✓ done, ◉ running, ○ pending)
- ✅ Evidence stream in terminal font
- ✅ Real-time updates as scan progresses

### 5. Wait for Completion (or Stop Early)
**Expected Completion Screen**:
- ✅ Dark console theme maintained
- ✅ "MISSION COMPLETE" stamp at top
- ✅ Large centered status icon
- ✅ Status badge: "SAFE TO SHARE", "FIX BEFORE SHARING", or "DO NOT SHIP YET"
- ✅ Three telemetry cards:
  - Launch Readiness (emerald)
  - Scan Coverage (blue)
  - Confidence (purple)
- ✅ Scan details panel (monospace labels)
- ✅ Amber warning box for scope note
- ✅ "OPEN FULL REPORT" button (emerald, uppercase)
- ✅ "SCAN ANOTHER SITE" button (dark panel style, uppercase)

### 6. Click "OPEN FULL REPORT"
```
Should navigate to: /dashboard/reports/pipeline-result?scanId=...
```

**Expected Report Page**:
- ✅ Dark console theme continues
- ✅ Top header: dark panel with border
- ✅ "LAUNCH REPORT" classified stamp
- ✅ VibeSiteScan logo with emerald accent
- ✅ Target URL and metadata in cream text
- ✅ Score badge in telemetry cell (dark with border)
- ✅ Tab navigation (emerald-400 for active)
- ✅ All tabs properly themed:

**Overview Tab**:
- ✅ "EXECUTIVE SUMMARY" uppercase mono header
- ✅ Readiness status badge
- ✅ Grid of telemetry metric cards
- ✅ "SCORE BREAKDOWN" section
- ✅ "TOP 5 PRIORITY FIXES" section with bordered severity badges

**Other Tabs**:
- ✅ Each uses intel-panel-dark
- ✅ Uppercase monospace headers
- ✅ Consistent cream text colors

### 7. Test Error State (Optional)
To trigger an error:
- Enter invalid URL or
- Network disconnect during scan

**Expected Error Screen**:
- ✅ Dark console theme
- ✅ "MISSION ABORT" stamp (red)
- ✅ Red XCircle icon
- ✅ "SCAN FAILED" in red, uppercase mono
- ✅ Error details in dark panel with red border
- ✅ "RETRY SCAN" button (emerald)
- ✅ "CONFIGURE NEW SCAN" button (dark panel)

## Visual Regression Checklist

### Config Page (Light Theme)
- [ ] Background is cream, not white
- [ ] Grid pattern is visible but subtle
- [ ] Headlines have slight text shadow
- [ ] Start button is blood red
- [ ] Terminal sample has macOS dots (red, yellow, green)
- [ ] Cards have subtle shadow
- [ ] Film grain overlay is present
- [ ] No dark theme elements visible

### Pipeline (Dark Theme)
- [ ] Background is graphite, not black
- [ ] Coord grid visible
- [ ] Scanlines are present (horizontal lines)
- [ ] Scan sweep animates down (4s loop)
- [ ] Text is cream (#EDE8DC), not white
- [ ] Terminal cursor blinks
- [ ] Top bar shows live clock
- [ ] Classified stamp is visible and rotated
- [ ] Progress bars use emerald gradient
- [ ] Signal dots pulse when active
- [ ] No light theme elements remain

### Completion Summary (Dark Theme)
- [ ] "MISSION COMPLETE" stamp visible
- [ ] All text uppercase where appropriate
- [ ] Telemetry cards have proper styling
- [ ] Monospace font on metrics and labels
- [ ] Scope note has amber border
- [ ] Buttons are properly styled
- [ ] Background maintains graphite
- [ ] Scanline overlay still visible

### Report Page (Dark Theme)
- [ ] Header is dark panel
- [ ] "LAUNCH REPORT" stamp present
- [ ] Tab underlines use emerald-400
- [ ] All content panels are intel-panel-dark
- [ ] Headers are uppercase monospace
- [ ] Metric cards use telemetry-cell style
- [ ] No light theme leakage
- [ ] Scrollbar matches theme (dark track, cream thumb)

## Browser Testing

### Desktop
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile
- [ ] iOS Safari
- [ ] Chrome Android

### Things to Check
- [ ] Grid patterns render correctly
- [ ] Scanlines don't cause performance issues
- [ ] Animations are smooth (60fps)
- [ ] Text is readable at all sizes
- [ ] Buttons are tapable/clickable
- [ ] Cards stack properly on narrow screens
- [ ] Film grain doesn't obscure content

## Accessibility Testing

- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Focus indicators visible (blood for light, emerald for dark)
- [ ] Keyboard navigation works
- [ ] Screen reader announces status changes
- [ ] Animation respects prefers-reduced-motion
- [ ] Monospace improves readability for data

## Performance Testing

### Metrics to Check
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 300ms

### Visual Effects Impact
- [ ] Film grain doesn't slow rendering
- [ ] Scanlines don't cause jank
- [ ] Scan sweep animation is smooth
- [ ] Terminal cursor blink doesn't flicker

## Known Limitations

1. **Film Grain**: SVG-based, may appear different in Safari vs Chrome
2. **Scanlines**: Subtle effect, may not be visible on all displays
3. **Monospace Font**: Fallback to system monospace if Geist Mono fails to load
4. **Grid Pattern**: May appear aliased on non-retina displays
5. **Cursor Blink**: Uses CSS animation, timing may vary slightly

## Debugging Tips

### If Theme Doesn't Switch
1. Check ScanInitializer's `scanPhase` state
2. Verify `.launch-gate` or `.launch-console` class is applied
3. Check browser console for CSS errors
4. Clear browser cache and reload

### If Colors Are Wrong
1. Check CSS variables in :root
2. Verify no inline styles override theme
3. Check for dark mode media query interference
4. Inspect computed styles in DevTools

### If Animations Don't Work
1. Check browser supports CSS animations
2. Verify prefers-reduced-motion isn't set
3. Check for conflicting animation classes
4. Inspect keyframe definitions in globals.css

### If Text Is Unreadable
1. Check contrast ratios in DevTools
2. Verify correct text-primary/secondary/tertiary classes
3. Check font weights are appropriate
4. Test at different zoom levels

## Success Criteria

✅ **Theme Switch Works**: Config → Pipeline → Report maintains correct theme
✅ **Visual Consistency**: All components follow design system
✅ **No Errors**: Console is clean, no 404s or warnings
✅ **Smooth Animations**: No jank or stuttering
✅ **Readable Content**: All text meets contrast requirements
✅ **Responsive**: Works on mobile, tablet, desktop
✅ **Accessible**: Keyboard nav, screen readers, focus indicators

## Reporting Issues

If you find any issues, document:
1. **Page/Component**: Where the issue occurs
2. **Expected**: What should happen
3. **Actual**: What actually happens
4. **Browser**: Name and version
5. **Screenshot**: If visual issue
6. **Steps**: How to reproduce

---

**Happy Testing!** 🚀

The dual-theme system should create a delightful transition from planning (cream receipt) to execution (dark ops console). Every detail matters for the premium feel!
