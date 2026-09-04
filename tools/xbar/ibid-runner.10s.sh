#!/bin/bash

# <xbar.title>IBID Workspace Runner & Delivery</xbar.title>
# <xbar.version>v1.1.0</xbar.version>
# <xbar.author>alexibid</xbar.author>
# <xbar.author.github>alexibid</xbar.author.github>
# <xbar.desc>Controls the macOS background runner and local Google Drive build delivery for ibid-workspace</xbar.desc>
# <xbar.dependencies>bash,launchctl</xbar.dependencies>

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
    check-fast)
      echo "Running fast affected check..."
      cd "$WORKSPACE_DIR" || exit 1
      npm run check:fast
      ;;
    check-build)
      echo "Building all workspace projects..."
      cd "$WORKSPACE_DIR" || exit 1
      npm run check:build
      ;;
    build-all)
      APP="${3:-oh-save-me}"
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
      echo "Building desktop installer for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      npx nx desktop-build "$APP"
      DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/dist" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/apps/$APP/platforms/desktop/src-tauri/target/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
        echo "Opening $DMG_FILE..."
        open "$DMG_FILE"
      fi
      ;;
    install-desktop)
      APP="${3:-oh-save-me}"
      DMG_FILE=$(find "$WORKSPACE_DIR/dist/$APP" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/dist" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
      fi
      if [ -z "$DMG_FILE" ]; then
        DMG_FILE=$(find "$WORKSPACE_DIR/apps/$APP/platforms/desktop/src-tauri/target/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | sort -V | tail -n 1)
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
        echo "⚠️ Nenhum telemóvel detetado via USB. Por favor ligue o telemóvel com depuração USB ativa."
      else
        echo "Installing $APK_FILE on device..."
        adb install -r "$APK_FILE"
        PACKAGE_ID=$(node -e "try { const f = require('fs').readFileSync('apps/$APP/capacitor.config.ts', 'utf8'); const m = f.match(/appId:\s*['\"]([^'\"]+)['\"]/); console.log(m ? m[1] : ''); } catch { console.log(''); }")
        if [ -n "$PACKAGE_ID" ]; then
          echo "Launching $PACKAGE_ID..."
          adb shell monkey -p "$PACKAGE_ID" -c android.intent.category.LAUNCHER 1
        fi
        echo "Done!"
      fi
      ;;
    build-web)
      APP="${3:-boilerplate}"
      echo "Building web bundle for $APP..."
      cd "$WORKSPACE_DIR" || exit 1
      npx nx build "$APP"
      ;;
    deploy-web)
      APP="${3:-oh-save-me}"
      echo "Deploying web app for $APP to Firebase Hosting..."
      cd "$WORKSPACE_DIR" || exit 1
      if [ "$APP" = "all" ]; then
        npx firebase deploy --only hosting
      else
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
echo "ibid-workspace — Runner & Delivery | size=13 bash=/usr/bin/open param1=\"$WORKSPACE_DIR\" terminal=false"

if [ "$IS_BUILDING" = true ]; then
  echo "⟳ Estado: Em compilação... | refresh=true bash=/usr/bin/true terminal=false"
elif [ "$IS_RUNNING" = true ]; then
  echo "● Runner CI: À escuta (PID: $RUNNER_PID) | refresh=true bash=/usr/bin/true terminal=false"
else
  echo "○ Runner CI: Desligado | refresh=true bash=/usr/bin/true terminal=false"
fi

if [ -f "$LOG_FILE" ]; then
  LAST_LOG=$(tail -n 1 "$LOG_FILE" 2>/dev/null | cut -c 1-50)
  if [ -n "$LAST_LOG" ]; then
    echo "Último evento: $LAST_LOG | size=11 bash=/usr/bin/open param1=\"$LOG_FILE\" terminal=false"
  fi
fi

echo "---"
if [ "$IS_RUNNING" = true ]; then
  echo "■ Parar Runner | bash=\"$0\" param1=action param2=stop terminal=false refresh=true"
  echo "↺ Reiniciar Runner | bash=\"$0\" param1=action param2=restart terminal=false refresh=true"
else
  echo "▶ Iniciar Runner | bash=\"$0\" param1=action param2=start terminal=false refresh=true"
fi

echo "---"
echo "Workspace (ibid-workspace)"
echo "-- ⚡ Verificação Rápida (check:fast) | bash=\"$0\" param1=action param2=check-fast terminal=true"
echo "-- 🏗️ Compilar Workspace (check:build) | bash=\"$0\" param1=action param2=check-build terminal=true"
echo "-- 🚀 Publicar Todas as Web Apps no Firebase | bash=\"$0\" param1=action param2=deploy-web param3=all terminal=true refresh=true"
echo "-- ↑ Sincronizar Todos os Instaladores para o Drive | bash=\"$0\" param1=action param2=sync-drive terminal=true refresh=true"
echo "-- 📂 Abrir Raiz do Workspace | bash=/usr/bin/open param1=\"$WORKSPACE_DIR\" terminal=false"
echo "-- 📂 Abrir Pasta Dist | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/dist\" terminal=false"
echo "-- ↗ GitHub Actions | bash=/usr/bin/open param1=\"https://github.com/alexibid/ibid-workspace/actions\" terminal=false"

echo "Oh Save Me!"
echo "-- ⚒ Compilar Tudo (.dmg + .apk) | bash=\"$0\" param1=action param2=build-all param3=oh-save-me terminal=true refresh=true"
echo "-- ⚒ Compilar Desktop (.dmg) | bash=\"$0\" param1=action param2=build-desktop param3=oh-save-me terminal=true refresh=true"
echo "-- 📦 Compilar Android (.apk) | bash=\"$0\" param1=action param2=build-apk param3=oh-save-me terminal=true refresh=true"
echo "-- 💻 Instalar Desktop (.dmg) | bash=\"$0\" param1=action param2=install-desktop param3=oh-save-me terminal=true refresh=true"
echo "-- 📲 Instalar APK no Telemóvel (USB) | bash=\"$0\" param1=action param2=install-mobile param3=oh-save-me terminal=true refresh=true"
echo "-- 🚀 Publicar no Firebase Hosting | bash=\"$0\" param1=action param2=deploy-web param3=oh-save-me terminal=true refresh=true"
echo "-- ↗ Abrir Web App (ibid-ohsaveme.web.app) | bash=/usr/bin/open param1=\"https://ibid-ohsaveme.web.app\" terminal=false"
echo "-- 📂 Abrir Pasta do Projeto | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/apps/oh-save-me\" terminal=false"

echo "Boilerplate"
echo "-- 🏗️ Compilar Web | bash=\"$0\" param1=action param2=build-web param3=boilerplate terminal=true refresh=true"
echo "-- 🚀 Publicar no Firebase Hosting | bash=\"$0\" param1=action param2=deploy-web param3=boilerplate terminal=true refresh=true"
echo "-- ↗ Abrir Web App (ibid-boilerplate.web.app) | bash=/usr/bin/open param1=\"https://ibid-boilerplate.web.app\" terminal=false"
echo "-- 📖 Storybook Showcase (porta 6006) | bash=/usr/bin/open param1=\"http://localhost:6006\" terminal=false"
echo "-- 📂 Abrir Pasta do Projeto | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/apps/boilerplate\" terminal=false"

echo "Camila"
echo "-- 🚀 Publicar no Firebase Hosting | bash=\"$0\" param1=action param2=deploy-web param3=camila terminal=true refresh=true"
echo "-- ↗ Abrir Web App (ibid-camila.web.app) | bash=/usr/bin/open param1=\"https://ibid-camila.web.app\" terminal=false"
echo "-- 📂 Abrir Pasta do Projeto | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/apps/camila\" terminal=false"

echo "---"
if [ -d "$GDRIVE_DIR" ]; then
  echo "↗ Abrir Google Drive (ibid-builds) | bash=/usr/bin/open param1=\"$GDRIVE_DIR\" terminal=false"
fi
echo "↗ Abrir Pasta Dist | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/dist\" terminal=false"
if [ -f "$LOG_FILE" ]; then
  echo "≡ Ver Logs do Runner | bash=/usr/bin/open param1=\"$LOG_FILE\" terminal=false"
fi
echo "↗ Abrir GitHub Actions | bash=/usr/bin/open param1=\"https://github.com/alexibid/ibid-workspace/actions\" terminal=false"
