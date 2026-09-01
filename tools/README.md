# tools/

One folder per tool. Each holds the configuration shared by **every** project in the workspace;
what stays in `apps/*` is only what makes that product different.

| Folder        | Tool                 | Contains                                                                                |
| ------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `builder/`    | Angular / TypeScript | The `tsconfig` base, module declarations, and the native artifact collector for `dist/` |
| `vitest/`     | Unit tests           | The runner config (isolation and single thread) and the Storybook browser project       |
| `playwright/` | E2E tests            | The device matrix and execution policy                                                  |
| `storybook/`  | Storybook            | The config factory and the visual test runner                                           |
| `commitlint/` | Commitlint           | Commit message rules                                                                    |
| `husky/`      | Git hooks            | `pre-commit` and `commit-msg` (`core.hooksPath` points here)                            |
| `release/`    | Versioning           | The `commit-and-tag-version` preset                                                     |

## What does NOT belong here

**Code that tests import** — the accessibility auditor, screenshot helpers, flow recording —
lives in `libs/testing` (`@ibid/testing`). A library enters the Nx graph, which gives it an
alias, caching, `affected`, and boundary checks; a `tools/` folder gives none of that.

Rule of thumb: **if a `.spec.ts` imports it, it is a lib; if a configuration file extends it,
it is `tools/`.**

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
