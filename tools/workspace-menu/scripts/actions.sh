#!/bin/bash

WORKSPACE_DIR="${WORKSPACE_DIR:-$HOME/Projects/ibid-workspace}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
GDRIVE_DIR="${GDRIVE_DIR:-$HOME/Google Drive/My Drive/ibid-builds}"
LOCK_DIR="${TMPDIR:-/tmp}/ibid-workspace-menu/locks"
DOCKER_RUNNER_CONTAINER="ibid-ci-runner"
export PATH="$HOME/.n/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/Library/Android/sdk/platform-tools:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [ -z "$JAVA_HOME" ] && [ -x /usr/libexec/java_home ]; then
  JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null)
  export JAVA_HOME
fi

notify() {
  osascript -e 'on run argv' \
    -e 'display notification (item 2 of argv) with title "workspace" subtitle (item 1 of argv)' \
    -e 'end run' "$1" "$2" 2>/dev/null || true
}

hold_lock() {
  mkdir -p "$LOCK_DIR"
  echo $$ > "$LOCK_DIR/$ACTION_KEY"
}

finish() {
  local status=$?
  rm -f "$LOCK_DIR/$ACTION_KEY"
  if [ "$status" -eq 0 ]; then
    notify "✔ Passou" "$ACTION_LABEL"
  else
    notify "✖ Falhou (código $status)" "$ACTION_LABEL"
  fi
}

latest_file() {
  find "$WORKSPACE_DIR/dist/$1" -name "*.$2" -type f 2>/dev/null | sort -V | tail -n 1
}

mac_runner_label() {
  launchctl list 2>/dev/null | grep -oE 'actions\.runner\.[^ \t]+' | head -n 1
}

mac_runner() {
  if [ -f "$RUNNER_DIR/svc.sh" ]; then
    (cd "$RUNNER_DIR" && ./svc.sh "$1")
  else
    launchctl "$1" "$(mac_runner_label)"
  fi
}

docker_runner() {
  docker "$1" "$DOCKER_RUNNER_CONTAINER"
}

runner() {
  if [ "$2" = "docker" ]; then
    docker_runner "$1"
  elif [ "$1" = "restart" ]; then
    mac_runner stop
    sleep 1
    mac_runner start
  else
    mac_runner "$1"
  fi
}

runner_log() {
  if [ "$1" = "docker" ]; then
    docker logs -f --tail 200 "$DOCKER_RUNNER_CONTAINER"
  else
    tail -f "$HOME/Library/Logs/$(mac_runner_label)/stdout.log"
  fi
}

start_docker() {
  if [ -d /Applications/OrbStack.app ]; then
    open -a OrbStack
  else
    open -a Docker
  fi
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

install_desktop() {
  local dmg
  dmg=$(latest_file "$1" dmg)
  if [ -z "$dmg" ]; then
    npx nx desktop-build "$1" || return 1
    dmg=$(latest_file "$1" dmg)
  fi
  open "$dmg"
}

install_mobile() {
  local apk package_id
  apk=$(latest_file "$1" apk)
  if [ -z "$apk" ]; then
    npx nx mobile-apk "$1" || return 1
    apk=$(latest_file "$1" apk)
  fi
  if [ "$(adb devices | grep -c "device$")" -eq 0 ]; then
    echo "Nenhum telemóvel ligado. Liga um por USB com a depuração USB ativa."
    return 1
  fi
  adb install -r "$apk" || return 1
  package_id=$(grep -oE "appId:\s*['\"][^'\"]+" "apps/$1/platforms/mobile/capacitor.config.ts" | grep -oE "[^'\"]+$")
  if [ -n "$package_id" ]; then
    adb shell monkey -p "$package_id" -c android.intent.category.LAUNCHER 1
  fi
}

deploy_web() {
  if [ "$1" = "all" ]; then
    npm run check:build && npx firebase deploy --only hosting
  else
    npx nx build "$1" && npx firebase deploy --only "hosting:$1"
  fi
}

sync_drive() {
  local app_dir target
  for app_dir in "$WORKSPACE_DIR"/dist/*/; do
    [ "$(basename "$app_dir")" = "storybook" ] && continue
    target="$GDRIVE_DIR/$(basename "$app_dir")"
    mkdir -p "$target"
    find "$app_dir" -maxdepth 1 \( -name "*.dmg" -o -name "*.apk" -o -name "*.exe" -o -name "*.msi" \
      -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec cp -v {} "$target/" \;
  done
}

run_action() {
  case "$1" in
    docker-start) start_docker ;;
    container-start) docker start "$2" ;;
    runner-start) runner start "$2" ;;
    runner-stop) runner stop "$2" ;;
    runner-restart) runner restart "$2" ;;
    runner-register) npx nx run ci-runner:register ;;
    runner-log) runner_log "$2" ;;
    watch-ci) bash tools/ci/launch-dashboard.sh ;;
    deploy-pipeline) node tools/ci/deploy-pipeline.mjs ;;
    check-fast) npm run check:fast ;;
    check-build) npm run check:build ;;
    split-sync) node tools/ci/split.mjs ;;
    split-pull) node tools/ci/split.mjs --pull ;;
    submodule-update) git submodule update --remote --merge && npm run check:fast ;;
    submodule-push) git submodule foreach 'git push origin main' ;;
    submodule-status) git submodule status ;;
    auto-pr) node tools/ci/deploy-pipeline.mjs "--app=$2" --pr ;;
    merge-pr) gh pr merge "$3" --repo "$2" --squash ;;
    build-all) npx nx desktop-build "$2" && npx nx mobile-apk "$2" ;;
    build-desktop) npx nx desktop-build "$2" && open "$(latest_file "$2" dmg)" ;;
    build-apk) npx nx mobile-apk "$2" && open -R "$(latest_file "$2" apk)" ;;
    build-web) npx nx build "$2" ;;
    install-desktop) install_desktop "$2" ;;
    install-mobile) install_mobile "$2" ;;
    deploy-web) deploy_web "$2" ;;
    sync-drive) sync_drive ;;
    *) echo "Ação desconhecida: $1" >&2; return 2 ;;
  esac
}

cd "$WORKSPACE_DIR" || exit 1
hold_lock
trap finish EXIT
run_action "$@"
