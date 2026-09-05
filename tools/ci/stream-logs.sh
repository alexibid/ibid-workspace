#!/bin/bash

WORKSPACE_DIR="${WORKSPACE_DIR:-$HOME/Projects/ibid-workspace}"
SERVICE_LABEL="${SERVICE_LABEL:-actions.runner.alexibid-ibid-workspace.MAC_ALEX}"
LOG_FILE="$HOME/Library/Logs/$SERVICE_LABEL/stdout.log"
export PATH="$HOME/.n/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

trap "exit 0" SIGINT SIGTERM

echo -e "\x1b[1;38;2;88;166;255m=== ibid-workspace · CI Log Streamer ===\x1b[0m\n"

if [ -f "$LOG_FILE" ]; then
  echo -e "\x1b[1mRecent runner output:\x1b[0m"
  echo -e "\x1b[38;2;139;148;158m--------------------------------------------------\x1b[0m"
  tail -n 15 "$LOG_FILE" 2>/dev/null
  echo -e "\x1b[38;2;139;148;158m--------------------------------------------------\x1b[0m\n"
fi

LAST_STATE=""

while true; do
  IS_LOCAL_RUNNING=false
  if pgrep -f "Runner.Worker" > /dev/null 2>&1; then
    IS_LOCAL_RUNNING=true
  fi

  if [ "$IS_LOCAL_RUNNING" = true ] && [ -f "$LOG_FILE" ]; then
    LAST_STATE="local"
    echo -e "\x1b[38;2;63;185;80m● Active local execution on runner (MAC ALEX):\x1b[0m"
    echo -e "\x1b[38;2;139;148;158m--------------------------------------------------\x1b[0m"
    tail -n 10 -f "$LOG_FILE"
    echo -e "\n\x1b[38;2;241;224;90m--- Local step completed ---\x1b[0m\n"
    sleep 2
    continue
  fi

  ACTIVE_RUN_ID=$(gh run list --repo alexibid/ibid-workspace --limit 5 --json databaseId,status \
    --jq '.[] | select(.status=="in_progress" or .status=="queued") | .databaseId' 2>/dev/null | head -n 1)

  if [ -n "$ACTIVE_RUN_ID" ]; then
    LAST_STATE="github"
    echo -e "\x1b[38;2;241;224;90m● Active execution on GitHub Actions (#$ACTIVE_RUN_ID):\x1b[0m"
    echo -e "\x1b[38;2;139;148;158m--------------------------------------------------\x1b[0m"
    gh run watch "$ACTIVE_RUN_ID" --repo alexibid/ibid-workspace --exit-status
    echo -e "\n\x1b[38;2;63;185;80m✔ Run #$ACTIVE_RUN_ID finished.\x1b[0m\n"
    sleep 3
    continue
  fi

  if [ "$LAST_STATE" != "idle" ]; then
    LAST_STATE="idle"
    TIMESTAMP=$(date +"%H:%M:%S")
    echo -e "\x1b[38;2;139;148;158m[$TIMESTAMP] No active runs · Waiting for next CI run...\x1b[0m"
  fi

  sleep 4
done
