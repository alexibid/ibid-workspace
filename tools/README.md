# tools/

One folder per tool. Two kinds live here, and the difference matters when deciding where
something new goes.

## Shared configuration

What every project extends; what stays in `apps/*` is only what makes that product different.

| Folder        | Tool                 | Contains                                                                                |
| ------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `builder/`    | Angular / TypeScript | The `tsconfig` base, module declarations, and the native artifact collector for `dist/` |
| `vitest/`     | Unit tests           | The runner config (isolation and single thread) and the Storybook browser project       |
| `playwright/` | E2E tests            | The device matrix and execution policy                                                  |
| `storybook/`  | Storybook            | The config factory and the visual test runner                                            |
| `commitlint/` | Commitlint           | Commit message rules                                                                    |
| `husky/`      | Git hooks            | `pre-commit` and `commit-msg` (`core.hooksPath` points here)                            |
| `release/`    | Versioning           | The `commit-and-tag-version` preset                                                     |

## Workspace automation

Scripts nothing imports and no configuration extends — run from npm scripts, from CI, or by
hand. They are not build configuration, and they are not libraries either.

| Folder        | Runs                 | Contains                                                                                |
| ------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `ci/`         | GitHub Actions       | Release targets, platform declarations, lint ceiling, audit, split, execution graphs     |
| `qa/`         | `npm run check`      | The tiered runner, its log slicing and reports                                          |
| `workspace/`  | By hand              | Worktrees, sparse checkout, per-app `.gitignore` generation                              |
| `xbar/`       | macOS menu bar       | The runner plugin                                                                        |

Language follows the job, not the folder: `.mjs` where it talks to Node tooling, `.sh` for the
menu bar, `.py` where the work is geometry and image comparison and the library exists there.

## What does NOT belong here

**Code that tests import** — the accessibility auditor, screenshot helpers, flow recording —
lives in `libs/testing` (`@ibid/testing`). A library enters the Nx graph, which gives it an
alias, caching, `affected`, and boundary checks; a `tools/` folder gives none of that.

Rule of thumb: **if a `.spec.ts` or application code imports it, it is a lib.** Everything else
that serves the workspace rather than a product is `tools/` — whether a configuration file
extends it or an npm script runs it.

`libs/utils` is not the home for workspace scripts. It is the published `@ibid/utils` package
and its own repository in the monorepo split; anything placed there ships with it.

**Targets** — build, serve, test — are not here either: they live in the `targetDefaults` of
`nx.json`, which is Nx's mechanism for exactly this. They use the `{projectRoot}` and
`{projectName}` tokens, so a new app inherits the whole engine without copying configuration.

## Build output

Everything lands in `dist/<project>/`, native artifacts included:

```
dist/oh-save-me/
  browser/                    web build
  oh-save-me.0.0.0.apk        Android, collected from Gradle
  oh-save-me.0.0.0.dmg        desktop, collected from Tauri
  desktop/                    Cargo target (git-ignored)
```

`builder/collect-artifact.mjs` does the collecting: Gradle and Tauri write generic filenames
(`app-debug.apk`) inside `platforms/`, and this step brings each file next to the web builds
under a name that identifies project and version.
