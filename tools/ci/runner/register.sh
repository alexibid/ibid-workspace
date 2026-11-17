#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="alexibid/ibid-workspace"

RUNNER_TOKEN=$(gh api --method POST "repos/$REPOSITORY/actions/runners/registration-token" --jq .token)
export RUNNER_TOKEN

docker compose up -d --build
