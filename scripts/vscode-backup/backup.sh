#!/bin/bash

# VS Code Backup Script for WSL/Project
# This script will backup your extensions list and settings into the project.

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_FILE="$BACKUP_DIR/data/extensions/vscode_extensions.txt"
ANTIGRAVITY_EXT_FILE="$BACKUP_DIR/data/extensions/antigravity_extensions.txt"
CONFIG_DIR="$BACKUP_DIR/data/config"

echo "📦 Starting VS Code Backup..."

# Create directories just in case
mkdir -p "$BACKUP_DIR/data/extensions" "$BACKUP_DIR/data/config"

# 1. Backup Local VS Code Extensions
if command -v code &> /dev/null; then
    echo "🔍 Exporting local VS Code extensions..."
    code --list-extensions > "$EXT_FILE"
    echo "✅ Saved to $EXT_FILE"
else
    echo "⚠️ 'code' command not found. Skipping local extension export."
fi

# 2. Backup Antigravity Server Extensions
ANTIGRAVITY_EXT_PATH="/home/fahcreza/.antigravity-server/extensions"
if [ -d "$ANTIGRAVITY_EXT_PATH" ]; then
    echo "🔍 Exporting Antigravity Server extensions..."
    # Grabbing just the extension IDs (removing version suffixes if possible, or keeping full names)
    ls "$ANTIGRAVITY_EXT_PATH" | grep -v "extensions.json" > "$ANTIGRAVITY_EXT_FILE"
    echo "✅ Saved to $ANTIGRAVITY_EXT_FILE"
else
    echo "⚠️ Antigravity extensions path not found. Skipping."
fi

# 3. Backup Windows VS Code Config (WSL path)
WINDOWS_USER_CONFIG="/mnt/c/Users/Administrator/AppData/Roaming/Code/User"
if [ -d "$WINDOWS_USER_CONFIG" ]; then
    echo "🔍 Copying Windows VS Code settings..."
    cp "$WINDOWS_USER_CONFIG/settings.json" "$CONFIG_DIR/" 2>/dev/null
    cp "$WINDOWS_USER_CONFIG/keybindings.json" "$CONFIG_DIR/" 2>/dev/null
    if [ -d "$WINDOWS_USER_CONFIG/snippets" ]; then
        cp -r "$WINDOWS_USER_CONFIG/snippets" "$CONFIG_DIR/" 2>/dev/null
    fi
    echo "✅ Config files copied to $CONFIG_DIR"
else
    echo "⚠️ Windows VS Code config path not found at $WINDOWS_USER_CONFIG."
fi

echo "✨ Backup Complete! Folder: scripts/vscode-backup/data"
echo "👉 Don't forget to commit these files to your Git repository."
