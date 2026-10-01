---
title: Unknown Rule Config Lacked Context and Completion HUD
date: 2026-04-18
category: ui-bugs
module: link-cleaner
problem_type: ui_bug
component: tooling
symptoms:
  - Unknown-rule config showed limited context, making rule setup hard to trust.
  - Users could not easily see all detected query parameters before saving a rule.
  - Completion flow felt unfinished because it did not use a compact Raycast-style completion HUD.
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [raycast, unknown-rule, preview, query-params, hud, clipboard]
---

# Unknown Rule Config Lacked Context and Completion HUD

## Problem

In the unknown-rule flow, users needed to decide which query params to keep, but the form did not surface enough context. After cleaning, the command feedback also did not match the expected quick-complete Raycast behavior.

## Symptoms

- Rule configuration view lacked complete, confidence-building context for long share URLs.
- Users could not quickly verify what parameter keys were available to keep.
- Completion did not show the expected compact HUD-style done signal.

## What Didn't Work

- The previous unknown-rule flow optimized for minimal output instead of decision context, so users could not confidently configure keep parameters.

## Solution

Expanded the unknown-rule form with full context and added a browser preview action:

```tsx
<Form.Description title="Original URL" text={props.url} />
<Form.Description title="Detected Parameters" text={detectedParamsText} />
<Action.OpenInBrowser title="Open Preview URL in Browser" url={previewUrl} />
```

Reference: `src/components/unknown-url-rule-form.tsx`

Displayed unique detected parameter keys in a readable comma-separated list, with an explicit empty-state message:

```ts
function formatDetectedParams(keys: string[]): string {
  const uniqueKeys = dedupeParamKeys(keys);
  if (uniqueKeys.length === 0) {
    return "No query parameters found";
  }
  return uniqueKeys.join(", ");
}
```

Reference: `src/components/unknown-url-rule-form-helpers.ts`

Changed completion behavior to auto-copy + HUD completion message:

```ts
await Clipboard.copy(text);
await showHUD(partial ? "Cleaning complete (partial)" : "Cleaning complete");
```

`partial` indicates at least one URL could not be fully cleaned and was intentionally kept unchanged.

Reference: `src/components/cleaning-command-view.tsx`

## Why This Works

The full URL + detected parameter list gives users enough information to define rules confidently. The browser-open action shortens preview validation. HUD-based completion aligns with Raycast command ergonomics and clearly signals that the clean action is done.

## Prevention

- For unknown/edge flows, always show input context, parsed data, and output preview together.
- Keep parsing/formatting logic in helper modules and cover it with focused tests.
- Use command-friendly completion patterns (auto-copy + HUD) for one-shot actions.
- Include at least one validation path that lets users inspect generated URLs in the browser.

## Related Issues

- Related planning context: `docs/plans/2026-04-18-001-feat-user-defined-rules-unsupported-urls-plan.md`
