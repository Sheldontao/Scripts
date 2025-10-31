#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title toggle ms autoupdate
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.author LeonardoX
# @raycast.authorURL https://raycast.com/LeonardoX

# Define a state file path inside the script's directory
STATE_FILE="$(dirname "$0")/.autoupdate_state"

# Check current state
if [ -f "$STATE_FILE" ]; then
    CURRENT_STATE=$(cat "$STATE_FILE")
else
    # Default to enabled if state file doesn't exist
    CURRENT_STATE="enabled"
fi

if [ "$CURRENT_STATE" = "enabled" ]; then
    # --- DISABLE AUTOUPDATE ---
    echo "🔒 Disabling Microsoft AutoUpdate..."
    
    # Process system-wide files
    for F in /Library/{PrivilegedHelperTools,Launch{Agents,Daemons}}/com.microsoft.*update*.plist; do
        if [ -e "$F" ]; then # Check if file or folder exists
            echo "Processing ${F}..."
            rm -rf "${F}" && mkdir "${F}" && chflags uchg "${F}"
        fi
    done
    
    # Process user-specific files
    for F in "$HOME"/Library/Microsoft/*Updater; do
         if [ -e "$F" ]; then
            echo "Processing ${F}..."
            rm -rf "${F}" && mkdir "${F}" && chflags uchg "${F}"
        fi
    done

    echo "✅ Microsoft AutoUpdate disabled and locked."
    echo "disabled" > "$STATE_FILE"

else
    # --- ENABLE AUTOUPDATE ---
    echo "🔓 Re-enabling Microsoft AutoUpdate..."
    
    # Process system-wide files
    for F in /Library/{PrivilegedHelperTools,Launch{Agents,Daemons}}/com.microsoft.*update*.plist; do
        if [ -e "$F" ]; then
            echo "Unlocking ${F}..."
            chflags nouchg "${F}" && rm -rf "${F}"
        fi
    done

    # Process user-specific files
    for F in "$HOME"/Library/Microsoft/*Updater; do
        if [ -e "$F" ]; then
            echo "Unlocking ${F}..."
            chflags nouchg "${F}" && rm -rf "${F}"
        fi
    done

    echo "✅ Microsoft AutoUpdate unlocked. Re-run the Office installer to restore it."
    # Remove state file to reset to default on next run
    rm -f "$STATE_FILE"
fi
