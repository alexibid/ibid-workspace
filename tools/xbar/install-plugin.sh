#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_FILE="$SCRIPT_DIR/ibid-runner.10s.sh"

XBAR_DIR="$HOME/Library/Application Support/xbar/plugins"
SWIFTBAR_DIR="$HOME/Library/Application Support/SwiftBar/Plugins"

TARGET_DIR=""

if [ -d "$XBAR_DIR" ] || [ -d "$HOME/Library/Application Support/xbar" ]; then
  TARGET_DIR="$XBAR_DIR"
elif [ -d "$SWIFTBAR_DIR" ] || [ -d "$HOME/Library/Application Support/SwiftBar" ]; then
  TARGET_DIR="$SWIFTBAR_DIR"
else
  TARGET_DIR="$XBAR_DIR"
fi

mkdir -p "$TARGET_DIR"
chmod +x "$PLUGIN_FILE"

ln -sf "$PLUGIN_FILE" "$TARGET_DIR/ibid-runner.10s.sh"

echo "Plugin linked to: $TARGET_DIR/ibid-runner.10s.sh"
echo "Open xbar and click 'Refresh all' to see the icon."
