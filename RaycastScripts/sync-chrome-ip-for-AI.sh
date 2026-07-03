#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Sync Chrome IP For AI
# @raycast.mode silent
# @raycast.packageName Tools

# Optional parameters:
# @raycast.icon https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/GoogleGemini.png
# @raycast.description Quit Chrome, fetch current public IP from ipinfo.io, and update Chrome Local State

CHROME_STATE="$HOME/Library/Application Support/Google/Chrome/Local State"

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

fetch_ip_and_country() {
  local response ip country
  
  # Try ipwho.is (highly reliable, no strict rate limit for small tools)
  response=$(curl -s --max-time 5 "https://ipwho.is/" 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$response" ]; then
    ip=$(echo "$response" | /usr/bin/jq -r '.ip // empty' 2>/dev/null)
    country=$(echo "$response" | /usr/bin/jq -r '.country_code // empty' 2>/dev/null | tr '[:upper:]' '[:lower:]')
  fi

  # Fallback to ipinfo.io if ipwho.is fails or country is empty
  if [ -z "$ip" ] || [ -z "$country" ]; then
    response=$(curl -s --max-time 5 "https://ipinfo.io/json" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$response" ]; then
      ip=$(echo "$response" | /usr/bin/jq -r '.ip // empty' 2>/dev/null)
      country=$(echo "$response" | /usr/bin/jq -r '.country // empty' 2>/dev/null | tr '[:upper:]' '[:lower:]')
    fi
  fi

  # Emergency fallback (only IP, default US country)
  if [ -z "$ip" ] || [[ ! "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ip=$(curl -s --max-time 5 "https://api.ipify.org" 2>/dev/null)
    country="us"
  fi

  if [ -z "$ip" ] || [[ ! "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Failed to fetch a valid public IP" >&2
    exit 1
  fi
  
  # Return space-separated "IP COUNTRY"
  echo "$ip $country"
}

update_local_state() {
  local ip="$1"
  local country="$2"
  local tmp_file
  tmp_file="${CHROME_STATE}.tmp.$$"

  if [ ! -f "$CHROME_STATE" ]; then
    echo "Error: Chrome Local State file not found at $CHROME_STATE" >&2
    exit 1
  fi

  # Update both the variations_permanent_consistency_country array and general country keys
  /usr/bin/jq --arg ip "$ip" --arg country "$country" \
    '.variations_permanent_consistency_country[0] = $ip |
     .variations_permanent_consistency_country[1] = $country |
     .variations_country = $country |
     .variations_safe_seed_permanent_consistency_country = $country |
     .variations_safe_seed_session_consistency_country = $country' \
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
read -r current_ip country <<< "$(fetch_ip_and_country)"
update_local_state "$current_ip" "$country"

if [ "$country" = "us" ]; then
  echo "Successfully synced Chrome IP to: $current_ip ($country) - MATCH US"
else
  echo "Successfully synced Chrome IP to: $current_ip ($country) - NO MATCH US"
fi
