#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Sync Chrome IP For AI
# @raycast.mode silent
# @raycast.packageName Tools

# Optional parameters:
# @raycast.icon 🌐
# @raycast.description Quit Chrome, fetch current public IP from ipinfo.io, and update Chrome Local State

CHROME_STATE="~/Library/Application Support/Google/Chrome/Local State"

quit_chrome() {
  if pgrep -x "Google Chrome" > /dev/null 2>&1; then
    osascript -e 'quit app "Google Chrome"' 2>/dev/null
    for i in {1..10}; do
      if ! pgrep -x "Google Chrome" > /dev/null 2>&1; then
        break
      fi
      sleep 0.5
    done
    if pgrep -x "Google Chrome" > /dev/null 2>&1; then
      echo "Error: Chrome did not quit within timeout" >&2
      exit 1
    fi
  fi
}

fetch_ip() {
  local response
  response=$(curl -s --max-time 5 https://ipinfo.io/json 2>/dev/null)
  if [ $? -ne 0 ] || [ -z "$response" ]; then
    echo "Error: Failed to fetch IP from ipinfo.io" >&2
    exit 1
  fi
  local ip
  ip=$(echo "$response" | /usr/bin/jq -r '.ip // empty' 2>/dev/null)
  if [ -z "$ip" ]; then
    echo "Error: No IP found in ipinfo.io response" >&2
    exit 1
  fi
  echo "$ip"
}

update_local_state() {
  local ip="$1"
  local tmp_file
  tmp_file="${CHROME_STATE}.tmp.$$"

  if [ ! -f "$CHROME_STATE" ]; then
    echo "Error: Chrome Local State file not found at $CHROME_STATE" >&2
    exit 1
  fi

  /usr/bin/jq --arg ip "$ip" \
    '.variations_permanent_consistency_country[0] = $ip' \
    "$CHROME_STATE" > "$tmp_file" 2>/dev/null

  if [ $? -ne 0 ]; then
    rm -f "$tmp_file"
    echo "Error: Failed to update Chrome Local State JSON" >&2
    exit 1
  fi

  mv "$tmp_file" "$CHROME_STATE"
  if [ $? -ne 0 ]; then
    echo "Error: Failed to write updated Chrome Local State" >&2
    exit 1
  fi
}

quit_chrome
current_ip=$(fetch_ip)
update_local_state "$current_ip"
