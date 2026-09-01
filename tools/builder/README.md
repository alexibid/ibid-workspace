# tools/builder

The compilation base shared by the workspace's Angular apps.

| File                     | Extended by                                             |
| ------------------------ | ------------------------------------------------------- |
| `tsconfig.app.base.json` | Each app's `tsconfig.json`                              |
| `module-typings.d.ts`    | Storybook's tsconfig, for non-code module imports       |
| `collect-artifact.mjs`   | The native build targets, to place artifacts in `dist/` |

Each app keeps only what distinguishes it: the `paths` block pointing at its own layers, and
any options it chose to relax.

## The rest of the engine is not here

**Targets** — build, serve, test — live in the `targetDefaults` of `nx.json`, which is Nx's
mechanism for this. They use the `{projectRoot}` and `{projectName}` tokens, so a new app
inherits the whole engine without copying configuration: its `project.json` declares only what
is its own, such as the styles list and the bundle budgets.
