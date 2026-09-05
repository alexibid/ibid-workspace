#!/bin/bash

WORKSPACE_DIR="${WORKSPACE_DIR:-$HOME/Projects/ibid-workspace}"
export PATH="$HOME/.n/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux not found in PATH."
  read -p "Press Enter to close..."
  exit 1
fi

printf '\033]2;ibid-ci-dashboard\007' 2>/dev/null || true
printf '\033]11;#000000\007' 2>/dev/null || true

SESSION_NAME="ibid-ci-dashboard"

# If session does not exist, create it with split panes
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux new-session -d -s "$SESSION_NAME" -n "CI Dashboard" \
    "node '$WORKSPACE_DIR/tools/ci/flow.mjs' --watch"

  tmux set-option -t "$SESSION_NAME" -g mouse on
  tmux set-option -t "$SESSION_NAME" -g status on
  tmux set-option -t "$SESSION_NAME" -g set-titles on
  tmux set-option -t "$SESSION_NAME" -g set-titles-string "ibid-ci-dashboard"
  tmux set-option -t "$SESSION_NAME" -g window-style "bg=#000000,fg=#f0f6fc"
  tmux set-option -t "$SESSION_NAME" -g window-active-style "bg=#000000,fg=#f0f6fc"
  tmux set-option -t "$SESSION_NAME" -g status-style "bg=#161b22,fg=#f0f6fc"
  tmux set-option -t "$SESSION_NAME" -g pane-border-style "fg=#30363d"
  tmux set-option -t "$SESSION_NAME" -g pane-active-border-style "fg=#58a6ff"
  tmux set-option -t "$SESSION_NAME" -g status-left "#[bold,fg=#58a6ff] ibid-workspace #[nobold,fg=#8b949e]· CI Dashboard "
  tmux set-option -t "$SESSION_NAME" -g status-left-length 40
  tmux set-option -t "$SESSION_NAME" -g status-right "#[fg=#8b949e]Drag divider with mouse | [Ctrl+b d] Close "
  tmux set-option -t "$SESSION_NAME" -g status-right-length 80
  tmux set-option -t "$SESSION_NAME" -g remain-on-exit off

  tmux split-window -h -t "$SESSION_NAME" -p 58 \
    "bash '$WORKSPACE_DIR/tools/ci/stream-logs.sh'"
fi

tmux set-option -t "$SESSION_NAME" -g window-style "bg=#000000,fg=#f0f6fc" 2>/dev/null || true
tmux set-option -t "$SESSION_NAME" -g window-active-style "bg=#000000,fg=#f0f6fc" 2>/dev/null || true
tmux set-option -t "$SESSION_NAME" -g status-style "bg=#161b22,fg=#f0f6fc" 2>/dev/null || true

# Attach to the session
tmux attach-session -t "$SESSION_NAME"

# Cleanly close this Terminal window upon exit or detach
osascript -e 'tell application "Terminal" to close (every window whose name contains "ibid-ci-dashboard" or custom title of selected tab contains "ibid-ci-dashboard")' 2>/dev/null || true
