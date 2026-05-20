# Diagnostic Report Only - Quick Reference

## What Changed?

Enterprise websites like apple.com now show a professional "Diagnostic Report Only" state instead of misleading low scores.

---

## Visual Quick Reference

### Diagnostic State (New!)
```
┌─────────────────────────────────────────┐
│  DIAGNOSTIC COMPLETE (Blue Badge)       │
│  ℹ️                                      │
│  Diagnostic Report Only                 │
│  This site is outside our ideal target  │
└─────────────────────────────────────────┘

4 Cards:
• Report Type: Diagnostic Only (blue)
• Target Fit: Limited (amber)  
• Scan Coverage: 53% (blue)
• Confidence: Limited (amber)

⚠️ NO numeric score shown
⚠️ NO "Open Full Report" button

✅ Shows "What we checked" section
✅ Shows "Want accurate decision?" CTA
✅ "SCAN ANOTHER SITE" button
```

### Normal State (Unchanged)
```
┌─────────────────────────────────────────┐
│  SCAN COMPLETE (Green Badge)            │
│  ✅                                      │
│  Ready to Share                         │
│  Your site looks good!                  │
└─────────────────────────────────────────┘

Large Score Display:
87/100

✅ Shows "Open Full Report" button
✅ Shows readiness decision
✅ Normal color coding
```

---

## When It Triggers

**Diagnostic Only appears when**:
- Enterprise domain (apple.com, microsoft.com, etc.)
- High blockage rate (>30%)
- Bot protection detected
- Large site with low crawlability
- Coverage too low for reliable score

**Normal scoring appears when**:
- AI-built sites (vercel.app, netlify.app)
- Small/medium business sites
- Portfolios and landing pages
- MVPs and client previews
- Good coverage (>60%)

---

## Key Files

| File | Purpose |
|------|---------|
| `ScanCompleteSummary.tsx` | Main scan result page |
| `LaunchDecisionBadge.tsx` | Badge component |
| `product-language.ts` | All microcopy |
| `DIAGNOSTIC_REPORT_STATE.md` | Full documentation |
| `TESTING_DIAGNOSTIC_STATE.md` | Testing guide |

---

## Testing Checklist

### ✅ Test Diagnostic State
```bash
# Scan these domains:
- apple.com
- microsoft.com
- amazon.com

# Should see:
- Blue "DIAGNOSTIC COMPLETE" badge
- "Diagnostic Report Only" headline
- No numeric score
- "What we checked" section
- "Want accurate decision?" CTA
```

### ✅ Test Normal State
```bash
# Scan these domains:
- your-app.vercel.app
- your-site.netlify.app
- your-portfolio.com

# Should see:
- Green/amber/red badge
- Readiness decision
- Numeric score (X/100)
- "Open Full Report" button
```

---

## Copy Examples

### ✅ Good Copy (Use This)
- "Diagnostic Report Only"
- "This site is outside our ideal target"
- "Coverage affects confidence, not website quality"
- "appears to be a large, mature enterprise website"
- "Not scored due to target fit"

### ❌ Bad Copy (Don't Use)
- "Mission Complete"
- "Launch Readiness: Diagnostic Only"
- "Failed scan"
- "Bad site"
- "Apple.com scored badly"

---

## Color Codes

| State | Color | Hex | Usage |
|-------|-------|-----|-------|
| Diagnostic | Blue | `#3b82f6` | Info state |
| Ready | Green | `#10b981` | Success |
| Fix | Amber | `#f59e0b` | Warning |
| Block | Red | `#dc2626` | Error |
| Limited Fit | Amber | `#f59e0b` | Info |
| Ideal Fit | Green | `#10b981` | Success |

---

## User Flow

```
User scans apple.com
       ↓
Detection: Enterprise domain
       ↓
Backend returns:
  launch_decision: 'diagnostic_only'
  target_fit: 'limited'
  scan_coverage: 53%
       ↓
Frontend shows:
  Blue diagnostic state
  Clear explanation
  What was checked
  CTA to scan better target
       ↓
User understands:
  "This tool is honest"
  "I should scan my Lovable app"
       ↓
Better user experience ✅
```

---

## Support Script

**If user asks**: "Why didn't my scan get a score?"

**Response**:
> You scanned [DOMAIN] which appears to be a large enterprise website. LaunchScan is designed for AI-built sites, MVPs, landing pages, and portfolios — not full enterprise websites.
> 
> Large enterprise sites have complex infrastructure that makes simple launch-readiness scoring misleading. We ran a diagnostic check and showed what we could verify, but we're not assigning a readiness decision.
> 
> For an accurate readiness decision, try scanning:
> - Your Lovable or Bolt app
> - Your portfolio or landing page
> - Your MVP or client preview link

---

## Quick Fixes

### If diagnostic state not showing:
1. Check backend returns `launch_decision: 'diagnostic_only'`
2. Verify `scoreMode === 'diagnostic_only'` in component
3. Check domain is in enterprise list (target-fit.ts)

### If normal sites showing diagnostic:
1. Review target fit detection logic
2. Check coverage calculation
3. Verify blockage rate calculation
4. May need to adjust thresholds

### If colors wrong:
1. Check `decisionConfig` in component
2. Verify Tailwind classes applied
3. Check CSS not overriding colors

---

## API Response Example

### Diagnostic Response
```json
{
  "id": "scan_123",
  "target_url": "https://apple.com",
  "launch_decision": "diagnostic_only",
  "score_mode": "diagnostic_only",
  "target_fit": "limited",
  "target_fit_reason": "Large enterprise website detected...",
  "scan_coverage": 53,
  "result_confidence": "limited",
  "launch_readiness_score": null
}
```

### Normal Response
```json
{
  "id": "scan_456",
  "target_url": "https://myapp.vercel.app",
  "launch_decision": "safe_to_share",
  "score_mode": "normal",
  "target_fit": "ideal",
  "target_fit_reason": "AI-built site...",
  "scan_coverage": 94,
  "result_confidence": "high",
  "launch_readiness_score": 87
}
```

---

## Acceptance Criteria

- [x] Enterprise sites don't show misleading scores
- [x] Page says "Diagnostic Report Only"
- [x] Doesn't look like error state
- [x] Explains why diagnostic only
- [x] Shows coverage clearly
- [x] Explains what is/isn't checked
- [x] Users know site isn't bad
- [x] Consistent product name
- [x] Blue not red for diagnostic
- [x] CTA to scan better target
- [x] Normal reports unchanged
- [x] Feels trustworthy

**Status**: ✅ All criteria met

---

## Deployment

**No breaking changes**
- Existing flows work
- Backward compatible
- No migrations needed

**Deploy order**:
1. Backend scoring updates (if needed)
2. Frontend component updates
3. Monitor first week closely
4. Gather user feedback

---

## Monitoring

Track:
- % scans triggering diagnostic
- User clicks on "Scan another site"
- Support tickets about diagnostic
- User feedback sentiment

Expected:
- 5-10% of scans diagnostic
- Higher trust scores
- Fewer confused users

---

## Questions?

**Frontend**: Check `ScanCompleteSummary.tsx` component
**Backend**: Check target fit detection in scoring system
**Design**: Review `DIAGNOSTIC_REPORT_STATE.md`
**Testing**: Use `TESTING_DIAGNOSTIC_STATE.md`
**Full Details**: See `IMPLEMENTATION_DIAGNOSTIC_STATE.md`

---

**Last Updated**: 2026-05-21  
**Status**: ✅ Ready for deployment
