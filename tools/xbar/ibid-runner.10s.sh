#!/bin/bash

# <xbar.title>IBID Workspace Runner & Delivery</xbar.title>
# <xbar.version>v1.1.0</xbar.version>
# <xbar.author>alexibid</xbar.author>
# <xbar.author.github>alexibid</xbar.author.github>
# <xbar.desc>Controls the macOS background runner and local Google Drive build delivery for ibid-workspace</xbar.desc>
# <xbar.dependencies>bash,launchctl</xbar.dependencies>

SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
DETECTED_LABEL=$(launchctl list 2>/dev/null | grep -oE 'actions\.runner\.[^ \t]+' | head -n 1)
if [ -z "$DETECTED_LABEL" ]; then
  PLIST_FILE=$(find "$HOME/Library/LaunchAgents" -name "actions.runner.*.plist" 2>/dev/null | head -n 1)
  if [ -n "$PLIST_FILE" ]; then
    DETECTED_LABEL=$(basename "$PLIST_FILE" .plist)
  fi
fi
SERVICE_LABEL="${SERVICE_LABEL:-${DETECTED_LABEL:-actions.runner.alexibid-ibid-workspace.MAC_ALEX}}"
WORKSPACE_DIR="${WORKSPACE_DIR:-$HOME/Projects/ibid-workspace}"
GDRIVE_DIR="${GDRIVE_DIR:-$HOME/Google Drive/My Drive/ibid-builds}"
LOG_FILE="$HOME/Library/Logs/$SERVICE_LABEL/stdout.log"
export PATH="$HOME/.n/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

validate_app() {
  case "$1" in
    oh-save-me|camila|boilerplate|all) ;;
    *)
      echo "Error: Invalid project name '$1'" >&2
      exit 1
      ;;
  esac
}

notify_user() {
  local msg="$1"
  local sub="$2"
  local snd="${3:-}"
  if [ -n "$snd" ]; then
    osascript -e 'on run argv' \
      -e 'display notification (item 1 of argv) with title "IBID Workspace" subtitle (item 2 of argv) sound name (item 3 of argv)' \
      -e 'end run' "$msg" "$sub" "$snd" 2>/dev/null || true
  else
    osascript -e 'on run argv' \
      -e 'display notification (item 1 of argv) with title "IBID Workspace" subtitle (item 2 of argv)' \
      -e 'end run' "$msg" "$sub" 2>/dev/null || true
  fi
}

if [ "$1" = "action" ]; then
  case "$2" in
    start)
      if [ -f "$RUNNER_DIR/svc.sh" ]; then
        (cd "$RUNNER_DIR" && ./svc.sh start)
      else
        launchctl start "$SERVICE_LABEL"
      fi
      ;;
    stop)
      if [ -f "$RUNNER_DIR/svc.sh" ]; then
        (cd "$RUNNER_DIR" && ./svc.sh stop)
      else
        launchctl stop "$SERVICE_LABEL"
      fi
      ;;
    restart)
      if [ -f "$RUNNER_DIR/svc.sh" ]; then
        (cd "$RUNNER_DIR" && ./svc.sh stop && sleep 1 && ./svc.sh start)
      else
        launchctl stop "$SERVICE_LABEL"
        sleep 1
        launchctl start "$SERVICE_LABEL"
      fi
      ;;
    watch-ci)
      cd "$WORKSPACE_DIR" || exit 1
      bash tools/ci/launch-dashboard.sh
      ;;
    watch-flow)
      cd "$WORKSPACE_DIR" || exit 1
      node tools/ci/flow.mjs --watch
      ;;
    watch-gh)
      cd "$WORKSPACE_DIR" || exit 1
      RUN_ID=$(gh run list --repo alexibid/ibid-workspace --limit 10 --json databaseId,status \
        --jq 'map(select(.status=="in_progress" or .status=="queued")) | .[0].databaseId // empty' 2>/dev/null)
      if [ -z "$RUN_ID" ]; then
        RUN_ID=$(gh run list --repo alexibid/ibid-workspace --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null)
      fi
      if [ -n "$RUN_ID" ]; then
        gh run watch "$RUN_ID" --repo alexibid/ibid-workspace
      else
        echo "No workflow runs found in GitHub Actions."
        read -p "Press Enter to close..."
      fi
      ;;
    watch-runner)
      if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
      else
        echo "Log file not found: $LOG_FILE"
        read -p "Press Enter to close..."
      fi
      ;;
    check-fast)
      echo "Running fast affected check..."
      cd "$WORKSPACE_DIR" || exit 1
      T_START=$(date +%s)
      npm run check:fast
      T_STATUS=$?
      T_ELAPSED=$(( $(date +%s) - T_START ))
      if [ $T_STATUS -eq 0 ]; then
        echo "✔ Fast check passed in ${T_ELAPSED}s."
      else
        echo "✖ Fast check failed after ${T_ELAPSED}s (exit code: $T_STATUS)."
      fi
      read -p "Press Enter to close..."
      ;;
    check-build)
      echo "Building all workspace projects..."
      cd "$WORKSPACE_DIR" || exit 1
      T_START=$(date +%s)
      npm run check:build
      T_STATUS=$?
      T_ELAPSED=$(( $(date +%s) - T_START ))
      if [ $T_STATUS -eq 0 ]; then
        echo "✔ Workspace build passed in ${T_ELAPSED}s."
      else
        echo "✖ Workspace build failed after ${T_ELAPSED}s (exit code: $T_STATUS)."
      fi
      read -p "Press Enter to close..."
      ;;
    split-sync)
      echo "Syncing standalone repositories to GitHub (Monorepo Split)..."
      cd "$WORKSPACE_DIR" || exit 1
      T_START=$(date +%s)
      node tools/ci/split.mjs
      T_STATUS=$?
      T_ELAPSED=$(( $(date +%s) - T_START ))
      if [ $T_STATUS -eq 0 ]; then
        echo "✔ Monorepo split synced in ${T_ELAPSED}s."
      else
        echo "✖ Monorepo split failed after ${T_ELAPSED}s (exit code: $T_STATUS)."
      fi
      read -p "Press Enter to close..."
      ;;
    split-pull)
      echo "Pulling updates from standalone repositories into workspace..."
      cd "$WORKSPACE_DIR" || exit 1
      node tools/ci/split.mjs --pull
      read -p "Press Enter to close..."
      ;;
    deploy-pipeline)
      echo "=== IBID WORKSPACE · SMART DEPLOY & RELEASE PIPELINE ==="
      cd "$WORKSPACE_DIR" || exit 1
      node tools/ci/deploy-pipeline.mjs
      read -p "Press Enter to close..."
      ;;
    auto-pr)
      APP="${3:-camila}"
      validate_app "$APP"
      echo "=== IBID WORKSPACE · AUTO-PR & CI FOR $APP ==="
      cd "$WORKSPACE_DIR" || exit 1
      node tools/ci/deploy-pipeline.mjs --app="$APP" --pr
      read -p "Press Enter to close..."
      ;;
    submodule-update)
      echo "=== Updating all Git Submodules to remote main ==="
      cd "$WORKSPACE_DIR" || exit 1
      git submodule update --remote --merge
      echo ""
      echo "Running fast validation check..."
      npm run check:fast
      read -p "Press Enter to close..."
      ;;
    submodule-push)
      echo "=== Pushing all Git Submodules to their origin main ==="
      cd "$WORKSPACE_DIR" || exit 1
      git submodule foreach 'git push origin main'
      read -p "Press Enter to close..."
      ;;
    submodule-status)
      echo "=== Git Submodule Status ==="
      cd "$WORKSPACE_DIR" || exit 1
      git submodule status
      read -p "Press Enter to close..."
      ;;
    build-all)
      APP="${3:-oh-save-me}"
      validate_app "$APP"
      echo "Building all installers (.dmg + .apk) for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
      export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
      export PATH="$HOME/Library/Android/sdk/platform-tools:/opt/homebrew/bin:/usr/local/bin:$PATH"
      if [ -z "$JAVA_HOME" ] && [ -x "/usr/libexec/java_home" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
      fi
      npx nx desktop-build "$APP"
      npx nx mobile-apk "$APP"
      node tools/builder/collect-artifact.mjs --project "$APP" --from "apps/$APP/platforms/dist/$APP/desktop/release/bundle" --ext dmg,msi,exe,deb,rpm,AppImage 2>/dev/null || true
      DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
        echo "Opening $DMG_FILE..."
        open "$DMG_FILE"
      fi
      APK_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.apk" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -n "$APK_FILE" ] && [ -f "$APK_FILE" ]; then
        open -R "$APK_FILE"
      fi
      ;;
    build|build-desktop)
      APP="${3:-oh-save-me}"
      validate_app "$APP"
      echo "Building desktop installer for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      npx nx desktop-build "$APP"
      DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/dist" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP/desktop/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
        echo "Opening $DMG_FILE..."
        open "$DMG_FILE"
      fi
      ;;
    install-desktop)
      APP="${3:-oh-save-me}"
      validate_app "$APP"
      DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/dist" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP/desktop/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
        echo "Opening installer: $DMG_FILE..."
        open "$DMG_FILE"
      else
        echo "Installer not found, building for $APP..."
        cd "$WORKSPACE_DIR" || exit 1
        npx nx desktop-build "$APP"
        DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
        if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
          open "$DMG_FILE"
        fi
      fi
      ;;
    build-apk)
      APP="${3:-oh-save-me}"
      validate_app "$APP"
      echo "Building Android APK for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
      export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
      export PATH="$HOME/Library/Android/sdk/platform-tools:/opt/homebrew/bin:/usr/local/bin:$PATH"
      if [ -z "$JAVA_HOME" ] && [ -x "/usr/libexec/java_home" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
      fi
      npx nx mobile-apk "$APP"
      APK_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.apk" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -n "$APK_FILE" ] && [ -f "$APK_FILE" ]; then
        open -R "$APK_FILE"
      fi
      ;;
    install-mobile)
      APP="${3:-oh-save-me}"
      validate_app "$APP"
      echo "Installing APK on Android device via USB cable for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
      export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
      export PATH="$HOME/Library/Android/sdk/platform-tools:/opt/homebrew/bin:/usr/local/bin:$PATH"
      if [ -z "$JAVA_HOME" ] && [ -x "/usr/libexec/java_home" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
      fi
      APK_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.apk" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -z "$APK_FILE" ]; then
        APK_FILE=$(find "$WORKSPACE_DIR/dist" -name "*.apk" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -z "$APK_FILE" ]; then
        echo "APK not found. Building APK first for $APP..."
        npx nx mobile-apk "$APP"
        APK_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.apk" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      echo "Checking connected ADB devices..."
      adb devices -l
      DEVICE_COUNT=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l | tr -d ' ')
      if [ "$DEVICE_COUNT" -eq "0" ]; then
        echo "⚠️ No mobile device detected via USB. Please connect device with USB debugging enabled."
      else
        echo "Installing $APK_FILE on device..."
        adb install -r "$APK_FILE"
        PACKAGE_ID=$(node -e "try { const f = require('fs').readFileSync('apps/$APP/platforms/mobile/capacitor.config.ts', 'utf8'); const m = f.match(/appId:\s*['\"]([^'\"]+)['\"]/); console.log(m ? m[1] : ''); } catch { console.log(''); }")
        if [ -n "$PACKAGE_ID" ]; then
          echo "Launching $PACKAGE_ID..."
          adb shell monkey -p "$PACKAGE_ID" -c android.intent.category.LAUNCHER 1
        fi
        echo "Done!"
      fi
      ;;
    build-web)
      APP="${3:-boilerplate}"
      validate_app "$APP"
      echo "Building web bundle for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      npx nx build "$APP"
      ;;
    deploy-web)
      APP="${3:-oh-save-me}"
      validate_app "$APP"
      cd "$WORKSPACE_DIR" || exit 1
      if [ "$APP" = "all" ]; then
        echo "Building all workspace projects..."
        npm run check:build
        echo "Deploying all web apps to Firebase Hosting..."
        npx firebase deploy --only hosting
      else
        echo "Building web bundle for $APP..."
        npx nx build "$APP"
        echo "Deploying $APP to Firebase Hosting..."
        npx firebase deploy --only "hosting:$APP"
      fi
      ;;
    sync-drive)
      echo "Syncing all installers from dist to Google Drive ($GDRIVE_DIR)..."
      mkdir -p "$GDRIVE_DIR"
      for APP_DIR in "$WORKSPACE_DIR"/dist/*; do
        if [ -d "$APP_DIR" ]; then
          APP_NAME=$(basename "$APP_DIR")
          if [ "$APP_NAME" != "storybook" ]; then
            TARGET_APP_DIR="$GDRIVE_DIR/$APP_NAME"
            mkdir -p "$TARGET_APP_DIR"
            find "$APP_DIR" -maxdepth 1 \( -name "*.dmg" -o -name "*.apk" -o -name "*.exe" -o -name "*.msi" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec cp -v {} "$TARGET_APP_DIR/" \; 2>/dev/null
            LATEST_V_DIR=$(find "$TARGET_APP_DIR" -maxdepth 1 -name "v*" -type d 2>/dev/null | sort -V | tail -n 1)
            if [ -n "$LATEST_V_DIR" ] && [ -d "$LATEST_V_DIR" ]; then
              find "$APP_DIR" -maxdepth 1 \( -name "*.dmg" -o -name "*.apk" -o -name "*.exe" -o -name "*.msi" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec cp -v {} "$LATEST_V_DIR/" \; 2>/dev/null
            fi
          fi
        fi
      done
      echo "Sync complete."
      ;;
  esac
  exit 0
fi

IS_RUNNING=false
RUNNER_PID=$(launchctl list | grep "$SERVICE_LABEL" | awk '{print $1}')
if [ -n "$RUNNER_PID" ] && [ "$RUNNER_PID" != "-" ]; then
  IS_RUNNING=true
fi

IS_BUILDING=false
if [ "$IS_RUNNING" = true ]; then
  if pgrep -f "Runner.Worker" > /dev/null 2>&1 || pgrep -f "desktop-build" > /dev/null 2>&1; then
    IS_BUILDING=true
  fi
fi

FAVICON_BASE64="iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAx0lEQVR4AcySoQrCUBSGp00MKhaDxSJYBTH5EGLzTQS7iMlo9CVsZg0WfQMxWAxWm98POsYOl3tgZeP/zh135/932U41KXh5Avq84w07MPIEtHE1oAdGnoATrhHMwcgTINOF8gKjWMACxwOesAejWMAKxww60ASjWIAMV5UQnoBKyKx9T4D6gpQvQCcac946uCRDtlHTdmZjA3/pF+q+SzEfNB+ggfnQeAdpS9EosyRDyg2mkCofcORJDdYgLSkDaP2YsB4g1RcAAP//V+4H3AAAAAZJREFUAwBPZRR2rMEpkgAAAABJRU5ErkJggg=="

if [ "$IS_BUILDING" = true ]; then
  echo " ⟳ | templateImage=$FAVICON_BASE64 dropdown=false"
elif [ "$IS_RUNNING" = true ]; then
  echo " | templateImage=$FAVICON_BASE64 dropdown=false"
else
  echo " ○ | templateImage=$FAVICON_BASE64 dropdown=false"
fi

echo "---"
echo "🚀 DEPLOY & RELEASE (Auto-PR & Publish) | bash=\"$SELF\" param1=action param2=deploy-pipeline terminal=true"
echo "⌁ Open CI Dashboard (Graph + Logs) | bash=\"$SELF\" param1=action param2=watch-ci terminal=false"

echo "---"
if [ "$IS_BUILDING" = true ]; then
  echo "⟳ Runner: Compiling... | bash=\"$SELF\" param1=action param2=watch-runner terminal=true refresh=true"
elif [ "$IS_RUNNING" = true ]; then
  echo "● Runner: Listening (PID $RUNNER_PID) | bash=\"$SELF\" param1=action param2=watch-runner terminal=true"
  echo "-- ■ Stop Runner | bash=\"$SELF\" param1=action param2=stop terminal=false refresh=true"
  echo "-- ↺ Restart Runner | bash=\"$SELF\" param1=action param2=restart terminal=false refresh=true"
else
  echo "○ Runner: Stopped | bash=\"$SELF\" param1=action param2=start terminal=false refresh=true"
  echo "-- ▶ Start Runner | bash=\"$SELF\" param1=action param2=start terminal=false refresh=true"
fi

CACHE_DIR="${TMPDIR:-/tmp}/ibid-xbar-$(id -u)"
mkdir -p -m 700 "$CACHE_DIR" 2>/dev/null
FLOW_CACHE="$CACHE_DIR/flow.txt"

if [ -f "$FLOW_CACHE" ]; then
  cat "$FLOW_CACHE"
fi

if [ ! -f "$FLOW_CACHE" ] || [ $(( $(date +%s) - $(stat -f %m "$FLOW_CACHE" 2>/dev/null || echo 0) )) -gt 20 ]; then
  if [ ! -f "$FLOW_CACHE.lock" ] || [ $(( $(date +%s) - $(stat -f %m "$FLOW_CACHE.lock" 2>/dev/null || echo 0) )) -gt 120 ]; then
    touch "$FLOW_CACHE.lock"
    (
      cd "$WORKSPACE_DIR" && PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" \
        node tools/ci/flow.mjs --xbar > "$FLOW_CACHE.tmp" 2>/dev/null \
        && mv "$FLOW_CACHE.tmp" "$FLOW_CACHE"
      rm -f "$FLOW_CACHE.lock"
    ) >/dev/null 2>&1 &
  fi
fi

echo "---"
echo "Oh Save Me!"
echo "-- 🖥 Open in GitHub Desktop | bash=/usr/bin/open param1=-a param2=\"GitHub Desktop\" param3=\"$WORKSPACE_DIR/apps/oh-save-me\" terminal=false"
echo "-- 🔀 Create PR to Monorepo (Auto-PR) | bash=\"$SELF\" param1=action param2=auto-pr param3=oh-save-me terminal=true refresh=true"
echo "-- ⚙ Build All (.dmg + .apk) | bash=\"$SELF\" param1=action param2=build-all param3=oh-save-me terminal=true refresh=true"
echo "-- ⚙ Build Desktop (.dmg) | bash=\"$SELF\" param1=action param2=build-desktop param3=oh-save-me terminal=true refresh=true"
echo "-- ⚙ Build Android (.apk) | bash=\"$SELF\" param1=action param2=build-apk param3=oh-save-me terminal=true refresh=true"
echo "-- ↓ Install Desktop (.dmg) | bash=\"$SELF\" param1=action param2=install-desktop param3=oh-save-me terminal=true refresh=true"
echo "-- ↓ Install APK on Device (USB) | bash=\"$SELF\" param1=action param2=install-mobile param3=oh-save-me terminal=true refresh=true"
echo "-- ↑ Deploy to Firebase Hosting | bash=\"$SELF\" param1=action param2=deploy-web param3=oh-save-me terminal=true refresh=true"
echo "-- 🌐 Open Web (ibid-ohsaveme.web.app) | bash=/usr/bin/open param1=\"https://ibid-ohsaveme.web.app\" terminal=false"
echo "-- 📁 Open Folder | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/apps/oh-save-me\" terminal=false"

echo "Camila"
echo "-- 🖥 Open in GitHub Desktop | bash=/usr/bin/open param1=-a param2=\"GitHub Desktop\" param3=\"$WORKSPACE_DIR/apps/camila\" terminal=false"
echo "-- 🔀 Create PR to Monorepo (Auto-PR) | bash=\"$SELF\" param1=action param2=auto-pr param3=camila terminal=true refresh=true"
echo "-- ⚙ Build Web | bash=\"$SELF\" param1=action param2=build-web param3=camila terminal=true refresh=true"
echo "-- ↑ Deploy to Firebase Hosting | bash=\"$SELF\" param1=action param2=deploy-web param3=camila terminal=true refresh=true"
echo "-- 🌐 Open Web (ibid-camila.web.app) | bash=/usr/bin/open param1=\"https://ibid-camila.web.app\" terminal=false"
echo "-- 📁 Open Folder | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/apps/camila\" terminal=false"

echo "Boilerplate"
echo "-- 🖥 Open in GitHub Desktop | bash=/usr/bin/open param1=-a param2=\"GitHub Desktop\" param3=\"$WORKSPACE_DIR/apps/boilerplate\" terminal=false"
echo "-- 🔀 Create PR to Monorepo (Auto-PR) | bash=\"$SELF\" param1=action param2=auto-pr param3=boilerplate terminal=true refresh=true"
echo "-- ⚙ Build Web | bash=\"$SELF\" param1=action param2=build-web param3=boilerplate terminal=true refresh=true"
echo "-- ↑ Deploy to Firebase Hosting | bash=\"$SELF\" param1=action param2=deploy-web param3=boilerplate terminal=true refresh=true"
echo "-- 🌐 Open Web (ibid-boilerplate.web.app) | bash=/usr/bin/open param1=\"https://ibid-boilerplate.web.app\" terminal=false"
echo "-- 🎨 Storybook Showcase | bash=/usr/bin/open param1=\"http://localhost:6006\" terminal=false"
echo "-- 📁 Open Folder | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/apps/boilerplate\" terminal=false"

echo "ibid-ui (Design System)"
echo "-- 🖥 Open in GitHub Desktop | bash=/usr/bin/open param1=-a param2=\"GitHub Desktop\" param3=\"$WORKSPACE_DIR/libs/ibid-ui\" terminal=false"
echo "-- 📁 Open Folder | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/libs/ibid-ui\" terminal=false"

echo "---"
echo "Workspace"
echo "-- ⌁ Fast Check (check:fast) | bash=\"$SELF\" param1=action param2=check-fast terminal=true"
echo "-- ⚙ Build Workspace (check:build) | bash=\"$SELF\" param1=action param2=check-build terminal=true"
echo "-- ⤓ Pull All Submodules (update --remote) | bash=\"$SELF\" param1=action param2=submodule-update terminal=true refresh=true"
echo "-- ↑ Push All Submodules | bash=\"$SELF\" param1=action param2=submodule-push terminal=true refresh=true"
echo "-- ≡ Submodule Status | bash=\"$SELF\" param1=action param2=submodule-status terminal=true"
echo "-- ⌥ Sync Monorepo to GitHub (Push Split) | bash=\"$SELF\" param1=action param2=split-sync terminal=true refresh=true"
echo "-- ⌥ Pull Repositories into Monorepo | bash=\"$SELF\" param1=action param2=split-pull terminal=true refresh=true"
echo "-- ↑ Deploy All Web Apps to Firebase | bash=\"$SELF\" param1=action param2=deploy-web param3=all terminal=true refresh=true"
echo "-- ☁ Sync Installers to Google Drive | bash=\"$SELF\" param1=action param2=sync-drive terminal=true refresh=true"

echo "---"
echo "Links & Folders"
echo "-- 📁 Workspace Folder | bash=/usr/bin/open param1=\"$WORKSPACE_DIR\" terminal=false"
echo "-- 📦 Dist Folder (Installers) | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/dist\" terminal=false"
if [ -d "$GDRIVE_DIR" ]; then
  echo "-- ☁ Google Drive (ibid-builds) | bash=/usr/bin/open param1=\"$GDRIVE_DIR\" terminal=false"
fi
if [ -f "$LOG_FILE" ]; then
  echo "-- ≡ Local Runner Log File | bash=/usr/bin/open param1=\"$LOG_FILE\" terminal=false"
fi
echo "-- ---"
echo "-- 🐙 GitHub Actions (CI/CD) | bash=/usr/bin/open param1=\"https://github.com/alexibid/ibid-workspace/actions\" terminal=false"
echo "-- 💳 GitHub Billing | bash=/usr/bin/open param1=\"https://github.com/settings/billing\" terminal=false"
