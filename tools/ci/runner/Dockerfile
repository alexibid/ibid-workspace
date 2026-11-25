FROM ghcr.io/actions/actions-runner:latest

ARG NODE_MAJOR=24
ARG PLAYWRIGHT_VERSION=1.62.1

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential ca-certificates curl git gnupg jq python3 unzip rclone \
  && curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends gh \
  && npx -y "playwright@${PLAYWRIGHT_VERSION}" install-deps chromium \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /runner-state /home/runner/_work /home/runner/.cache \
  && chown -R runner:docker /runner-state /home/runner/_work /home/runner/.cache

COPY --chown=runner:docker --chmod=755 entrypoint.sh /home/runner/entrypoint.sh

USER runner
WORKDIR /home/runner

ENTRYPOINT ["/home/runner/entrypoint.sh"]
