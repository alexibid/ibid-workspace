# tools/

Everything that serves the workspace rather than a product. `tools/` is mirrored to its own
repository, [alexibid/tools](https://github.com/alexibid/tools), by `npm run split`.

## Shared configuration

What every project extends. What stays in `apps/*` is only what makes that product different.

| Folder        | Tool                 | Contains                                                                                                     |
| :------------ | :------------------- | :----------------------------------------------------------------------------------------------------------- |
| `builder/`    | Angular / TypeScript | The `tsconfig` base, module declarations, the artifact collector and the version sync                        |
| `vitest/`     | Unit tests           | The runner config, the Storybook browser project, and the guard that blocks network requests from unit tests |
| `playwright/` | Journeys             | The device matrix (mobile, tablet, desktop) and the execution policy                                         |
| `storybook/`  | Storybook            | The config factory, the theme and the visual test runner                                                     |
| `commitlint/` | Commitlint           | Commit message rules                                                                                         |
| `husky/`      | Git hooks            | `pre-commit`, `commit-msg` and the hooks that reattach the submodules after checkout/merge                   |
| `release/`    | Versioning           | The `commit-and-tag-version` preset                                                                          |

## Workspace automation

Scripts nothing imports and no configuration extends. npm scripts, CI or a person run them.

| Folder                    | Runs                   | Contains                                                                                                                |
| :------------------------ | :--------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| `ci/`                     | GitHub Actions         | Affected scope, platform declarations, lint ceiling, audit, journeys, versioning, release targets, split, run summaries |
| `ci/runner/`              | Docker (`ci-runner`)   | The self-hosted runner image, its compose file and the registration script                                              |
| `qa/`                     | `npm run check`        | The tiered runner, its logs and its report                                                                              |
| `workspace/`              | `npm install`, by hand | Submodule setup and reattachment, worktrees with sparse checkout, per-project `.gitignore` generation                   |
| `workspace-menu/`         | macOS menu bar         | The `ibid workspace` app (Tauri + Angular): CI/CD status, problems and actions                                          |
| `vscode-scss-definition/` | VS Code                | The `nested-scss-definition` extension: go to definition for nested SCSS and BEM selectors                              |

`scratch/` is git-ignored and holds throwaway experiments.

## The menu bar app

`workspace-menu` lives in the macOS menu bar and starts with the Mac.

- **Problems first**: Docker off, a runner off or disconnected, a stopped container, or a failed
  run with its job and step. Each problem has one button that fixes it or opens its log, and a
  new problem raises one macOS notification.
- **Status**: both runners, Docker and its containers, the latest run of each workflow, open pull
  requests and running RunPod pods, refreshed every 20 seconds.
- **Actions**: runners, checks, submodules, split, builds, installs, Firebase deploys, Google Drive
  and links. Long actions open Terminal, one action cannot start twice, and each ends with a
  passed or failed notification.

```bash
npx nx run workspace-menu:install
```

## What does not belong here

**Code that tests or apps import** — the accessibility auditor, screenshot helpers, flow
recording — lives in `libs/testing` (`@ibid/testing`). A library enters the Nx graph and gets an
alias, caching, `affected` and boundary checks; a `tools/` folder gets none of that.

Rule of thumb: **if a `.spec.ts` or application code imports it, it is a lib.** Everything else
that serves the workspace is `tools/`.

`libs/utils` is not the home for workspace scripts: it is the `@ibid/utils` package, and
anything placed there ships with it.

**Targets** — build, serve, test, desktop, mobile — are not here either. They are the
`targetDefaults` of `nx.json`, so a new app inherits them without copying configuration.
