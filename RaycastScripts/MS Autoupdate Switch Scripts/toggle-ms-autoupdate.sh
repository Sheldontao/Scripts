#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle MS AutoUpdate (Safe)
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.author LeonardoX (Modified by AI)
# @raycast.authorURL https://raycast.com/LeonardoX

# ---
# This script safely toggles Microsoft AutoUpdate by renaming files
# instead of deleting them, making the process fully reversible.
# ---

# Suffix to add to disabled files and folders
DISABLED_SUFFIX=".disabled"

# Function to check if AutoUpdate is currently disabled
is_disabled() {
    # Check for any file/folder with the .disabled suffix in the target locations
    if ls /Library/{PrivilegedHelperTools,Launch{Agents,Daemons}}/com.microsoft.*update*.plist${DISABLED_SUFFIX} >/dev/null 2>&1 || \
       ls "$HOME"/Library/Microsoft/*Updater${DISABLED_SUFFIX} >/dev/null 2>&1; then
        return 0 # 0 means true (is disabled)
    else
        return 1 # 1 means false (is not disabled)
    fi
}

# --- Main Logic ---

if is_disabled; then
    # --- ENABLE AUTOUPDATE ---
    echo "🔓 Enabling Microsoft AutoUpdate..."
    
    # Use sudo for system-level files. It will ask for password only once.
    sudo -v
    
    # Restore system-wide files
    for F in /Library/{PrivilegedHelperTools,Launch{Agents,Daemons}}/com.microsoft.*update*.plist${DISABLED_SUFFIX}; do
        if [ -e "$F" ]; then
            ORIGINAL_NAME="${F%${DISABLED_SUFFIX}}"
            echo "   Restoring ${ORIGINAL_NAME}..."
            sudo mv "$F" "$ORIGINAL_NAME"
        fi
    done
    
    # Restore user-specific files
    for F in "$HOME"/Library/Microsoft/*Updater${DISABLED_SUFFIX}; do
         if [ -e "$F" ]; then
            ORIGINAL_NAME="${F%${DISABLED_SUFFIX}}"
            echo "   Restoring ${ORIGINAL_NAME}..."
            mv "$F" "$ORIGINAL_NAME"
        fi
    done

    echo "✅ Microsoft AutoUpdate has been enabled."
    echo "   You may need to restart your Mac for changes to take full effect."

else
    # --- DISABLE AUTOUPDATE ---
    echo "🔒 Disabling Microsoft AutoUpdate..."
    
    # Use sudo for system-level files.
    sudo -v

    # Disable system-wide files
    for F in /Library/{PrivilegedHelperTools,Launch{Agents,Daemons}}/com.microsoft.*update*.plist; do
        if [ -e "$F" ]; then
            echo "   Disabling ${F}..."
            sudo mv "$F" "$F${DISABLED_SUFFIX}"
        fi
    done
    
    # Disable user-specific files
    for F in "$HOME"/Library/Microsoft/*Updater; do
         if [ -e "$F" ]; then
            echo "   Disabling ${F}..."
            mv "$F" "$F${DISABLED_SUFFIX}"
        fi
    done

    echo "✅ Microsoft AutoUpdate has been disabled."
fi
