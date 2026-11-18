# ibid-workspace

An Nx monorepo for ibid's products. The products and the libraries they share are separate
repositories, mounted here as git submodules. Build configuration, CI/CD and workspace tooling
live in this repository.

## Projects

Every app and library under `apps/` and `libs/` is a submodule with its own repository and
README.

| Project                                                  | Type | What it is                                                                           |
| :------------------------------------------------------- | :--- | :----------------------------------------------------------------------------------- |
| [oh-save-me](./apps/oh-save-me)                          | app  | Personal and family finance assistant (PT: _Oh poupa-me!_). Web, desktop and mobile. |
| [papikapi](./apps/papikapi)                              | app  | Children's habits app whose rewards are printable papercraft figures.                |
| [papikapi-studio](./apps/papikapi-studio)                | app  | Web studio that generates papikapi's 3D papercraft figures.                          |
| [papikapi-api](./apps/papikapi-api)                      | app  | Node API and generation pipeline behind papikapi and the studio.                     |
| [boilerplate](./apps/boilerplate)                        | app  | Angular starting point for new products, and the design system's Storybook host.     |
| [ibid-website](./apps/ibid-website)                      | app  | ibid's public website (Angular SSR + PocketBase), outside the shared build.          |
| [ibid-ui](./libs/ibid-ui)                                | lib  | Design system: Atomic Design components, ITCSS styles and icons.                     |
| [services](./libs/services)                              | lib  | Infrastructure services: i18n, theme, translation, voice and Google Drive sync.      |
| [testing](./libs/testing)                                | lib  | Product-agnostic test engines: accessibility audit, flow recording and screenshots.  |
| [utils](./libs/utils)                                    | lib  | Pure functions with no dependencies.                                                 |
| [workspace-menu](./tools/workspace-menu)                 | tool | macOS menu bar app with the state of CI/CD and the workspace.                        |
| [ci-runner](./tools/ci/runner)                           | tool | The self-hosted Docker runner for GitHub Actions.                                    |
| [nested-scss-definition](./tools/vscode-scss-definition) | tool | VS Code extension: go to definition for nested SCSS selectors.                       |

`tools/` holds everything else that serves the workspace rather than a product. See
[tools/README.md](./tools/README.md).

### Rules between projects

- An app may import from any lib. A lib never imports from an app.
- `services`, `testing` and `utils` import no other project. `ibid-ui` imports `@ibid/services`
  and `@ibid/utils`.
- Always import through the alias, never through a relative path between projects.

`@nx/enforce-module-boundaries` in `eslint.config.mjs` refuses relative imports between projects
and imports of non-buildable libs from buildable ones. It has no tag constraints, so the
direction between projects is kept by review, not by lint.

| Alias            | Path                         |
| :--------------- | :--------------------------- |
| `ibid-ui`        | `libs/ibid-ui/src/index.ts`  |
| `@ibid/services` | `libs/services/src/index.ts` |
| `@ibid/testing`  | `libs/testing/src/index.ts`  |
| `@ibid/utils`    | `libs/utils/src/index.ts`    |

A selector's prefix says where the element comes from. `app-` is not allowed.

| Origin                 | Prefix         |
| :--------------------- | :------------- |
| `libs/ibid-ui`         | `ibid-`        |
| `apps/oh-save-me`      | `ohsaveme-`    |
| `apps/papikapi`        | `papikapi-`    |
| `apps/papikapi-studio` | `papikapi-`    |
| `apps/boilerplate`     | `boilerplate-` |
| `tools/workspace-menu` | `ibid-tools-`  |

## Stack

- Angular 22 with standalone components and the `@angular/build` builder
- Nx 23 for the project graph, caching and task execution
- TypeScript 6 in strict mode
- Vitest for unit tests, Playwright for journeys and accessibility audits
- Storybook 10 for the component catalogues
- ESLint flat config, with a warning ceiling in CI
- Capacitor 8 for iOS and Android, Tauri 2 for desktop
- Firebase Hosting for the web builds

`ibid-website` and `papikapi-api` keep their own `package.json` and dependencies.

## Getting started

```bash
git clone --recurse-submodules https://github.com/alexibid/ibid-workspace.git
```

```bash
npm install
```

`npm install` also installs the git hooks from `tools/husky` and puts every submodule on its
`main` branch (`tools/workspace/attach-submodules.mjs`), so work there never starts on a
detached HEAD.

## Commands

| For                                             | Command                                                                          |
| :---------------------------------------------- | :------------------------------------------------------------------------------- |
| Serve Oh Save Me! (port 4200)                   | `npm start`                                                                      |
| Serve any app                                   | `npx nx serve <project>`                                                         |
| Everything: lint, tests, build and journeys     | `npm run check`                                                                  |
| Only what your changes affect                   | `npm run check:affected`                                                         |
| One tier across every project                   | `npm run check:lint` · `check:test` · `check:build` · `check:e2e` · `check:a11y` |
| One project                                     | `npm run check:<project>`                                                        |
| The same check CI runs, in a clean clone        | `npm run check:clean`                                                            |
| Secrets, vulnerabilities, platform declarations | `npm run check:secrets` · `check:audit` · `check:platforms`                      |
| Journeys of one app                             | `npx nx e2e <project>`                                                           |
| Design system Storybook (port 6006)             | `npm run storybook:start`                                                        |
| Oh Save Me! Storybook (port 6007)               | `npm run storybook:product`                                                      |
| Desktop app in development                      | `npm run desktop`                                                                |
| iOS / Android                                   | `npm run mobile:ios` · `mobile:android`                                          |
| Dependency graph                                | `npx nx graph`                                                                   |
| Clear every cache and `dist/`                   | `npm run clean`                                                                  |

`tools/qa/check.mjs` runs the tiers in order and keeps the logs of the last ten runs in
`test-results/qa/`.

### Ports

| Project           | Serve | E2E  | Storybook |
| :---------------- | :---- | :--- | :-------- |
| `oh-save-me`      | 4200  | 4201 | 6007      |
| `boilerplate`     | 4300  | 4301 | 6006      |
| `papikapi`        | 4400  | 4401 | 6008      |
| `papikapi-studio` | 4500  | 4501 | —         |
| `workspace-menu`  | 4520  | —    | —         |

### Submodules

| For                                     | Command                     |
| :-------------------------------------- | :-------------------------- |
| Pull every submodule's `main`           | `npm run submodules:update` |
| See the commit each submodule points at | `npm run submodules:status` |
| Push every submodule's `main`           | `npm run submodules:push`   |

A change inside a submodule is committed in that submodule first. This repository then commits
the new pointer.

## The shared build engine

A new app inherits its configuration instead of copying it.

- **Targets** — build, serve, unit tests, lint, desktop and mobile — are the `targetDefaults` of
  `nx.json`, written with the `{projectRoot}` and `{projectName}` tokens. Each `project.json`
  declares only what is its own: styles, budgets, ports.
- **Configuration that files extend** lives in `tools/`: the `tsconfig` base in
  `tools/builder`, the Vitest runner in `tools/vitest`, the Playwright device matrix in
  `tools/playwright` and the Storybook factory in `tools/storybook`.

The icons in `libs/ibid-ui/assets/icons/` are copied into every app's build by the
`targetDefaults` and served under `icons/`.

Everything lands in `dist/<project>/`, native installers included, with the version in the
name: `dist/oh-save-me/oh-save-me.1.2.3.apk`, `oh-save-me.1.2.3.dmg`.
`tools/builder/collect-artifact.mjs` brings them there from `platforms/`.

## CI/CD

Every job runs on a self-hosted runner, except the two summary jobs of CI.

| Workflow           | Runs on                            | Does                                                                                                                                                                                                                                                  |
| :----------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`           | Pull requests and pushes to `main` | Platform declarations, lint against the warning ceiling, types, unit tests and build — every project on `main`, the affected ones on a pull request — then the journeys of each affected app. Merges `bump/` pull requests once every group is green. |
| `auto-version.yml` | CI green on `main`                 | `tools/ci/release.mjs`: reads each submodule's conventional commits, lets Nx resolve the versions, then commits, tags and pushes them in the submodule and here.                                                                                      |
| `release.yml`      | A `<project>-v<version>` tag       | Web bundle, Android APK and macOS installer; uploads the installers to Google Drive and publishes to Firebase Hosting and the design system Storybook. A failing job names the step that broke, lists what was already delivered, and stops the rest. |
| `dependencies.yml` | Mondays at 05:00 UTC, or by hand   | `npm update` within each range, then audit, lint, types, tests and build, and pushes the new lockfile to `main`.                                                                                                                                      |
| `split.yml`        | By hand                            | Mirrors `tools/` to [alexibid/tools](https://github.com/alexibid/tools). It refuses any path that is a submodule.                                                                                                                                     |

Dependabot (`.github/dependabot.yml`) only raises alerts; it opens no pull requests.

Nx cannot drive git for the release, because the files it versions are inside submodules.
`nx.json` keeps `release.version.git` off, and `tools/ci/release.mjs` does the git work in
both repositories.

### Runners

| Runner                                | Where                                 | Runs                                                                   |
| :------------------------------------ | :------------------------------------ | :--------------------------------------------------------------------- |
| Docker (`self-hosted, Linux, docker`) | `tools/ci/runner`, restarts by itself | CI, journeys, versioning, dependencies, split, web, hosting, Storybook |
| Mac (`self-hosted, macOS, ARM64`)     | launchd service                       | Android APK, macOS installer, Google Drive                             |

The Docker runner registers itself with the GitHub CLI session already on the Mac:

```bash
npx nx run ci-runner:register
```

### Firebase Hosting

Project `ibid-32cbe`. The targets are in `firebase.json` and `.firebaserc`.

| Target        | Site               | Serves                       |
| :------------ | :----------------- | :--------------------------- |
| `oh-save-me`  | `ibid-ohsaveme`    | `dist/oh-save-me/browser`    |
| `papikapi`    | `ibid-papikapi`    | `dist/papikapi/browser`      |
| `boilerplate` | `ibid-boilerplate` | `dist/boilerplate/browser`   |
| `storybook`   | `ibid-storybook`   | `dist/storybook/boilerplate` |
| `assets`      | `ibid-assets`      | `dist/assets-site`           |

The design system Storybook is published whenever `boilerplate` or `ibid-ui` is released.
`IBID_DESIGN_SYSTEM_STORYBOOK_URL` points the product Storybooks at it; without it they compose
the local one on port 6006.

### Secrets and variables

| Name                                                                        | Type     | For                                                                                          |
| :-------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------- |
| `RELEASE_TOKEN`                                                             | Secret   | Checking out the private submodules, pushing versions and tags, and triggering `release.yml` |
| `FIREBASE_SERVICE_ACCOUNT`                                                  | Secret   | Publishing to Firebase Hosting                                                               |
| `RCLONE_CONF_BASE64`                                                        | Secret   | The Google Drive upload                                                                      |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` | Secret   | Signing the release APK                                                                      |
| `DRIVE_FOLDER`                                                              | Variable | Destination folder on Drive (defaults to `ibid-builds`)                                      |

Dependabot reads the submodules with its own `RELEASE_TOKEN`, kept as a Dependabot secret. A
step whose secret is missing is skipped with a note in the run summary.

The Google Drive upload uses rclone with a personal account, because a service account has no
storage in My Drive:

```bash
rclone config create gdrive drive scope drive
```

```bash
base64 -i ~/.config/rclone/rclone.conf | pbcopy
```

Paste the result into the `RCLONE_CONF_BASE64` secret. Installers land in
`<DRIVE_FOLDER>/<project>/v<version>/`.

## Code conventions

- **SCSS** — ITCSS layers and BEM class names (`.block`, `.block__element`, `.block--modifier`).
  Overrides only in the `trumps` layer.
- **TypeScript** — no `any`; `readonly`, optional chaining and nullish coalescing; type guards
  instead of assertions.
- **Structure** — small single-responsibility functions, files up to 200–300 lines, names that
  reveal intent, no comments in place of names.
- **Commits** — conventional commits (`tools/commitlint`), `type(scope): subject`, where the
  scope is the Nx project. They drive the automatic versioning.
- **Formatting** — Prettier and ESLint are the authority.
