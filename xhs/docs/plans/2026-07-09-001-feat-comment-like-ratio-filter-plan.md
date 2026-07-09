---
title: "feat: Add comment-to-likes ratio threshold filter with global switch"
type: feat
status: active
created: 2026-07-09
author: opencode
depth: Standard
---

# Technical Plan - Comment-to-Likes Ratio Threshold Filter

## Summary

Add a comment-to-likes ratio threshold filter (`comments / likes > threshold`) to the note filtering pipeline in `xhs_fmz200.js`, defaulting to 0 (disabled). When ratio is enabled, items where `likes` is 0, undefined, or null are skipped (division-by-zero guard). Wire two global switches (`xhs_general_counts_threshold`, `xhs_general_comment_like_ratio_threshold`) to control whether the counts threshold and ratio threshold apply to all note-returning endpoints or only to `/homefeed`. Fix existing test infrastructure and test expectations before adding new behavior.

---

## Problem Frame

The plugin's `[Argument]` section already declares `xhs_comment_like_ratio_threshold` and `xhs_general_comment_like_ratio_threshold`, and the `xhs_general_counts_threshold` switch is declared but never read by the script. The raw data fields (`item.likes`, `item.comments_count`) are present in homefeed responses but this ratio-based filtering is unimplemented. Additionally, the existing test suite has 15 failing tests due to stale expectations (comment regex preservation refactor) and missing Surge globals in the test VM context. Green tests are a prerequisite for safely adding new filtering logic.

---

## Requirements

- R1. Add `getCachedCommentLikeRatioThreshold` helper following the established caching pattern (cache key + argument fallback + validation)
- R2. Apply comment-to-likes ratio threshold in `/homefeed` when threshold > 0
- R3. If `xhs_general_comment_like_ratio_threshold` is true, apply the ratio threshold to `/search/notes` as well
- R4. If `likes` is 0, undefined, or null for an item, skip it (filter it out) when ratio filter is active
- R5. Wire `xhs_general_counts_threshold` so the existing counts threshold filter applies to `/search/notes` when the switch is true
- R6. Wire `xhs_comment_like_ratio_threshold` argument into the plugin's homefeed and search rules
- R7. Fix existing test harness so `runScript` provides Surge globals by default (green test suite)
- R8. Fix stale comment regex test expectations to match the preserve-and-replace behavior

---

## Scope Boundaries

- The ratio filter is additive to existing filters (desc regex, nickname regex, counts threshold) — it does not replace them
- The ratio filter only applies to note-card endpoints (`/homefeed`, `/search/notes`), not to comment list endpoints
- Items without `likes` field are treated as `likes=0` and filtered out when ratio is active
- The global switches affect only the respective thresholds (counts vs ratio), not other filters

### Deferred to Follow-Up Work

- Applying ratio/counts thresholds to other note-returning endpoints (e.g., `/detailfeed/preload`, `/note/videofeed`) — these endpoints have different data structures and are out of scope
- Making the injection text customizable through arguments (per the preservation plan's Future Considerations)

---

## Context & Research

### Relevant Code and Patterns

- `getCachedCountsThreshold` at `xhs_fmz200.js:246-291` — the exact caching pattern to follow for the new ratio helper
- Homefeed filter block at `xhs_fmz200.js:525-617` — where the ratio threshold will be added (after step 5, the existing counts threshold block at lines 594-609)
- Search notes filter block at `xhs_fmz200.js:304-352` — where the global-switch-gated ratio/counts filters will be added
- `tests/helpers/run-script.js` — the VM test harness that needs Surge globals in default context
- `tests/xhs_fmz200.comment-regex-filtering.test.js` — tests with stale expectations from the preservation refactor

### Institutional Learnings

- `docs/solutions/logic-errors/xhs-regex-filtering-enhancement-2026-04-10.md` — established pattern for argument-driven filter features in this codebase
- `docs/plans/2026-05-23-001-feat-comment-regex-filter-plan.md` — reference for how a filter feature is structured end-to-end (plugin argument → script helper → filter logic → tests)
- `docs/plans/2026-06-23-001-fix-comment-regex-preservation-plan.md` — explains the behavior change that made comment regex tests stale

---

## Key Technical Decisions

- **Treat undefined/null likes as 0 (skip)**: Per user confirmation. Items without explicit `likes` count are filtered out when ratio threshold is active. This is the safer default since real note cards always have this field; if a non-note item is encountered, it's more likely noise than data worth preserving.
- **Threshold default 0 means disabled**: A ratio threshold of 0 keeps all items (since `ratio > 0` is almost always true). Setting threshold > 0 activates filtering. This avoids an extra "enabled/disabled" flag — the threshold value is self-gating.
- **Global switches gate search endpoint only**: When `false` (default), thresholds only apply to `/homefeed`. When `true`, they also apply to `/search/notes`. The global switch does NOT remove thresholds from `/homefeed` — it only extends their reach.
- **Nested `item.note` fields for search**: Search items store data under `item.note.*`. The ratio/counts helpers will check both `item.<field>` and `item.note.<field>` to handle both data structures.

---

## Implementation Units

### U1. Fix Test Infrastructure — Add Surge Globals to Default Context

**Goal:** Ensure `runScript` provides a Surge-like environment by default so `$.done()` terminates script execution cleanly (via `$done` callback) instead of allowing the script to continue into undefined `$response` territory.

**Requirements:** R7

**Dependencies:** None

**Files:**
- Modify: `tests/helpers/run-script.js`

**Approach:**
- Add `$httpClient: {}` and `$loon: undefined` to the default `context` object inside `runScript`, so `Env.isSurge()` returns `true` without requiring each test to pass `contextExtensions` manually.
- The `runSurgeScript` helper in comment-regex tests can remain as-is (it already works) or be simplified; either approach is valid since it just double-ensures the Surge context.

**Patterns to follow:**
- The existing `runSurgeScript` wrapper in `tests/xhs_fmz200.comment-regex-filtering.test.js:13-15`

**Test scenarios:**
- Test expectation: none — no behavioral change to tests, but all existing `$response`-based tests should now reach `$.done()` correctly instead of crashing

**Verification:**
- `bun test` shows the 3 `TypeError: undefined is not an object (evaluating '$response.body')` failures resolved (loglevel-classification, behavior-parity, replay-validation)

---

### U2. Update Comment Regex Tests to Match Preservation Behavior

**Goal:** Update stale test expectations that still assert the old "remove comments" behavior instead of the current "preserve and replace content" behavior.

**Requirements:** R8

**Dependencies:** U1 (to ensure safe test execution)

**Files:**
- Modify: `tests/xhs_fmz200.comment-regex-filtering.test.js`

**Approach:**
- Update the 6 occurrences of `"命中xhsplus的评论正则"` to `"命中xhs_comment_regex:"` to match the replacement prefix in `xhs_fmz200.js`
- Update the 11 assertions that check `toHaveLength(N)` to assert on content replacement instead:
  - Author matches: comments stay in array, their `content` is replaced — assert on `content` string, not length
  - General matches: comments stay in array — assert on `content` replacement
  - Sub-comment matches: sub-comments stay but content is replaced
- Specifically for AE1 test (author match on fixture with 4 comments): all 4 comments remain, author comment's content becomes `"命中xhs_comment_regex:^私$"`, its sub-comments are deleted

**Test scenarios:**
- Happy path: Author comment matching `^私$` results in content `"命中xhs_comment_regex:^私$"` and 4 comments remain
- Happy path: General comment matching "神经病" results in content replacement, comments array unchanged
- Edge case: Invalid regex gracefully handled, comments pass through unchanged
- Edge case: Empty regex arrays skip filtering entirely

**Verification:**
- `bun test` shows comment-regex-filtering tests passing (the 13 failures in this file resolved)

---

### U3. Add `getCachedCommentLikeRatioThreshold` Helper

**Goal:** Create a caching helper for the comment-to-likes ratio threshold value, following the same pattern as `getCachedCountsThreshold`.

**Requirements:** R1

**Dependencies:** None (standalone helper function)

**Files:**
- Modify: `xhs_fmz200.js`

**Approach:**
- Add a new `const getCachedCommentLikeRatioThreshold = (key, argValue) => { ... }` function near the existing caching helpers (after `getCachedCountsThreshold` at line 291)
- Follow the exact same pattern:
  1. Read cache via `$.getdata(key)`
  2. If argument provided and differs from cache → update cache, use argument
  3. If argument matches cache → use argument
  4. If no argument but cache exists → use cache
  5. If neither → default to `"0"`
  6. Parse with `parseFloat`, validate `!isNaN(result) && result >= 0`
  7. Return the number (or 0 as fallback)

**Patterns to follow:**
- `getCachedCountsThreshold` at `xhs_fmz200.js:246-291` — same caching logic, same cache key pattern, same try/catch/validation structure

**Test scenarios:**
- Happy path: Argument `"2.5"` returns `2.5`
- Edge case: Argument `""` or undefined returns `0`
- Edge case: Invalid argument `"abc"` returns `0` (with warning log)
- Cache persistence: Value set via cache is retrievable on later invocation
- Cache update: New argument value overwrites cached value

**Verification:**
- Unit-level verification through the test file created in U6

---

### U4. Apply Ratio Filter in Homefeed and Search with Global Switch

**Goal:** Implement the ratio threshold filter logic in `/homefeed` (always, when threshold > 0) and `/search/notes` (when threshold > 0 AND the global switch is true).

**Requirements:** R2, R3, R4

**Dependencies:** U3 (the helper must exist)

**Files:**
- Modify: `xhs_fmz200.js`

**Approach:**
**In `/homefeed` block** (after the existing counts threshold at line 609):
- Retrieve ratio threshold: `ratioThreshold = getCachedCommentLikeRatioThreshold("fmz200.xhs_comment_like_ratio_cache", runtimeArgument.xhs_comment_like_ratio_threshold)`
- Add filter step after step 5 (counts threshold) — this is a separate `if (ratioThreshold > 0)` block that checks the ratio:
  - Extract `likes` from `item?.likes` and `comments` from `item?.comments_count`
  - If `likes` is undefined/null/0 → `return false` (skip the item)
  - Else compute `ratio = comments / likes` and if `ratio <= ratioThreshold` → `return false`
- Store the global switch: `isGeneralRatio = runtimeArgument.xhs_general_comment_like_ratio_threshold` parsed as boolean

**In `/search/notes` block** (at line 318, inside the existing filter function):
- If `isGeneralRatio` is true AND `ratioThreshold > 0`:
  - Extract `likes` from `item?.note?.likes ?? item?.likes`
  - Extract `comments` from `item?.note?.comments_count ?? item?.comments_count`
  - Same filter logic as homefeed
- If `isGeneralCounts` is true AND counts threshold exists:
  - Apply the same counts threshold check but reading from `item?.note.<field>` as well
- Both filters respect the `item.note.*` nesting pattern of search results

**Note on boolean parsing:** Use a helper or inline check that handles both `true` (boolean) and `"true"` (string) since Loon switch arguments may arrive as either.

**Patterns to follow:**
- The counts threshold filter at `xhs_fmz200.js:594-609` — the same pattern of conditional check and `return false`

**Test scenarios:**
- Happy path: Item with `likes=100`, `comments_count=50`, threshold `1.0` → kept (ratio 0.5 ≤ 1.0)
- Happy path: Item with `likes=100`, `comments_count=150`, threshold `1.0` → skipped (ratio 1.5 > 1.0)
- Edge case: Item with `likes=0` → skipped (division-by-zero guard)
- Edge case: Item with `likes=undefined` → skipped
- Edge case: Item with `likes=100`, `comments_count=undefined` → `comments` treated as 0, ratio 0 ≤ threshold → kept (because threshold > 0 means ratio > threshold, 0 ≤ threshold so kept)
- Edge case: Threshold `0` (default) → all items pass ratio filter (since ratio > 0 is almost always true)
- Integration: Ratio filter applied in search only when global switch is true
- Integration: Both ratio and counts threshold applicable simultaneously in search when both switches are true

**Verification:**
- `bun test` passes with new ratio filter tests

---

### U5. Wire Global Counts Threshold in Search

**Goal:** When `xhs_general_counts_threshold` is true, apply the existing counts threshold filter to `/search/notes` items in addition to `/homefeed`.

**Requirements:** R5

**Dependencies:** U4 (same modification area in `/search/notes` block)

**Files:**
- Modify: `xhs_fmz200.js`

**Approach:**
- Parse `xhs_general_counts_threshold` from `runtimeArgument` as a boolean
- Inside `/search/notes` filter, if `isGeneralCounts` is true:
  - Reuse the already-retrieved `countsThreshold` from the earlier `getCachedCountsThreshold` call (or retrieve it again if needed — but the existing helper is already called before the filter, so it may need to be hoisted or re-fetched)
  - Check counts on `item?.note.<field>` (search nesting) or `item.<field>` (flat structure)
  - Same logic as lines 594-609:
    ```javascript
    if (countsThreshold.length === 5) {
      const [minLikes, minCollected, minComments, minShared, minNice] = countsThreshold;
      ...
    }
    ```

**Note:** The `getCachedCountsThreshold` call at lines 535-538 is inside the `/homefeed` block. If it needs to be shared with `/search/notes`, hoist it to the top-level or call it again inside the search block. Re-calling it is simpler and keeps scoping clean.

**Test scenarios:**
- Happy path: `xhs_general_counts_threshold=true`, search item with `comments_count < 10` → filtered out
- Default: `xhs_general_counts_threshold=false`, search item passes even if counts are low
- Edge case: Search item missing count fields → treated as below threshold → filtered out when switch is on

**Verification:**
- `bun test` passes

---

### U6. Wire Plugin Arguments in xiaohongshu.plugin

**Goal:** Ensure the plugin passes `xhs_comment_like_ratio_threshold` and `xhs_general_comment_like_ratio_threshold` arguments to the relevant script rules.

**Requirements:** R6

**Dependencies:** U4 (the script reads the arguments)

**Files:**
- Modify: `xiaohongshu.plugin`

**Approach:**
- Homefeed rule (line 76): Add `{xhs_comment_like_ratio_threshold}` and `{xhs_general_comment_like_ratio_threshold}` to the argument list
- Search notes rule (line 79): Add `{xhs_comment_like_ratio_threshold}` and `{xhs_general_comment_like_ratio_threshold}` to the argument list
- Also add `{xhs_general_counts_threshold}` to the search notes rule argument list (it's already implicitly on homefeed)

The updated homefeed rule argument becomes:
```
argument = [{xhs_des_regex},{xhs_nickname_regex},{xhs_counts_threshold},{xhs_comment_like_ratio_threshold},{xhs_general_comment_like_ratio_threshold},{xhs_loglevel}]
```

The updated search notes rule argument becomes:
```
argument = [{xhs_search_des_regex},{xhs_search_nickname_regex},{xhs_comment_like_ratio_threshold},{xhs_general_comment_like_ratio_threshold},{xhs_general_counts_threshold},{xhs_loglevel}]
```

**Test scenarios:**
- Test expectation: none — the plugin argument wiring test (`xiaohongshu-plugin-arguments.test.js`) validates that arguments declared in `[Argument]` appear in script rule argument lists; that test should continue to pass

**Verification:**
- `bun test` continues to pass after plugin modifications

---

### U7. Write Tests for Ratio Threshold Filter

**Goal:** Create comprehensive tests for the new ratio threshold filter behavior, covering both homefeed and search endpoints with all edge cases.

**Requirements:** R1, R2, R3, R4

**Dependencies:** U1, U3, U4, U5

**Files:**
- Create: `tests/xhs_fmz200.ratio-filter.test.js`
- Modify: `tests/fixtures/replay/homefeed.json` (add items with varied likes/comments for ratio testing)
- Modify: `tests/fixtures/replay/search-notes.json` (add items with count fields for ratio testing)

**Approach:**
- Create test fixtures with items having various `likes` and `comments_count` values
- Add fixtures to the existing replay fixtures or inline them
- Test the ratio filter at the unit level (via the helper) and integration level (via `runScript`)
- Test both the absence of filtering (threshold=0) and active filtering (threshold>0)
- Test the global switch behavior (false=homefeed only, true=homefeed+search)

**Test scenarios:**
- **Helper unit tests:**
  - Happy path: `getCachedCommentLikeRatioThreshold` returns parsed float from argument
  - Edge case: Invalid argument returns 0
  - Edge case: Missing argument falls back to cache
  - Edge case: Cache miss returns 0

- **Homefeed integration tests:**
  - Happy path: threshold 0, items with all ratio values pass through
  - Happy path: threshold 1.0, item with ratio 1.5 filtered out
  - Happy path: threshold 1.0, item with ratio 0.5 passes through
  - Edge case: item with `likes=0` filtered out
  - Edge case: item with `likes=undefined` filtered out
  - Edge case: item with `likes=null` filtered out
  - Edge case: item with `comments_count=undefined` but `likes>0` passes through (ratio 0 ≤ threshold)
  - Integration: threshold filter works alongside existing desc/nickname/counts filters

- **Search integration tests:**
  - Default (`general_switch=false`): items pass ratio filter regardless of ratio values
  - Global switch on (`general_switch=true`): ratio filter applies with same behavior as homefeed
  - Global switch on: nested `item.note.likes` and `item.note.comments_count` are checked

- **Counts threshold global tests:**
  - Default (`general_counts_switch=false`): search items pass counts filter regardless
  - Global switch on: counts filter applies to search with nested field access

**Verification:**
- `bun test` shows all tests passing (both existing and new)

---

## System-Wide Impact

- **Interaction graph:** The ratio filter adds a new `return false` branch in the homefeed and search filter chains. It operates independently of existing regex/nickname/counts filters and does not affect comment processing or video feed endpoints.
- **Error propagation:** Parse failures in the threshold argument are handled silently (falls back to 0 = disabled). Missing fields on items result in filtering out (safe default).
- **API surface parity:** The same ratio threshold logic applies to homefeed (always) and search (when global switch is on). Data field access differs (`item.<field>` vs `item.note.<field>`) but the mathematical check is identical.
- **Unchanged invariants:** Comment list processing (`/api/sns/v5/note/comment/list`, `/api/sns/v3/note/comment/sub_comments`) is not affected. Video feed processing (`/note/videofeed`, `/note/feed`, `/note/imagefeed`) is not affected. Preload processing is not affected.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Search note items may not have `likes`/`comments_count` in all cases (e.g., ad cards that passed model_type filter) | Treat missing likes as 0 → filtered out; safe default since only `model_type=note` items should reach this filter |
| Loon switch arguments may arrive as string `"true"` vs boolean `true` | Use dual check: `val === true || val === "true"` for robust boolean parsing |
| Tests still failing from preservation refactor could mask new regressions | U1+U2 are prerequisites tackled first; the new feature is built on a green test suite |

---

## Documentation / Operational Notes

- The ratio threshold appears as `xhs_comment_like_ratio_threshold` in the plugin UI. Users set it to a number (e.g., `2` means "skip notes with more than 2 comments per like") or `0` to disable.
- The global switches appear as toggles: `xhs_general_comment_like_ratio_threshold` (extend ratio filter to search) and `xhs_general_counts_threshold` (extend counts filter to search).

---

## Sources & References

- **Existing plan (preservation refactor):** `docs/plans/2026-06-23-001-fix-comment-regex-preservation-plan.md` — explains the behavior change that made comment regex tests stale
- **Related code:** `xhs_fmz200.js:246-291` (`getCachedCountsThreshold` — pattern to follow), `xhs_fmz200.js:594-609` (counts threshold filter — pattern to follow)
- **Test helper:** `tests/helpers/run-script.js` — the VM harness to fix