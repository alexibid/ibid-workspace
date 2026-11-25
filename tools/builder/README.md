# tools/builder

The compilation base shared by the workspace's Angular apps.

| File                     | Used by                                                                                                                                      |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.app.base.json` | Each app's `tsconfig.json`, which extends it                                                                                                 |
| `module-typings.d.ts`    | Storybook's tsconfig, for imports of non-code modules                                                                                        |
| `collect-artifact.mjs`   | The native build targets: copies the APK and the desktop installer from `platforms/` to `dist/<project>/`, named `<project>.<version>.<ext>` |
| `sync-app-version.mjs`   | The mobile and desktop targets: writes the app's version into `build.gradle`, the Xcode project and `tauri.conf.json`                        |
| `hash-directories.mjs`   | Build `runtime` inputs: prints one hash of the named folders, so git-ignored assets such as exported pages still invalidate the build cache  |

Each app keeps only what distinguishes it: the `paths` block pointing at its own layers, and any
option it chose to relax.

The targets themselves — build, serve, test, desktop, mobile — are the `targetDefaults` of
`nx.json`, written with the `{projectRoot}` and `{projectName}` tokens. An app's `project.json`
declares only what is its own, such as its styles, budgets and ports.
