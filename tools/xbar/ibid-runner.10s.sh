#!/bin/bash

# <xbar.title>IBID Build Runner & Drive Sync</xbar.title>
# <xbar.version>v1.0.0</xbar.version>
# <xbar.author>alexibid</xbar.author>
# <xbar.author.github>alexibid</xbar.author.github>
# <xbar.desc>Controls the macOS background runner and local Google Drive build delivery</xbar.desc>
# <xbar.dependencies>bash,launchctl</xbar.dependencies>

RUNNER_DIR="/Users/alexsantos/actions-runner"
SERVICE_LABEL="actions.runner.alexibid-ibid-workspace.MAC_ALEX"
WORKSPACE_DIR="/Users/alexsantos/Projects/ibid-workspace"
GDRIVE_DIR="/Users/alexsantos/Google Drive/My Drive/ibid-builds"
LOG_FILE="/Users/alexsantos/Library/Logs/$SERVICE_LABEL/stdout.log"

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
    build)
      echo "Building desktop installer..."
      cd "$WORKSPACE_DIR" || exit 1
      npm run desktop:build
      ;;
    sync-drive)
      mkdir -p "$GDRIVE_DIR/oh-save-me"
      find "$WORKSPACE_DIR/dist" -name "*.dmg" -exec cp -v {} "$GDRIVE_DIR/oh-save-me/" \;
      find "$WORKSPACE_DIR/apps/oh-save-me/platforms/desktop/src-tauri/target/release/bundle/dmg" -name "*.dmg" -exec cp -v {} "$GDRIVE_DIR/oh-save-me/" \; 2>/dev/null
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

if [ "$IS_BUILDING" = true ]; then
  echo "⚙️ ibid | dropdown=false color=#f5a623"
elif [ "$IS_RUNNING" = true ]; then
  echo "🟢 ibid | dropdown=false"
else
  echo "🔴 ibid | dropdown=false"
fi

echo "---"
echo "Oh Save Me! — Runner & Drive | size=13 font=bold"

if [ "$IS_BUILDING" = true ]; then
  echo "Estado: Em Compilação... | color=#f5a623"
elif [ "$IS_RUNNING" = true ]; then
  echo "Estado: À escuta (PID: $RUNNER_PID) | color=green"
else
  echo "Estado: Desligado | color=red"
fi

if [ -f "$LOG_FILE" ]; then
  LAST_LOG=$(tail -n 1 "$LOG_FILE" 2>/dev/null | cut -c 1-50)
  if [ -n "$LAST_LOG" ]; then
    echo "Último evento: $LAST_LOG | size=10 color=#888888"
  fi
fi

echo "---"
if [ "$IS_RUNNING" = true ]; then
  echo "⏸️ Desligar Serviço | bash=\"$0\" param1=action param2=stop terminal=false refresh=true"
  echo "🔄 Reiniciar Serviço | bash=\"$0\" param1=action param2=restart terminal=false refresh=true"
else
  echo "▶️ Ligar Serviço | bash=\"$0\" param1=action param2=start terminal=false refresh=true"
fi

echo "---"
echo "⚡ Compilar Desktop (.dmg) Manualmente | bash=\"$0\" param1=action param2=build terminal=true refresh=true"
echo "📤 Sincronizar Instaladores para o Drive | bash=\"$0\" param1=action param2=sync-drive terminal=true refresh=true"

echo "---"
if [ -d "$GDRIVE_DIR" ]; then
  echo "☁️ Abrir Pasta no Google Drive | bash=/usr/bin/open param1=\"$GDRIVE_DIR\" terminal=false"
fi
echo "📁 Abrir Pasta Dist | bash=/usr/bin/open param1=\"$WORKSPACE_DIR/dist\" terminal=false"
if [ -f "$LOG_FILE" ]; then
  echo "📜 Ver Logs do Runner | bash=/usr/bin/open param1=\"$LOG_FILE\" terminal=false"
fi
echo "🌐 Abrir GitHub Actions | bash=/usr/bin/open param1=\"https://github.com/alexibid/ibid-workspace/actions\" terminal=false"
