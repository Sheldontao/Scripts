---
title: "feat: Raycast script to sync Chrome Local State with current public IP"
status: active
created: 2026-05-17
type: feat
depth: lightweight
---

# feat: Raycast Script to Sync Chrome Local State with Current Public IP

**Target:** Raycast script command (user-local, outside repo)

## Summary

Create a Raycast Bash script command that fully quits Chrome, fetches the current public IP from ipinfo.io, and replaces only the IP (first element) in the `variations_permanent_consistency_country` array within Chrome's `Local State` file, preserving the existing country code.

## Problem Frame

Chrome stores a detected user IP and country code in `variations_permanent_consistency_country` within `Local State`. When the network environment changes (e.g., VPN, roaming), the stale IP persists, which may affect Chrome's variation/experiment assignments. This script provides a one-shot IP refresh: quit Chrome → fetch current IP → update only the IP element in the array, leaving the country code intact.

## Scope Boundaries

- **In scope:** A single Raycast script command written in Bash. Full quit of Chrome. Fetch from ipinfo.io. JSON update via `jq` with atomic write.
- **Not in scope:** Scheduled/periodic execution (the user triggers manually via Raycast). Chrome re-launch after update. Multi-profile or multi-instance Chrome handling.

## Success Criteria

1. Running the script from Raycast fully quits Chrome without error
2. The script fetches the current public IP from ipinfo.io
3. Only the IP (first element) of `variations_permanent_consistency_country` is updated; the country code is preserved
4. Re-launching Chrome shows the new IP is persisted

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Script language | Bash | Matches user's default Raycast script template. Raycast natively supports executable scripts with `@raycast.*` metadata headers. |
| JSON manipulation | `jq` | Available at `/usr/bin/jq`. Succinct for single-key updates. More robust than `sed` on JSON. |
| Atomic write | Write to temp file, then `mv` | Prevents corruption if Chrome or another process reads the file mid-write. `mv` is atomic on the same filesystem. |
| Chrome quit | `osascript -e 'quit app "Google Chrome"'` | Standard macOS API for graceful app termination. Blocks until Chrome is fully quit. |
| IP/geo API | `https://ipinfo.io/json` | Returns `ip` and `country` in a single request. No auth required. <1s response. |

## Dependencies / Prerequisites

- `jq` must be available at `/usr/bin/jq` (macOS default with Homebrew)
- `curl` must be available (macOS default)
- The Raycast Script Commands feature must be configured with a directory

## Implementation Units

### U1. Create Raycast Script Command

**Goal:** Create an executable Bash script with Raycast metadata headers that quits Chrome, fetches IP info, and updates `Local State`.

**Dependencies:** None

**Files:**
- `<raycast-scripts-dir>/sync-chrome-ip.sh` (create; path determined at setup)

**Approach:**

1. The script starts with Raycast metadata headers (`@raycast.schemaVersion 1`, `@raycast.title Sync Chrome IP`, `@raycast.mode silent`, `@raycast.icon`)
2. Use `osascript` to quit Chrome gracefully with a timeout guard
3. `curl -s https://ipinfo.io/json` and parse with `jq` to extract `.ip`
4. Read the existing `variations_permanent_consistency_country` from `Local State` and keep the country code (index 1)
5. Use `jq` to replace only index 0 of the array, preserving index 1:
   ```bash
   jq --arg ip "<ip>" \
     '.variations_permanent_consistency_country[0] = $ip' \
     "$STATE_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$STATE_FILE"
   ```
6. Handle failure: if curl fails or returns empty, exit with non-zero and show an error notification

**Patterns to follow:**
- Raycast script metadata conventions from `/raycast/script-commands/documentation/CREATE-YOUR-OWN-SCRIPT-COMMANDS.md`
- Atomic file write pattern using temp file + `mv`

**Test scenarios:**
1. **Happy path:** Chrome is running. Script quits Chrome, fetches valid IP from ipinfo.io, replaces index 0 of `variations_permanent_consistency_country` with new IP while index 1 (country code) stays unchanged.
2. **Chrome not running:** Chrome is already quit. Script skips quit, fetches IP, updates file successfully.
3. **Network failure:** No internet. `curl` fails. Script exits with error, does not modify `Local State`. Error message is surfaced.
4. **ipinfo.io returns unexpected format:** API response missing `ip` or `country` field. Script exits with error, no modification.
5. **Local State file missing or unreadable:** Script detects missing file, exits with error. No silent creation of a malformed file.
6. **Concurrent write safety:** Use temp file on same filesystem + atomic `mv`. Verify no partial writes seen by a concurrent reader.

**Verification:**
- Run the script directly (not via Raycast): `bash <raycast-scripts-dir>/sync-chrome-ip.sh`
- Check `Local State`: `jq '.variations_permanent_consistency_country' "/Users/leonardox/Library/Application Support/Google/Chrome/Local State"`
- Confirm first element matches `curl -s https://ipinfo.io/json | jq -r '.ip'`
- Confirm second element (country code) is preserved and unchanged

### U2. Verify Raycast Integration

**Goal:** Confirm the script is discoverable and executable from the Raycast launcher.

**Dependencies:** U1

**Files:** None (verification only)

**Approach:**

1. Configure Raycast Script Commands to watch the directory containing the script
2. Open Raycast, search for "Sync Chrome IP"
3. Execute the command
4. Verify Chrome quits and re-launch Chrome to confirm `Local State` was updated

**Test scenarios:**
1. **Raycast discovery:** After configuring the scripts directory, "Sync Chrome IP" appears in Raycast root search
2. **End-to-end execution:** Running from Raycast produces the same result as running from terminal
3. **Notification feedback:** The `silent` mode completes without visible output (no dialog, no notification). If error notification via `osascript -e 'display notification'` is desired, verify it appears.

**Verification:**
- Script appears in Raycast search results
- After execution, `jq '.variations_permanent_consistency_country' <Local State>` shows new IP with country code unchanged
- Chrome re-launches without issues and retains the new values

## Assumptions

- The Raycast Script Commands directory will be configured by the user (e.g., `~/Documents/raycast-scripts/` or similar). The plan uses `<raycast-scripts-dir>` as a placeholder.
- The `Local State` file path is fixed at `/Users/leonardox/Library/Application Support/Google/Chrome/Local State`.
- Chrome's file locking does not conflict with the script (Chrome is fully quit before any write).
- `jq` is available at `/usr/bin/jq`. If only available via Homebrew (`/opt/homebrew/bin/jq`), the script resolves it via `PATH` or absolute path.

## Deferred to Implementation

- Should the script display a success notification (Raycast `silent` mode vs `notification` mode)?
- Should the script re-launch Chrome after updating? (User can re-launch manually.)
- Exact temp file path for atomic write (e.g., sibling file with `.tmp` suffix).
