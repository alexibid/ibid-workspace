# ibid-workspace

An Nx monorepo holding ibid's Angular products around a shared design system and a set of
shared libraries.

The idea is simple: each product is an independent application under `apps/`, and anything
generic enough to be reused by more than one product — visual components, utility functions,
infrastructure services — lives under `libs/` and is consumed through imports.

## Structure

| Projeto / Ferramenta                  |  Tipo  | Descrição                                                      |
| :------------------------------------ | :----: | :------------------------------------------------------------- |
| **[boilerplate](./apps/boilerplate)** | `app`  | Minimal Angular skeleton, the starting point for new products. |
| **[oh-save-me](./apps/oh-save-me)**   | `app`  | Personal and family finance assistant (PT: Oh poupa-me!).      |
| **[ibid-ui](./libs/ibid-ui)**         | `lib`  | Design system: components, global styles, and icons.           |
| **[services](./libs/services)**       | `lib`  | Infrastructure services (i18n, authentication, sync).          |
| **[testing](./libs/testing)**         | `lib`  | Generic test engines (accessibility, screenshots, flows).      |
| **[utils](./libs/utils)**             | `lib`  | Pure functions, no dependencies.                               |
| **[builder](./tools/builder)**        | `tool` | Shared compilation base for the apps.                          |
| **[vitest](./tools/vitest)**          | `tool` | Unit test runner configuration.                                |
| **[playwright](./tools/playwright)**  | `tool` | Device matrix and execution policy.                            |
| **[storybook](./tools/storybook)**    | `tool` | Addons, framework, and visual test runner.                     |
| **[commitlint](./tools/commitlint)**  | `tool` | Commit message rules.                                          |
| **[husky](./tools/husky)**            | `tool` | Git hooks.                                                     |
| **[release](./tools/release)**        | `tool` | Versioning preset.                                             |

### Dependency rule

- An **app** may import from any **lib**.
- A **lib** never imports from an **app**.
- Between libs, the only allowed dependency is `utils` — the one with no dependencies of its
  own.

The rule is enforced at lint time by `@nx/enforce-module-boundaries`, configured in
`eslint.config.mjs`.

### Selector prefixes

A selector's prefix says where the element comes from. `app-` is banned across the workspace.

| Origin             | Prefix         |
| ------------------ | -------------- |
| `libs/ibid-ui`     | `ibid-`        |
| `apps/oh-save-me`  | `ohsaveme-`    |
| `apps/boilerplate` | `boilerplate-` |

## Applications

### `apps/oh-save-me`

The personal and family finance assistant — **Oh Save Me!** in English, **Oh poupa-me!** in
Portuguese, with the name varying by country through the `appName` translation key. It gives
direct answers ("can I afford a holiday this month?") instead of spreadsheets, imports bank
statements, and categorises them automatically. It was called SavvyJar until version 1.6.2.

Layered DDD architecture under `src/app/`:

```
apps/oh-save-me/
  src/app/
    domain/           models, repository interfaces, rules, and domain services
    application/      use cases, selectors, store, i18n and translations
    infrastructure/   RxDB, SQLite, Google Drive sync, APIs
    ui/               pages, templates, components, pipes, and directives
  e2e/                18 Playwright journeys, including the accessibility audit
  platforms/
    desktop/          Tauri v2 (macOS, Windows, Linux)
    mobile/           Capacitor (iOS, Android)
  .storybook/         Storybook configuration
  public/             static assets and manifest
```

Distribution: web through Firebase Hosting, desktop through Tauri, mobile through Capacitor.

### `apps/boilerplate`

An empty Angular application that serves as the mould for new products: routing configured,
`styles.scss` already importing the design system, and the navigation shell assembled from
`ibid-header` and `ibid-header-nav`. Copy this folder to start a new app instead of generating
everything from scratch.

## Libraries

### `libs/ibid-ui` — imported as `ibid-ui`

The design system. Components follow Atomic Design, organised by composition level:

```
src/lib/
  atoms/        button, icon (+ icon-registry), icon-button, divider, select, scrim,
                date-input, number-input, search-input, empty-state, drag-handle,
                stack-dots, stat-icon, view-more-link, legend-item, currency-display,
                chart-tooltip, chart-marker-dot, chart-bar-segment,
                bottom-sheet-header / -body / -footer
  molecules/    card, form-field, metric-card, stat-card, summary-row, progress-row,
                segmented-control, info-balloon, bottom-sheet-dialog,
                chart-headline, chart-legend
  organisms/    bar-chart, line-chart, chart, header, header-nav
  directives/   hand-drawn
  models/       shared UI and chart series types
```

Global styles live in `src/styles/`, organised in ITCSS by increasing specificity:

```
src/styles/
  settings/     colors, typography, spacing, elevation, breakpoints (no CSS output)
  tools/        mixins (no CSS output)
  generic/      reset, scrollbars
  elements/     base, icons
  objects/      layout, table, hand-drawn, bottom-sheet-dialog
  components/   buttons, forms, cards, selects, menus, metrics-summary-card
  trumps/       utilities
```

The entry point is `src/styles.scss`, which `@use`s every layer in the right order. An app
consumes all of it with one line in its own `styles.scss`:

```scss
@use 'libs/ibid-ui/src/styles';
```

**Icons** live in `libs/ibid-ui/assets/icons/` — 132 SVGs at 512x512. They are copied into any
app's build by the `targetDefaults` and served under `icons/`, which is where
`IconRegistryService` fetches them. A new app gets them without configuring anything.

### `libs/services` — imported as `@ibid/services`

Infrastructure services, with no product business logic:

- **i18n** — `I18nService` and the `appTranslate`, `appDate`, `appCurrency` pipes. Translation
  dictionaries belong to each app, not to the library.
- **sync** — `GoogleAuthService` (Capacitor authentication) and `ConflictResolverService`.

### `libs/testing` — imported as `@ibid/testing`

Test engines that know nothing about any product's domain: `A11yAuditor` (injects axe-core and
fails on critical or serious WCAG 2.1 AA violations, plus text under 12px), `FlowRecorder`
(captures a flow step by step), and the per-device screenshot path helpers.

### `libs/utils` — imported as `@ibid/utils`

Pure, stateless functions with no dependencies: `date`, `string`, `parsing`, `color-contrast`.
Each file has its matching `.spec.ts`.

### Aliases

Defined in `tsconfig.base.json`:

| Alias            | Path                         |
| ---------------- | ---------------------------- |
| `ibid-ui`        | `libs/ibid-ui/src/index.ts`  |
| `@ibid/services` | `libs/services/src/index.ts` |
| `@ibid/testing`  | `libs/testing/src/index.ts`  |
| `@ibid/utils`    | `libs/utils/src/index.ts`    |

Always import through the alias — never through a relative path between projects.

## The shared build engine

A new app copies no configuration: it inherits it. The engine lives in two places, depending on
what it is.

**Targets live in the `targetDefaults` of `nx.json`** — build, serve, and test for any Angular
app in the workspace, written with the `{projectRoot}` and `{projectName}` tokens:

```json
"@angular/build:application": {
  "options": {
    "outputPath": "dist/{projectName}",
    "browser": "{projectRoot}/src/main.ts",
    "tsConfig": "{projectRoot}/tsconfig.app.json"
  }
}
```

Each app's `project.json` declares only what makes it different — its styles list and its
bundle budgets.

**Configuration extended by files lives in `tools/`:**

| File                                   | Defines                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `tools/builder/tsconfig.app.base.json` | Compiler and Angular options common to the apps            |
| `tools/vitest/runner.config.ts`        | Test isolation and single-threaded execution               |
| `tools/playwright/playwright.base.ts`  | Device matrix (mobile/tablet/desktop) and execution policy |
| `tools/storybook/create-config.ts`     | Addons, framework, and alias derivation                    |

`tools/` sits outside the Nx project graph on purpose. The rule that separates the two folders:
**if a `.spec.ts` imports it, it is a lib; if a configuration file extends it, it is `tools/`.**
A library enters the graph — gaining an alias, caching, `affected`, and boundary checks; a
`tools/` folder gains none of that.

## Stack

- **Angular 22** with standalone components and the `@angular/build` builder
- **Nx 23** for the project graph, caching, and task execution
- **TypeScript 6** in strict mode
- **Vitest** with jsdom for unit tests
- **Playwright** for E2E journeys and accessibility audits
- **Storybook** for the component catalogue and visual regression
- **ESLint** flat config, enforcing project boundaries and selector prefixes
- **ng-packagr** for packaging the libraries
- **Capacitor** and **Tauri** for mobile and desktop builds

## Commands

Install dependencies:

```bash
npm install
```

Serve the application in development:

```bash
npm start
```

Production build:

```bash
npm run build
```

Tests across every project:

```bash
npm test
```

Only what your changes affect:

```bash
npm run affected
```

Playwright journeys:

```bash
npm run e2e
```

Accessibility audit:

```bash
npm run test:a11y
```

Storybook — the design system (port 6007):

```bash
npm run storybook:ui
```

Storybook — the product, with the design system composed into its sidebar (port 6006):

```bash
npm run storybook:start
```

Storybook — the boilerplate showcase (port 6008):

```bash
npm run storybook:boilerplate
```

Desktop and mobile:

```bash
npm run desktop:dev
```

```bash
npm run mobile:ios
```

Publish the site:

```bash
npm run deploy
```

See the dependency graph:

```bash
npx nx graph
```

## macOS Menu Bar Integration (xbar)

A lightweight macOS menu bar plugin lives in `tools/xbar/ibid-runner.10s.sh` to manage workspace builds, local runner services, and deliveries:

- **Minimal template icon**: Uses the `.i` design token favicon with dynamic status indicators (`⟳` building, `○` stopped, or clean icon when running).
- **Background Runner Control**: Start, stop, restart, and inspect logs for the local GitHub Actions runner (auto-detects `actions.runner.*`, e.g. `actions.runner.alexibid-ibid-workspace.<runner-name>`).
- **Workspace Actions**: Run fast affected checks (`check:fast`), full workspace builds (`check:build`), or deploy all web apps to Firebase Hosting.
- **Product Actions (Oh Save Me!, Boilerplate, Camila)**:
  - 1-click native installer builds (`.dmg` + `.apk`).
  - Automatic mounting of macOS `.dmg` installers.
  - Direct USB installation to connected Android devices (`adb install -r`).
  - 1-click Firebase Hosting deployment per application.
  - Direct links to live Web Apps (`https://ibid-ohsaveme.web.app`, `https://ibid-boilerplate.web.app`, `https://ibid-camila.web.app`).
- **Live CLI Monitoring & Native Notifications**: 1-click launch of animated GitHub CLI monitor (`gh run watch`) or live local runner logs in Terminal, with automatic native macOS notification banners on job state transitions.
- **Google Drive Sync**: Synchronizes all native installers (`.dmg`, `.apk`, `.exe`, `.msi`, `.deb`, `.rpm`, `.AppImage`) from `dist/` directly into the local Google Drive folder (`ibid-builds/`).

To install into [xbar](https://xbarapp.com/):

```bash
ln -sf "$(pwd)/tools/xbar/ibid-runner.10s.sh" ~/Library/Application\ Support/xbar/plugins/
```

## Build output

Everything lands in `dist/<project>/`, native artifacts included:

```
dist/oh-save-me/
  browser/                    web build
  oh-save-me.0.0.0.apk        Android, collected from Gradle
  oh-save-me.0.0.0.dmg        desktop, collected from Tauri
```

`tools/builder/collect-artifact.mjs` does the collecting: Gradle and Tauri write generic
filenames inside `platforms/`, and this step brings each one next to the web builds under a
name that identifies project and version.

## Code conventions

- **SCSS** — ITCSS for the layers and BEM for class names (`.block`, `.block__element`,
  `.block--modifier`). No overrides outside the `trumps` layer.
- **TypeScript** — no `any`; `unknown` or generics instead. `readonly` for immutability,
  optional chaining and nullish coalescing for null-safety, type guards instead of assertions.
- **Structure** — small single-responsibility functions with one level of abstraction, files up
  to 200–300 lines, names that reveal intent.
- **No comments.** Code explains itself through its names; if a lint rule demands a non-empty
  block, configure the rule rather than writing a comment.
- **Formatting** — Prettier and ESLint are the authority.

## Publishing

Three workflows, chained:

| Workflow           | Triggered by                    | Does                                                                                                                                |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`           | Pull request and push to `main` | Lint, tests, and build, only on affected projects                                                                                   |
| `auto-version.yml` | Push to `main`                  | Derives the version from conventional commits, writes the changelog, publishes the tag                                              |
| `release.yml`      | A `v*` tag                      | Builds web, Android APK, and desktop installers; attaches them to the release, uploads them to Google Drive, and publishes the site |

Installers come out with the version already in the name — `oh-save-me.1.2.3.apk`,
`oh-save-me.1.2.3.dmg` — because `tools/builder/collect-artifact.mjs` renames them as it
collects them into `dist/`.

### Secrets and variables to configure on GitHub

| Name                       | Type     | Purpose                                                                                                                             |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `RELEASE_TOKEN`            | Secret   | Personal token with `contents:write`. Without it the tag is published with `GITHUB_TOKEN`, which does **not** trigger `release.yml` |
| `RCLONE_CONF_BASE64`       | Secret   | Base64 rclone configuration, for the Google Drive upload                                                                            |
| `FIREBASE_SERVICE_ACCOUNT` | Secret   | Firebase service account, for publishing the site                                                                                   |
| `DRIVE_FOLDER`             | Variable | Destination folder on Drive (defaults to `ibid-builds`)                                                                            |

Every step depending on a missing secret is skipped with a note in the run summary, rather than
failing the whole release.

### Preparing the Google Drive upload

`rclone` is used with **your** account, not a service account: a service account has no storage
in My Drive and the upload would fail. On your machine:

```bash
rclone config create gdrive drive scope drive
```

That opens a browser to authorise access. Then encode the configuration and store the result in
the `RCLONE_CONF_BASE64` secret:

```bash
base64 -i ~/.config/rclone/rclone.conf | pbcopy
```

Files land in `<DRIVE_FOLDER>/oh-save-me/v<version>/`, and only the ones carrying the version in
their name — the web build and Cargo intermediates are left out.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request, executing lint,
tests, and build across the affected projects.
