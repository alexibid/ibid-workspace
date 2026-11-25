#!/usr/bin/env bash
set -euo pipefail

STATE_DIR=/runner-state
CREDENTIAL_FILES=(.runner .credentials .credentials_rsaparams)
NATIVE_BUILD_TOOLS=(make g++ python3)

require_native_build_tools() {
  local missing=()
  for tool in "${NATIVE_BUILD_TOOLS[@]}"; do
    command -v "$tool" > /dev/null || missing+=("$tool")
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    echo "The runner image lacks ${missing[*]}; npm ci cannot build native modules." >&2
    echo "Rebuild it: npx nx run ci-runner:docker:build" >&2
    exit 1
  fi
}

restore_credentials() {
  for file in "${CREDENTIAL_FILES[@]}"; do
    if [ -f "$STATE_DIR/$file" ]; then
      cp "$STATE_DIR/$file" "$file"
    fi
  done
}

register_runner() {
  if [ -z "${RUNNER_TOKEN:-}" ]; then
    echo "The runner is not registered yet. Run: npx nx run ci-runner:register" >&2
    exit 1
  fi
  ./config.sh --unattended --replace \
    --url "$RUNNER_URL" \
    --token "$RUNNER_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --work _work
  for file in "${CREDENTIAL_FILES[@]}"; do
    cp "$file" "$STATE_DIR/$file"
  done
}

require_native_build_tools
restore_credentials
if [ ! -f .runner ]; then
  register_runner
fi

exec ./run.sh
