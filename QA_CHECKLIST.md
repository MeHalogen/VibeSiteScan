# VibeSiteScan - Full QA Checklist

**Date:** May 21, 2026
**Environment:** http://localhost:3002
**Build:** Development

---

## ✅ PHASE 1: HOMEPAGE QA

### Visual & Branding
- [ ] **Product Name:** "SITE PROOF" displayed prominently in hero
- [ ] **Badge:** "FINAL QA FOR AI-BUILT SITES" visible
- [ ] **Tagline:** "Proof your site before your audience sees it" present
- [ ] **Secondary tagline:** "Catch what AI missed before your audience does"
- [ ] **Dark ops console theme:** Background is dark with coord grid
- [ ] **Scanline overlay:** Visible scanline effect
- [ ] **Emerald accents:** Green/emerald colors for CTAs and highlights

### Hero Section
- [ ] **Hero animation:** Smooth fade-in and scale animations
- [ ] **Ticker animation:** Infinite scrolling ticker at top
- [ ] **Corner labels:** "STATUS: ONLINE", "SYS 1.0", "FINAL QA", "ACTIVE"
- [ ] **Divider line:** Animated horizontal line between title and description

### CTAs & Navigation
- [ ] **Primary CTA:** "Proof My Site →" button visible and styled emerald
- [ ] **Secondary CTA:** "View Sample Report" link visible
- [ ] **Primary CTA link:** Points to `/dashboard/new-scan-pipeline`
- [ ] **Hover states:** Both CTAs have hover effects

### Trust Elements
- [ ] **AI Builder pills:** Cursor · Lovable · Bolt · Replit · AI Fix Prompt
- [ ] **Feature pills:** Share Preview · Metadata · Links · Forms · Launch Basics

### Live Feeds
- [ ] **Left column:** "LIVE PROOFS" feed visible on desktop
- [ ] **Live feed signal:** Green active signal dot
- [ ] **Live feed content:** Proof logs with checkmarks and X marks
- [ ] **Live feed scroll:** Scrollable content with proper overflow
- [ ] **Proof counter:** "Sites proofed today: 2,XXX" incrementing

- [ ] **Right column:** "RECENT PROOFS" feed visible on desktop  
- [ ] **Recent feed signal:** Warning/yellow signal dot
- [ ] **Recent decisions:** Shows "READY TO SHARE", "FIX BEFORE SHARING", "DO NOT SHARE YET"
- [ ] **Top issues:** Shows "#1 — Missing OG images" etc.

### Responsiveness
- [ ] **Mobile view (375px):** Side columns hidden, center content readable
- [ ] **Tablet view (768px):** Layout adjusts properly
- [ ] **Desktop view (1440px+):** All three columns visible

### Typography
- [ ] **Monospace font:** Used consistently throughout
- [ ] **Uppercase tracking:** Proper letter-spacing on labels
- [ ] **Readable contrast:** Text has sufficient contrast against dark background

---

## ✅ PHASE 2: CONFIG PAGE QA

### Page Load
- [ ] **URL:** `/dashboard/new-scan-pipeline` accessible
- [ ] **Page title:** Contains "VibeSiteScan"
- [ ] **Layout:** Config form visible

### Form Elements
- [ ] **URL input:** Input field for website URL present
- [ ] **URL placeholder:** Shows example URL (e.g., "https://your-ai-built-site.com")
- [ ] **URL validation:** Accepts valid URLs
- [ ] **Scan mode selector:** Quick/Standard options (if present)

### Branding
- [ ] **Logo:** Shows "S" or "VibeSiteScan" branding
- [ ] **Page copy:** Uses "proof" language, not generic "scan"
- [ ] **Context:** Mentions AI builders or share-readiness

### Actions
- [ ] **Start button:** "Start Proof" or "Proof My Site" button visible
- [ ] **Button enabled:** Becomes clickable when URL is valid
- [ ] **Button styling:** Emerald/green with proper hover state

---

## ✅ PHASE 3: SCAN PIPELINE QA

### Pipeline Initialization
- [ ] **URL submission:** Form submits when clicking start button
- [ ] **Transition:** Smooth transition from config to pipeline view
- [ ] **Pipeline visible:** Pipeline stages appear

### Stage Display
- [ ] **Stage cards:** All stages visible (Init, Fetch, Discover, etc.)
- [ ] **Stage icons:** Each stage has appropriate icon
- [ ] **Stage labels:** Clear labels for each stage
- [ ] **Pending state:** Stages show as pending before execution

### Execution
- [ ] **Running state:** Active stage highlights with emerald color
- [ ] **Progress indicator:** Visual indication of current stage
- [ ] **Completion state:** Completed stages show checkmark/success
- [ ] **Timing:** Duration shown for each stage

### Stage Details
- [ ] **Metrics:** Stages show relevant metrics (pages found, links checked, etc.)
- [ ] **Messages:** Log messages appear in real-time
- [ ] **Expandable:** Stages can be selected for more details (if implemented)

### Error Handling
- [ ] **Failed stage:** Shows error state if stage fails
- [ ] **Error message:** Clear error message displayed
- [ ] **Recovery:** Option to retry or start new scan

---

## ✅ PHASE 4: COMPLETION SUMMARY QA

### Page Transition
- [ ] **Automatic transition:** Moves to completion summary after scan finishes
- [ ] **Animation:** Smooth fade-in of completion screen

### Header
- [ ] **Classification stamp:** "MISSION COMPLETE" or similar
- [ ] **Decision icon:** Appropriate icon for decision (checkmark, warning, X)
- [ ] **Status:** Shows scan completion status

### Decision Display
- [ ] **Decision badge:** "Ready to Share" / "Fix Before Sharing" / "Do Not Share Yet"
- [ ] **Decision color:** Emerald for ready, amber for fix, red for do not share
- [ ] **Decision message:** Clear explanation of what the decision means

### Metrics Cards
- [ ] **Telemetry cells:** 3 metric cards visible
- [ ] **Launch Readiness:** Shows score (but demoted, not hero)
- [ ] **Scan Coverage:** Shows percentage
- [ ] **Confidence:** Shows confidence level
- [ ] **Card styling:** Dark panels with proper borders

### Scan Info
- [ ] **Target URL:** Displayed prominently
- [ ] **Scan mode:** Quick/Standard shown
- [ ] **Duration:** Scan time displayed
- [ ] **Timestamp:** When scan was performed

### Actions
- [ ] **View Full Report button:** Present and styled emerald
- [ ] **Scan Another Site button:** Secondary option available
- [ ] **Button functionality:** Buttons navigate correctly

### Theme Consistency
- [ ] **Dark console theme:** Matches homepage aesthetic
- [ ] **Scanline overlay:** Present
- [ ] **Intel panels:** Used for metric cards
- [ ] **Monospace typography:** Consistent throughout

---

## ✅ PHASE 5: REPORT PAGE QA

### Page Load
- [ ] **Report accessible:** Can navigate to full report
- [ ] **URL structure:** `/dashboard/reports/pipeline-result?scanId=XXX`
- [ ] **Loading state:** Shows loading indicator while fetching

### Header
- [ ] **VibeSiteScan branding:** Logo and name present
- [ ] **Site URL:** Target site shown prominently
- [ ] **Scan metadata:** Date, time, scan mode displayed
- [ ] **Decision badge:** Decision shown in header
- [ ] **Score card:** Telemetry cell with score (supporting metric)

### Tabs
- [ ] **Tab bar:** Horizontal tabs visible
- [ ] **Active indicator:** Emerald underline on active tab
- [ ] **Tab labels:** Clear, concise labels
- [ ] **Tab counts:** Issue counts shown in badges
- [ ] **Tab icons:** Small icons/symbols for each tab

### Summary Tab
- [ ] **Decision card:** Large decision display with explanation
- [ ] **Metric grid:** 4 metric cards (Routes, Blockers, Needs Fix, Broken Links)
- [ ] **What we checked:** Grid of check categories
- [ ] **Score breakdown:** Shows how score was calculated
- [ ] **Next steps:** Conditional based on issues found

### Fix Before Shipping Tab (if implemented)
- [ ] **Grouped issues:** Issues organized by impact
- [ ] **Action cards:** Practical fix suggestions
- [ ] **AI fix prompt:** Copy button for prompt
- [ ] **Evidence:** Shows exact findings

### Other Tabs
- [ ] **Routes/Pages:** Shows all pages scanned
- [ ] **Links:** Link health report
- [ ] **Metadata:** SEO/OG tag report
- [ ] **Share Preview:** Social media preview checks
- [ ] **Forms:** Form detection and analysis
- [ ] **Browser:** Console errors if any
- [ ] **Ready Checks:** Passed checks listed

### Theme
- [ ] **Intel panels:** Dark panels for all sections
- [ ] **Telemetry cells:** For metric displays
- [ ] **Monospace font:** Throughout report
- [ ] **Emerald accents:** For success states and highlights
- [ ] **Proper borders:** Subtle white/10 borders

---

## ✅ PHASE 6: BRANDING CONSISTENCY

### Product Name
- [ ] **No "VibeSiteScan":** Old name not visible to users
- [ ] **"VibeSiteScan" used:** New name appears in appropriate places
- [ ] **Consistent capitalization:** "VibeSiteScan" or "SITE PROOF"

### Messaging
- [ ] **AI builder focus:** Mentions Cursor, Lovable, Bolt, Replit
- [ ] **"Proof" verb:** Uses "proof" instead of "scan" where appropriate
- [ ] **Share-readiness:** Emphasizes checking before sharing
- [ ] **AI fix prompt:** Mentioned as key feature

### Meta Tags
- [ ] **Page title:** "VibeSiteScan - Final QA for AI-Built Websites"
- [ ] **Description:** Mentions AI builders and fix prompts
- [ ] **OG tags:** Updated (if implemented)

---

## ✅ PHASE 7: FUNCTIONALITY

### Scan Execution
- [ ] **URL validation:** Rejects invalid URLs
- [ ] **HTTP/HTTPS:** Accepts both protocols
- [ ] **Subdomain support:** Works with subdomains
- [ ] **Port handling:** Handles non-standard ports if needed

### Data Accuracy
- [ ] **Pages discovered:** Finds internal pages correctly
- [ ] **Issue detection:** Identifies real issues
- [ ] **Decision logic:** Makes appropriate share-readiness decision
- [ ] **Metrics calculation:** Coverage and confidence calculated

### Persistence
- [ ] **Scan result stored:** Can reload report by ID
- [ ] **Demo store:** In-memory storage works for demo scans
- [ ] **Result fetching:** Full result fetched after scan completes

### Error Cases
- [ ] **Invalid URL:** Shows error message
- [ ] **Unreachable site:** Handles connection failures
- [ ] **Timeout:** Handles slow/timeout responses
- [ ] **Network error:** Shows user-friendly error

---

## ✅ PHASE 8: PERFORMANCE

### Load Times
- [ ] **Homepage load:** < 2 seconds
- [ ] **Config page load:** < 1 second  
- [ ] **Report page load:** < 2 seconds
- [ ] **Scan completion:** Reasonable time for site size

### Animations
- [ ] **Smooth animations:** No jank or stuttering
- [ ] **Ticker performance:** Smooth infinite scroll
- [ ] **Transitions:** Page transitions are smooth

### Console Errors
- [ ] **No critical errors:** Check browser console for errors
- [ ] **No 404s:** All assets load successfully
- [ ] **No warnings:** Minimal warnings (if any)

---

## ✅ PHASE 9: ACCESSIBILITY

### Keyboard Navigation
- [ ] **Tab order:** Logical tab order through interactive elements
- [ ] **Focus indicators:** Visible focus states
- [ ] **Button access:** All buttons keyboard-accessible

### Screen Reader
- [ ] **Headings:** Proper h1, h2, h3 hierarchy
- [ ] **Alt text:** Images have alt attributes
- [ ] **ARIA labels:** Interactive elements labeled (if needed)

### Color Contrast
- [ ] **Text readable:** Sufficient contrast on dark background
- [ ] **Links visible:** Link text distinguishable
- [ ] **Button labels:** Clear button text

---

## ✅ PHASE 10: EDGE CASES

### Different Site Types
- [ ] **Static site:** Works with simple HTML sites
- [ ] **SPA:** Handles single-page apps
- [ ] **Large site:** Handles sites with many pages
- [ ] **Small site:** Works for single-page sites

### Issue Scenarios
- [ ] **Perfect site:** Shows "Ready to Share" appropriately
- [ ] **Broken site:** Shows "Do Not Share Yet" when critical
- [ ] **Minor issues:** Shows "Fix Before Sharing" for warnings

### Data Fetching
- [ ] **No issues found:** Handles zero-issue case
- [ ] **Many issues:** Handles large issue lists
- [ ] **Incomplete data:** Handles missing optional fields

---

## 🐛 BUGS FOUND

### Critical
*List any critical bugs that prevent core functionality*

### High Priority
*List bugs that affect user experience but don't break core features*

### Medium Priority
*List minor bugs or inconsistencies*

### Low Priority
*List cosmetic issues or nice-to-haves*

---

## 📋 IMPROVEMENT SUGGESTIONS

### UX Enhancements
*Suggested improvements to user experience*

### Performance Optimizations
*Ways to improve speed or efficiency*

### Feature Additions
*New features that would enhance the product*

### Copy Improvements
*Better messaging or clearer explanations*

---

## ✅ SIGN-OFF

**Homepage:** ☐ Approved ☐ Needs fixes
**Config Page:** ☐ Approved ☐ Needs fixes
**Pipeline:** ☐ Approved ☐ Needs fixes
**Completion:** ☐ Approved ☐ Needs fixes
**Report:** ☐ Approved ☐ Needs fixes

**Overall Status:** ☐ Ready for Production ☐ Needs Work

**Tested By:** _________________
**Date:** _________________
**Notes:**

---

## 📝 TESTING NOTES

*Use this space for any additional observations during testing*
