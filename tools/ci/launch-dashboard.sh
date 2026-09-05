#!/bin/bash

WORKSPACE_DIR="${WORKSPACE_DIR:-$HOME/Projects/ibid-workspace}"
export PATH="$HOME/.n/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

osascript <<EOF
tell application "Terminal"
  activate

  set targetWindow to missing value
  set targetState to "none"

  repeat with w in windows
    try
      set tTitle to ""
      try
        set tTitle to custom title of selected tab of w
      end try
      set wName to name of w
      if tTitle contains "ibid-ci-dashboard" or wName contains "ibid-ci-dashboard" or wName contains "CI Dashboard" then
        set p to processes of selected tab of w
        if targetWindow is missing value then
          set targetWindow to w
          if (p as string) contains "tmux" then
            set targetState to "running"
          else
            set targetState to "idle"
          end if
        else
          if (p as string) does not contain "tmux" then
            try
              close w saving no
            end try
          end if
        end if
      end if
    end try
  end repeat

  if targetWindow is not missing value then
    try
      set current settings of selected tab of targetWindow to settings set "Pro"
      set font size of selected tab of targetWindow to 12
    end try
    set index of targetWindow to 1
    if targetState is "running" then
      activate
      return
    else
      do script "exec bash '${WORKSPACE_DIR}/tools/ci/dashboard.sh'" in targetWindow
      activate
      return
    end if
  end if

  set canReuseFront to false
  if (count of windows) > 0 then
    try
      set p to processes of selected tab of front window
      if (count of p) = 1 and (item 1 of p is "zsh" or item 1 of p is "bash") then
        set canReuseFront to true
      end if
    end try
  end if

  if canReuseFront then
    try
      set current settings of selected tab of front window to settings set "Pro"
      set font size of selected tab of front window to 12
    end try
    set custom title of selected tab of front window to "ibid-ci-dashboard"
    do script "exec bash '${WORKSPACE_DIR}/tools/ci/dashboard.sh'" in front window
  else
    set newTab to do script "exec bash '${WORKSPACE_DIR}/tools/ci/dashboard.sh'"
    try
      set current settings of newTab to settings set "Pro"
      set font size of newTab to 12
      set custom title of newTab to "ibid-ci-dashboard"
    end try
  end if
  activate
end tell
EOF
