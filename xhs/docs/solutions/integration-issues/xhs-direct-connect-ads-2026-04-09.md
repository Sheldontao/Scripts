---
title: Blocking XHS Direct Connection Ads (Skip DNS)
date: 2026-04-09
category: integration-issues
problem_type: integration_issue
module: xhs
tags: [ad-blocking, httpdns, loon, regex, direct-connect]
symptoms: Live cards and ads appearing despite DNS blocking; logs showing direct TCP connections to IP addresses with SNI headers.
root_cause: XHS app uses HTTPDNS/splash_config APIs to obtain an IP pool, bypassing system DNS for resource loading when primary domains are blocked.
resolution_type: configuration_change
---

## Problem
XHS (Xiaohongshu) app bypasses standard DNS-based ad blocking by using a "Skip DNS" or "Direct Connect" mechanism. This results in "Live" info cards and other advertisements appearing even when their source domains are blocked.

## Symptoms
- "Live" cards (e.g., "95后不工作环游中国") appear in the home feed.
- Traffic logs show direct TCP connections to IP addresses (e.g., `39.136.x.x`, `183.240.x.x`) with SNI set to `sns-video-hw.xhscdn.com`.
- High frequency of requests to `/system_service/splash_config` and `/httpdns`.

## Solution
Implement a multi-layered blocking strategy targeting the IP acquisition phase and the final UI rendering.

### 1. Loon Rewrite (Native Interception)
Intercept the "Information Source" APIs using Loon's native Rewrite to prevent the app from getting new IP addresses. Use `reject-dict` for JSON compatibility.

```ini
[Rewrite]
# Block splash config and HTTPDNS acquisition
^https?:\/\/edith\.xiaohongshu\.com\/api\/sns\/v\d+\/system_service\/splash_config reject-dict
^https?:\/\/.*\.xiaohongshu\.com\/api\/sns\/v\d+\/httpdns reject-dict
^https?:\/\/.*\.xhscdn\.com\/.*\/httpdns reject-dict
^https?:\/\/.*\.xhscdn\.com\/o_live_p2p_mobilesdk reject-dict
```

**Note**: All spaces in `jq` expressions or regexes must be replaced with `\x20` in Loon configuration to ensure correct parameter parsing.

### 2. JS Filtering (Secondary Defense)
Filter the Feed JSON in the JS script to remove `live` items before they reach the UI.

```javascript
// xhs_fmz200.js
obj.data = obj.data.filter(item => {
  if (
    (item?.model_type && String(item.model_type).includes("live")) || 
    item?.type === "live" ||
    item?.card_type === "live"
  ) {
    return false;
  }
  return true;
});
```

### 3. MITM Configuration
Ensure the relevant domains are in the MITM list to allow Loon to decrypt and match the paths.

```ini
[MITM]
hostname = api.xiaohongshu.com, *.xhscdn.com, edith.xiaohongshu.com, www.xiaohongshu.com, ci.xiaohongshu.com, rec.xiaohongshu.com, so.xiaohongshu.com
```

## Why This Works
By blocking the `splash_config` and `httpdns` endpoints, the APP's internal IP cache eventually expires or fails to update. Without a valid IP pool, the APP is forced to fall back to system DNS (which is already blocked) or simply fails to load the ad resources. The JS filtering provides a safety net for any items already cached or delivered via undetected routes.

## Prevention
- Periodically check for new HTTPDNS path patterns (e.g., `/dns-query`, `/v2/httpdns`).
- Monitor direct TCP connections in Loon/AdGuard logs for new IP ranges.
- Always use `\x20` for spaces in Loon Rewrite parameters to prevent parsing errors.
