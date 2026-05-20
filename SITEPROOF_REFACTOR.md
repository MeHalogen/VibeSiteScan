# SiteProof Product Refactor

## ✅ Phase 1: Complete - Homepage Rebrand

### Changes Made:

**1. Product Name & Positioning**
- ✅ Changed from "LaunchScan" to "SiteProof"
- ✅ New tagline: "Final QA for AI-Built Websites"
- ✅ Hero: "Proof your site before your audience sees it"
- ✅ Subheadline: "Catch what AI missed before your audience does"

**2. Homepage Updates (`app/page.tsx`)**
- ✅ Updated ticker messages to focus on AI builders
- ✅ Changed "LIVE SCANS" to "LIVE PROOFS"
- ✅ Updated recent activity feed data
- ✅ Changed CTA from "Run Free Scan" to "Proof My Site →"
- ✅ Updated trust pills: Cursor · Lovable · Bolt · Replit · AI Fix Prompt
- ✅ Changed classification stamp to "FINAL QA FOR AI-BUILT SITES"
- ✅ Updated issues list to "Top Issues Caught" with AI-relevant problems

**3. Meta Data (`app/layout.tsx`)**
- ✅ Title: "SiteProof - Final QA for AI-Built Websites"
- ✅ Description updated to emphasize AI builders and fix prompts

**4. Visual Consistency**
- ✅ Maintained dark ops console theme
- ✅ Kept scanlines and coordinate grid
- ✅ Preserved emerald accent colors
- ✅ Maintained intel panel styling

---

## 🚧 Phase 2: In Progress - Report Pages

### Decision-First Output

**Current State:**
- Report shows launch_score as primary metric
- Uses numeric 0-100 scoring

**Target State:**
- Decision badges: "Ready to Share" / "Fix Before Sharing" / "Do Not Share Yet"
- Score demoted to supporting metric
- Add confidence and coverage indicators

**Files to Update:**
- `app/components/TerminalReportPage.tsx` - Main report
- `app/components/EnhancedReportPage.tsx` - Alternative report view
- `app/components/scan/ScanCompleteSummary.tsx` - Completion page
- `app/components/scan/LaunchDecisionBadge.tsx` - Decision component

---

## 📋 Phase 3: To Do - Core Features

### A. AI Fix Prompt Tab

**Priority: HIGH**

Create new tab in report: "AI Fix Prompt"

**Requirements:**
1. Generate contextual fix prompt based on issues found
2. Include:
   - Issue summary
   - Affected pages
   - Exact evidence
   - Step-by-step fixes
   - File change guidance
3. Copy buttons for:
   - Cursor
   - Lovable
   - Bolt
   - Replit
   - Generic

**Template Structure:**
```
You are fixing launch-readiness issues found by SiteProof.

Preserve the current design and functionality.
Fix only the issues listed below.

Issues Found:
[grouped by category]

Affected Pages:
[list with evidence]

Required Fixes:
[clear actionable steps]

After completion, summarize:
- Files changed
- Issues fixed
- Any manual setup needed
```

**Files to Create:**
- `lib/ai-prompt-generator.ts` - Prompt generation logic
- `app/components/report/AIFixPromptTab.tsx` - UI component

---

### B. Enhanced Issue Grouping

**Priority: HIGH**

Group issues by user impact, not just technical category.

**Categories:**
1. **Share Preview Problems**
   - Missing og:image
   - Missing og:title/description
   - Broken Twitter cards

2. **Broken Navigation / CTAs**
   - Placeholder href="#"
   - Broken internal links
   - 404 pages

3. **Metadata Problems**
   - Duplicate titles
   - Missing descriptions
   - Generic "Untitled" pages

4. **Search/Crawler Basics**
   - Missing sitemap.xml
   - Missing robots.txt
   - Missing canonical URLs

5. **Forms and Conversion**
   - Forms with no action
   - Missing submit buttons
   - Inaccessible inputs

6. **AI Placeholder Leftovers**
   - Lorem ipsum text
   - "Demo" routes
   - Template content
   - Fake testimonials

**Files to Update:**
- `lib/issue-grouping.ts` - Add new grouping logic
- `app/components/report/ActionCard.tsx` - Update display

---

### C. Pages Scanned Transparency

**Priority: MEDIUM**

Add detailed "Pages Scanned" tab showing:
- Exact URL checked
- HTTP status code
- Title found
- Issue count per page
- Discovery path (how we found it)
- Expand to show page-level details

**Files to Create:**
- `app/components/report/PagesScannedTab.tsx`

---

### D. Pipeline Updates

**Priority: MEDIUM**

Update scan pipeline stages to reflect SiteProof messaging:

**Current Stages:**
1. Init
2. Fetch
3. Discover
4. Crawl
5. Extract
6. Check Links
7. Check Forms
8. Browser Checks
9. Final Scoring

**New Stage Labels:**
1. Fetching URL
2. Checking Accessibility
3. Discovering Pages
4. Reading Metadata
5. Checking Share Previews
6. Checking Links & CTAs
7. Checking Forms
8. Checking Launch Basics
9. Detecting AI Leftovers
10. Building Report
11. Generating AI Fix Prompt

**Files to Update:**
- `lib/scan-pipeline/types.ts` - Update stage definitions
- `app/components/scan/PipelineStageNode.tsx` - Update labels

---

## 📝 Phase 4: Content & Copy Updates

### A. Config Page

**File:** `app/dashboard/new-scan-pipeline/page.tsx`

**Updates Needed:**
- Change "Scan" to "Proof"
- Update button: "Start Proof" or "Proof My Site"
- Add context: "SiteProof checks public pages for share-readiness"
- Update placeholder: "https://your-ai-built-site.com"

---

### B. Completion Summary

**File:** `app/components/scan/ScanCompleteSummary.tsx`

**Current:** Shows "MISSION COMPLETE" with score
**Target:** Show decision-first with supporting metrics

**Updates:**
- Primary: Decision badge (Ready/Fix/Do Not Share)
- Secondary: Metrics cards (Pages, Critical, Warnings)
- Add: "Copy AI Fix Prompt" button if issues found
- Update: Language to emphasize AI builder context

---

### C. Product Language Library

**File:** `lib/product-language.ts`

**Add SiteProof-specific copy:**
```typescript
export const SITEPROOF_COPY = {
  hero: {
    badge: "FINAL QA FOR AI-BUILT SITES",
    headline: "Proof your site before your audience sees it",
    subheadline: "Catch what AI missed before your audience does",
    cta: "Proof My Site →",
    ctaSecondary: "View Sample Report",
  },
  decisions: {
    readyToShare: {
      title: "Ready to Share",
      message: "Your AI-built site looks good! No critical issues found.",
    },
    fixBeforeSharing: {
      title: "Fix Before Sharing",
      message: "Some issues could make your site look unfinished. Fix these first.",
    },
    doNotShareYet: {
      title: "Do Not Share Yet",
      message: "Critical blockers found. Your site needs fixes before going public.",
    },
  },
  builders: ["Cursor", "Lovable", "Bolt", "Replit", "Claude Code"],
};
```

---

## 🎨 Phase 5: Visual Updates

### A. Logo/Brand

**Files to Update:**
- Update "L" logo to "S" for SiteProof
- Or create "SP" monogram
- Update in: header, report pages, completion summary

**Locations:**
- `app/page.tsx` - Hero (currently shows "SITE PROOF" text)
- `app/components/TerminalReportPage.tsx` - Header logo
- `app/components/EnhancedReportPage.tsx` - Header logo
- `app/dashboard/new-scan-pipeline/page.tsx` - Config page

---

### B. Decision Badges

**File:** `app/components/scan/LaunchDecisionBadge.tsx`

**Current:** May use "safe_to_share" / "fix_before_sharing" / "do_not_ship_yet"
**Update:** Ensure consistent messaging and visual hierarchy

**Design:**
- Ready to Share: Green/emerald, checkmark icon
- Fix Before Sharing: Amber/yellow, warning icon
- Do Not Share Yet: Red, X or stop icon

---

## 🔧 Phase 6: Backend & API Updates

### A. Issue Detection

**Enhance scanner to catch AI-specific issues:**

1. **Placeholder Detection**
   - "Lorem ipsum"
   - "Click here"
   - "Demo content"
   - "Untitled app"
   - "Your company name"

2. **CTA Analysis**
   - href="#"
   - href="/demo"
   - href="/coming-soon"
   - Broken signup/contact links

3. **Metadata Duplication**
   - Same title across routes
   - Generic descriptions
   - Missing route-specific OG tags

**Files to Update:**
- `lib/scanner/index.ts` - Add detection logic
- `lib/scanner/issueKnowledgeBase.ts` - Add new issue types

---

### B. Scoring Logic

**File:** `lib/launch-readiness/scoring.ts`

**Update decision logic to prioritize:**
1. Share preview completeness
2. CTA functionality
3. Metadata uniqueness
4. Core page accessibility
5. Launch basics (sitemap, robots, favicon)

**Demote:**
- Pure SEO optimization
- Performance metrics
- Advanced technical issues

---

## 📊 Phase 7: Analytics & Tracking

### Events to Track

**For future monetization insights:**
1. Proof initiated
2. Proof completed
3. Decision shown (Ready/Fix/DoNotShare)
4. AI fix prompt copied
5. Report shared
6. Rescan after fixing
7. Builder platform mentioned (Cursor/Lovable/Bolt)

---

## 💰 Phase 8: Monetization Prep

### Free Tier
- Homepage + up to 5 pages
- Basic report
- AI fix prompt
- Unlimited rescans

### Pro Plan ($10/mo) - Ideas
- Up to 50 pages per proof
- Saved reports
- Report history
- Shareable proof links
- PDF export
- Priority support

### Agency Plan ($50/mo) - Ideas
- Multiple client sites
- White-label reports
- Team collaboration
- Client-ready exports
- Monthly monitoring

### One-Time Deep Proof ($5)
- For indie builders who don't want subscriptions
- Full 50-page proof
- AI fix prompt
- PDF export
- Valid 30 days

---

## 🚀 Deployment Checklist

### Before Launch:
- [ ] Update all "LaunchScan" references to "SiteProof"
- [ ] Test AI fix prompt generation
- [ ] Verify decision logic accuracy
- [ ] Test with real AI-built sites (Cursor/Lovable/Bolt)
- [ ] Add sample report with realistic AI issues
- [ ] Update meta tags and OG images
- [ ] Add favicon (S or SP logo)
- [ ] Test mobile responsiveness
- [ ] Verify all CTAs work
- [ ] Check for any remaining placeholder text

### SEO Updates:
- [ ] Update sitemap.xml
- [ ] Update robots.txt
- [ ] Add structured data for SaaS product
- [ ] Create landing pages for:
  - /cursor (Cursor users)
  - /lovable (Lovable users)  
  - /bolt (Bolt users)
  - /replit (Replit users)

---

## 📖 Documentation Needs

### User-Facing:
1. **How SiteProof Works**
   - What we check
   - Why it matters
   - How to use AI fix prompts

2. **Fix Guides**
   - How to fix missing OG images
   - How to fix placeholder CTAs
   - How to add sitemap/robots
   - How to fix duplicate metadata

3. **Builder-Specific Guides**
   - Using SiteProof with Cursor
   - Using SiteProof with Lovable
   - Using SiteProof with Bolt
   - Using SiteProof with Replit

### Internal:
1. Decision logic documentation
2. Issue severity guidelines
3. AI prompt templates
4. Confidence calculation methodology

---

## 🎯 Success Metrics

### Product-Market Fit Signals:
- "Did you SiteProof it?" becomes common phrase
- High rescan rate (users fixing and rechecking)
- AI fix prompt copy rate >60%
- Decision accuracy validated by users
- Low support requests about report clarity
- High conversion on AI builder landing pages

### Growth Metrics:
- Daily proofs
- Unique sites proofed
- AI fix prompts copied
- Reports shared
- Rescan completion rate

---

## 🔄 Current Status

**✅ Complete:**
- Homepage rebrand
- Meta tags updated  
- Core messaging established
- Visual theme maintained

**🚧 In Progress:**
- Report page updates
- Decision-first display
- AI fix prompt feature

**📋 Next Up:**
- Issue grouping enhancement
- Pages scanned transparency
- Pipeline stage updates
- Config page rebrand

---

## Notes

- Maintain dark ops console visual theme throughout
- Keep technical credibility while being accessible to non-developers
- Emphasize transparency in what we check and why
- Make AI fix prompts the hero differentiator
- Build trust through clear evidence and exact pages checked
- Position as complementary to AI builders, not replacement
