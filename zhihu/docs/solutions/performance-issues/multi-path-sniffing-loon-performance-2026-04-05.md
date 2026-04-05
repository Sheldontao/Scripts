---
date: 2026-04-05
topic: multi-path-sniffing-loon-performance
problem_type: performance_issue
component: script-engine
track: knowledge
---

# Multi-path Sniffing for High-Performance Loon Scripting

## Context
When migrating complex ad-removal scripts from full-text search (`JSON.stringify().search()`) to specific property matching (for performance in Loon/QuantumultX), there is a high risk of losing feature parity. Ads in Zhihu (and similar apps) are often hidden deep within nested JSON structures like `ComponentCard` or `common_card`, where the target ID or type might appear in different fields depending on the API version or card style.

## Guidance
Instead of relying on a single expensive `JSON.stringify` call or a rigid single-field check, use a **Multi-path Sniffer** utility. This function scans a prioritized list of potential attribute paths for known "danger" markers using pre-compiled regular expressions.

### Key Implementation Pattern:
1. **Define Constants**: Use a single regex for all blockable types to avoid multiple regex object creations.
2. **Prioritize Paths**: Scan outer properties first (fast-fail) then dive into deep nesting.
3. **Recursive/Iterative Child Scanning**: Specifically for `ComponentCard` structures, iterate through `children` arrays to find markers like `video_data`.

### Example (Zheye Script Optimization)
```javascript
const AD_TYPE_RE = /(zvideo|Video|BIG_IMAGE|drama|StyleVideo|app_ad|ad_card|FeedVideo)/i;

function sniffAd(e, r) {
  // 1. Base identity (Fastest)
  if (e.ad || e.ad_info || e.adjson) return true;

  // 2. Multi-path Attribute Scan
  const typesToCheck = [
    e.common_card?.style,
    e.target?.type,
    e.extra?.content_type,
    e.common_card?.feed_content?.video?.type
  ];
  if (typesToCheck.some(p => p && AD_TYPE_RE.test(p))) return true;

  // 3. Child Node Penetration (Crucial for ComponentCard)
  if (e.children?.some(c => c.type === "Video" || c.video_data)) return true;

  return false;
}
```

## Why This Matters
*   **CPU Efficiency**: Bypassing `JSON.stringify` reduces processing time per item from milliseconds to microseconds.
*   **Memory Stability**: Prevents large string allocations that trigger Garbage Collection (GC) stutters during scrolling.
*   **Precision**: Prevents false positives that occur when ad-related keywords appear in legitimate user comments.

## When to Apply
*   Applying ad-filtering to high-frequency streams (Recommendation feeds).
*   Working in resource-constrained environments (iOS JS runtimes within proxy apps).
*   When the target JSON structure is inconsistent across different UI components.

## Examples
* **Before (Slow & Broad)**: `if (JSON.stringify(e).includes("BIG_IMAGE")) ...`
* **After (Fast & Targeted)**: `if (sniffAd(e)) ...`
