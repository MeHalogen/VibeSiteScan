# Diagnostic Report Only State

## Overview

The "Diagnostic Report Only" state is a special report type shown when VibeSiteScan scans large, mature enterprise websites that are outside the product's ideal use case.

This state protects product credibility by clearly communicating:
- The scan completed successfully
- Some checks were performed
- No launch-readiness decision is being assigned
- This does not mean the website is bad
- The target is outside our ideal use case

---

## When This State Appears

The diagnostic-only state triggers when:

1. **Enterprise Domain Detected**: The target is a known large enterprise website (e.g., apple.com, microsoft.com, amazon.com)
2. **High Blockage Rate**: Many requests were blocked or failed (>30%)
3. **Bot Protection**: Access restrictions or bot protection detected
4. **Low Crawlability**: Large site with many skipped pages
5. **Limited Coverage**: Scan coverage falls below reliability threshold

These signals indicate the target is better suited for enterprise-grade auditing tools, not a launch hygiene checker for AI-built sites.

---

## Visual Design

### Status Badge
- Text: **"DIAGNOSTIC COMPLETE"** (not "MISSION COMPLETE" or "SCAN FAILED")
- Color: Blue (`#3b82f6`)
- Styling: Info/neutral tone, not error red

### Main Hero
- **Headline**: "Diagnostic Report Only"
- **Subheadline**: "This site is outside our ideal target. We checked what we could, but we are not assigning a share-readiness decision."
- **Supporting Note**: "This does not mean the site is poor quality. It means this scan is only a limited public launch-hygiene diagnostic."

### Icon
- Uses `Info` icon from lucide-react
- Blue color scheme
- No red/error styling

---

## Page Structure

### 1. Status Badge & Hero
Shows diagnostic complete badge and main message

### 2. Explanation Banner
Explains why the result is diagnostic only:
- Large enterprise website detected
- Complex infrastructure considerations
- Why a simple readiness decision would be misleading

### 3. Diagnostic Summary Cards (4 cards)

**Card 1: Report Type**
- Label: "Report Type"
- Value: "Diagnostic Only" (blue) or "Launch Check" (green)
- Description: "No readiness decision assigned" or "Full readiness decision provided"

**Card 2: Target Fit**
- Label: "Target Fit"
- Value: "Limited" (amber), "Acceptable" (blue), or "Ideal" (green)
- Description: Context about the target type

**Card 3: Scan Coverage**
- Label: "Scan Coverage"
- Value: Percentage (e.g., "53%")
- Description: "How much of the checklist could be verified"

**Card 4: Confidence**
- Label: "Confidence"
- Value: "Limited" (amber), "Medium" (blue), or "High" (green)
- Description: "Result should not be treated as full audit"

### 4. Target Details Row
Shows scan metadata:
- Target URL
- Scan Mode
- Target Fit
- Duration

### 5. Scope Note
Clear explanation of what was and wasn't measured:
- Only public launch-hygiene checks
- Skipped checks reduce coverage/confidence, not site quality
- VibeSiteScan doesn't measure brand quality, SEO authority, enterprise strategy, etc.

### 6. What We Checked / What We Don't Check
Two-column comparison showing:

**What we checked:**
- Public launch hygiene
- Share preview tags
- Metadata completeness
- Link health
- Route discoverability
- Indexing basics
- Form structure
- Browser/mobile basics

**What we do not check:**
- Brand quality
- SEO authority
- Enterprise SEO strategy
- Full accessibility compliance
- Full security posture
- Business credibility
- Ranking potential
- Full performance quality

### 7. CTA Section
Encourages scanning appropriate targets:
- **Title**: "Want an accurate readiness decision?"
- **Body**: "Scan an AI-built site, MVP, landing page, portfolio, or client preview link..."
- **Suggestions**: Lovable app, Bolt site, Cursor landing page, portfolio, MVP, client preview
- **Primary CTA**: "SCAN ANOTHER SITE"

---

## Key Microcopy

### Professional, Honest Messaging
- "Not scored due to target fit" (not "failed" or "bad site")
- "Coverage affects confidence, not website quality"
- "This is a limited diagnostic, not a full audit"
- "We checked public launch hygiene only"
- "appears to be a large mature website" (not "confirmed enterprise")
- "outside our ideal use case" (not "incompatible")

### What to Avoid
❌ "Mission Complete" (too military/dramatic)
❌ "Launch Readiness: Diagnostic Only" (contradictory)
❌ "Apple.com scored badly" (misleading)
❌ "Failed scan" (scan succeeded)
❌ "Bad site" (judgmental)
❌ Red error styling (this isn't an error)

### What to Use
✅ "Diagnostic Complete" (clear, neutral)
✅ "Report Type: Diagnostic Only" (accurate)
✅ "Coverage affects confidence, not website quality" (honest)
✅ "Outside ideal use case" (professional)
✅ Blue/amber info styling (appropriate tone)

---

## Technical Implementation

### Component
`/app/components/scan/ScanCompleteSummary.tsx`

### Detection Logic
The component checks:
```typescript
const isDiagnosticOnly = scoreMode === 'diagnostic_only' || launchDecision === 'diagnostic_only';
```

### Data Requirements
From scan result:
- `launch_decision`: 'diagnostic_only'
- `score_mode`: 'diagnostic_only'
- `target_fit`: 'limited'
- `target_fit_reason`: String explanation
- `scan_coverage`: Number (0-100)
- `result_confidence`: 'limited' | 'medium' | 'high'
- `launch_readiness_score`: null (no score assigned)

### Conditional Rendering
- Launch Readiness Score: Hidden when diagnostic only
- Full Report CTA: Hidden when diagnostic only
- What We Checked section: Shown only when diagnostic only
- Enterprise CTA: Shown only when diagnostic only

---

## Normal Report States

The diagnostic state does NOT affect normal scan results:

### For AI-built sites, MVPs, landing pages, portfolios:
- ✅ **Ready to Share**: Green, shows score
- ⚠️ **Fix Before Sharing**: Amber, shows score
- 🚫 **Do Not Share Yet**: Red, shows score

### Only for large enterprise sites:
- ℹ️ **Diagnostic Report Only**: Blue, no score

---

## Product Language

### Product Name Consistency
The component uses "VibeSiteScan" throughout:
- "VibeSiteScan checks..."
- "VibeSiteScan does not measure..."
- "VibeSiteScan is optimized for..."

If the product is renamed, update all references consistently.

---

## Color Coding

### Diagnostic State
- Primary: Blue (`#3b82f6`)
- Background: `bg-blue-500/10`
- Border: `border-blue-500/30`
- Text: `text-blue-400`

### Other States
- Ready to Share: Green (`#10b981`)
- Fix Before Sharing: Amber (`#f59e0b`)
- Do Not Share Yet: Red (`#dc2626`)
- Unknown/Neutral: Slate (`#64748b`)

### Target Fit
- Ideal: Green (`#10b981`)
- Acceptable: Blue (`#3b82f6`)
- Limited: Amber (`#f59e0b`)

### Confidence
- High: Green
- Medium: Blue
- Limited: Amber

---

## Acceptance Criteria

✅ Enterprise websites don't receive misleading low scores
✅ Page clearly says "Diagnostic Report Only"
✅ UI doesn't feel like error/crash state
✅ Report explains why no readiness decision was assigned
✅ Coverage and confidence shown clearly
✅ Product explains what it checks and doesn't check
✅ Users understand this doesn't mean site is bad
✅ Product name consistent across page
✅ Red not used for non-error diagnostic states
✅ Clear CTA to scan better-fit site
✅ Normal reports still show readiness decisions
✅ Page feels premium, honest, trustworthy

---

## User Perception Goal

When scanning apple.com or similar large enterprise sites, users should think:

> "Okay, this tool is honest. It knows Apple.com is not the right target, so it did not fake a bad score. This is a mature product decision, not a failed scan."

The diagnostic state should feel like:
- ✅ A valid report outcome
- ✅ Professional product behavior
- ✅ Honest about limitations
- ✅ Premium and trustworthy

Not like:
- ❌ An error or failure
- ❌ A limitation or bug
- ❌ A judgement on the scanned site
- ❌ A missing feature

---

## Related Files

- `/app/components/scan/ScanCompleteSummary.tsx` - Main component
- `/lib/product-language.ts` - Microcopy and messaging
- `/lib/launch-readiness/types.ts` - Type definitions
- `/lib/launch-readiness/target-fit.ts` - Detection logic
- `/lib/launch-readiness/scoring.ts` - Scoring logic

---

## Future Improvements

Potential enhancements:
1. Add sample diagnostic report link
2. Show which specific checks were skipped
3. Provide export/share for diagnostic reports
4. Add comparison showing ideal vs actual coverage
5. Suggest alternative tools for enterprise audits
6. Show enterprise detection signals to users
7. Allow users to override and force scoring (with warning)

---

Last Updated: 2026-05-21
