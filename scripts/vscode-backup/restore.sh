#!/bin/bash

# VS Code Restore Script
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_FILE="$BACKUP_DIR/data/extensions/vscode_extensions.txt"
CONFIG_DIR="$BACKUP_DIR/data/config"

echo "🚀 Starting Restoration..."

# 1. Restore Extensions
if [ -f "$EXT_FILE" ]; then
    echo "📥 Installing extensions from $EXT_FILE..."
    while read line; do
        if [ ! -z "$line" ]; then
            echo "Installing $line..."
            code --install-extension "$line"
        fi
    done < "$EXT_FILE"
else
    echo "⚠️ Extension list not found at $EXT_FILE."
fi

# 2. Restore Config
WINDOWS_USER_CONFIG="/mnt/c/Users/Administrator/AppData/Roaming/Code/User"
if [ -d "$WINDOWS_USER_CONFIG" ]; then
    echo "📤 Moving config files back to Windows..."
    [ -f "$CONFIG_DIR/settings.json" ] && cp "$CONFIG_DIR/settings.json" "$WINDOWS_USER_CONFIG/"
    [ -f "$CONFIG_DIR/keybindings.json" ] && cp "$CONFIG_DIR/keybindings.json" "$WINDOWS_USER_CONFIG/"
    [ -d "$CONFIG_DIR/snippets" ] && cp -r "$CONFIG_DIR/snippets" "$WINDOWS_USER_CONFIG/"
    echo "✅ Done."
else
    echo "⚠️ Could not find Windows VS Code config path to restore to ($WINDOWS_USER_CONFIG)."
    echo "Make sure VS Code is installed and has been opened at least once."
fi

echo "🏁 Restoration Process Finished."
echo "Note: Antigravity Server extensions are usually handled during the server installation process."
