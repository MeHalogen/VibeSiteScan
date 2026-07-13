
# AI Coding Anti-Patterns

Based on 1 logged code review failures.
Generated: 7/8/2026

---

## Instructions for ChatGPT/GPT-4

When generating code, avoid these patterns that have caused review failures:

### ❌ Null Pointer (1 occurrence)

**What went wrong:**
fix: resolve all TypeScript build errors - nocheck legacy, fix null narrowing, fix MapIterator, exclude tests

**Problematic code:**
```
--- a/app/dashboard/reports/pipeline-result/page.tsx
+++ b/app/dashboard/reports/pipeline-result/page.tsx
@@ -22,7 +22,7 @@ export default function PipelineResultPage() {
     async function load() {
       try {
         setLoading(true);
-        const res = await fetch(`/api/demo-scan/result/${encodeURIComponent(scanId)}`);
+        const res = await fetch(`/api/demo-scan/result/${encodeURIComponent(scanId!)}`);
         if (!res.ok) throw new Error("Report not found");
         const data = await res.json();```

**Severity:** medium

---



