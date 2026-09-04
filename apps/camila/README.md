# 🦖 Camila

Camila is a family reward system whose prize is a **real object**. Chore apps hand a child a number that goes up; Camila hands them a paper figure that unfolds as they earn it — turning in three dimensions on screen, and finally as a printable template they cut out and build with a parent. The points stop being an abstraction the moment the dinosaur stands on the shelf.

The adult side is deliberately not a form. The parent **writes one ordinary sentence** — *"Tidied up his toys and gave his brother a hug"* — and an on-device assistant reads it, proposes which behaviour domains it touched and how many points each is worth, and asks for a single confirmation. Nothing is categorised by hand unless the parent wants to correct it, and only a correction teaches the assistant.

Built on three pillars: **the prize is physical**, **the adult never fills in a form**, and **we operate no server**.

**The child has no device.** They look at the adult's phone — which is exactly why the child's screen is the entry point and the adult's side sits behind a **"Grown-ups!"** tab. You open the app, hand the phone over, and take it back. The boundary that matters is between screens, not devices.

Around that: there is no Camila account, no backend, no database — we never receive a word of a family's diary. Synchronisation is **adult-to-adult only**: two parents, two phones, one household file in **their own Google Drive**.

Having no infrastructure to pay for is also what makes the app free: the adult unlocks more figures by **watching a rewarded ad on their own screen**, instead of paying a subscription. Advertising lives strictly behind the **"Grown-ups!"** tab; the child build carries no ad code at all. See [`PRD.md`](PRD.md) §1.6 for the exact boundary and §6 for the obligations that follow.

Angular 22 with signals, `libs/ibid-ui` under the **Kirigami** theme, RxDB for local storage, and the 3D figure rendered with **CSS 3D transforms and no 3D library**. Mobile only, by design.

See [`PRD.md`](PRD.md) for the full vision, the functional requirements and the active roadmap (§5), and [`MVP.md`](MVP.md) for the scope and acceptance of the first shippable version.

> **Status:** pre-MVP. The loop from sentence to points to folds works end to end. Not yet built: the figure assembling part by part as thresholds are crossed, the guard on the **"Grown-ups!"** crossing, household sharing through Drive, and rewarded advertising. See `PRD.md` §5.

---

## 🏗️ Project Structure

```text
apps/camila/            # the app inside the ibid-workspace monorepo
├── src/
│   ├── app/
│   │   ├── domain/         # entities, rules, the classifier — pure TypeScript
│   │   ├── infrastructure/ # RxDB schemas and adapters
│   │   ├── application/    # use cases, signal state, i18n, the demo seed
│   │   └── ui/             # molecules, organisms, pages
│   ├── styles.scss         # the Kirigami theme plus Camila's own overrides
│   └── index.html
├── e2e/
│   ├── journeys/       # Deterministic Stateful Journeys, mobile only
│   └── support/        # frozen clock, seeded and empty entry points
├── uploads/            # reference material (Git ignored)
├── PRD.md              # product vision, requirements and roadmap
├── MVP.md              # MVP scope, acceptance and batch plan
└── project.json        # only what makes this app different from the others
```

---

## 🏛️ Angular Directory Layout: Domain-Driven Design (DDD)

Within `src/app/` the layers are strict, so the product rules never depend on Angular:

| Layer | Holds | Rule |
| :--- | :--- | :--- |
| `domain/` | Entities, the growth engine, the classifier, repository interfaces | Pure TypeScript. No Angular import, ever. |
| `infrastructure/` | RxDB schemas and adapters | Nothing reaches IndexedDB outside this folder. |
| `application/` | Use cases, `DiaryStore` (signals), i18n, the demo seed | Orchestrates the domain; owns no rules of its own. |
| `ui/` | `molecules/`, `organisms/`, `pages/` | Presentation only. Product-specific components carry the `camila-` prefix. |

Path aliases: `@domain/*`, `@application/*`, `@infrastructure/*`, `@ui/*`, plus the workspace's `ibid-ui`, `@ibid/services`, `@ibid/testing` and `@ibid/utils`.

---

## 🧠 The Assistant

A two-layer classifier, entirely on device, in `domain/services/domain-classifier.ts`:

1. **A shipped Portuguese vocabulary** — a few hundred ordinary words (*dishes*, *teeth*, *hug*, *patience*) mapped to the five behaviour domains with a weight each.
2. **Privately learned rules** — when the parent overrules a reading, every content word of that sentence is written into that household's own vocabulary, and from then on it **always outranks** the shipped one.

Three properties worth knowing:

* **`predictDomains()` returns several domains with points**, not one label. One sentence can land on Chores and Family at once.
* **Negation is scoped to the clause.** The text is split on punctuation and on joining words; a clause carrying a negation word scores nothing. *"Didn't brush his teeth"* earns nothing, while *"brushed his teeth without being asked"* earns the full amount.
* **`DomainPrediction` is a discriminated union**, so a caller cannot silently ignore the case where the assistant understood nothing.

`domain/data/pt/corpus.ts` pins the behaviour: sixteen sentences with their expected domains, plus five that must stay unread. It is the only defence against silent regression in a component whose failure is invisible, and it has already caught two real bugs.

---

## 🎨 Styling Architecture & Conventions

Camila wears the **Kirigami** theme from `libs/ibid-ui/src/themes/kirigami/`: cut-paper surfaces with irregular scissor edges, soft sheet lighting from the top-left, and a warm paper white.

The workspace conventions apply without exception — **SCSS with ITCSS layering**, **BEM** for every class, tokens from `settings/` and mixins from `tools/` instead of literal values, and no overrides outside the `trumps` layer.

Three Camila-specific overrides live in `src/styles.scss`, each for a stated reason:

* The theme paints primary buttons in solid blue; Camila repaints them ink-on-paper.
* `<ibid-header>` takes flow space while its shell is `position: fixed`, so the header would be counted twice; Camila zeroes its height.
* The backdrop wash is dialled down, because the composition is quiet and the theme's default is not.

**Muted text uses a defined ink, never `opacity`** — opacity dropped small text to 3.9:1 contrast and failed the accessibility audit.

---

## 🧊 The 3D Figure

`ui/organisms/paper-model/` renders paper models with **CSS 3D transforms only**. Two construction grammars are supported, matching how the paper is actually folded:

* **Extruded silhouette** — one profile, a front face and a back face, and a band per edge giving the volume. This is the *Paper Pet* construction: simplest to fold.
* **Box nets** — prisms with six shaded faces, plus crest spikes. This is the modular construction: trivially generatable, and the net *is* the 3D model.

Faces are `div` elements with `clip-path`, **not SVG**. An `<svg>` inside a `transform-style: preserve-3d` context is flattened by the browser — it renders three pixels wide. This is written down because it is not obvious and it cost an afternoon.

`domain/data/paper-models.ts` holds the geometry; the component only projects it.

---

## 🖨️ The Printable Template

`ui/organisms/cut-sheet/` draws the cut-out template as inline SVG on an A4 `viewBox`, with the papercraft vocabulary: solid cut lines, dashed fold lines, hatched glue areas, numbered parts and interchangeable eye strips.

One geometry, **two variants** driven by a `variant` input: `coloured` and `outline` (line art, to colour in). The variant only swaps custom properties, so the two sheets can never drift apart.

> The reference material in `uploads/` is third-party papercraft, used for study only. Everything the app draws is its own work: the construction grammar is common papercraft vocabulary and is not protectable, but the reference artwork is. Never ship a reproduction.

---

## 💎 Clean Code & Development Standards

The workspace standards apply in full — see the root `README.md`. The ones this app leans on hardest:

* **Comments are forbidden.** Names carry the meaning. If a lint rule demands a non-empty block, configure the rule.
* **Strict TypeScript.** Never `any`; `readonly` by default; union types over numeric enums; type guards over assertions.
* **Never return or accept `null`/`undefined` when it is avoidable.** Errors are thrown, not returned as codes.
* **Files of at most 200–300 lines**, small functions with one level of abstraction.
* **Selector prefix `camila-`**, enforced at lint time. The `app-` prefix is banned workspace-wide.
* **English** in documentation and code; user-facing copy lives in `i18n.config.ts`, default `pt-PT`.

---

## 🚀 Getting Started

```bash
npm install
npx nx serve camila
```

The app opens on **http://localhost:4400** and **seeds itself on first run**, so it is never a blank screen. The seed is an eight-week history that lands the figures across several fold stages, with exactly one entry the assistant cannot read — so the correction path is visible immediately.

In development, `window.camilaDev` exposes `seed()` and `reset()`. It is installed only when `isDevMode()` is true, and a deliberate `reset()` is remembered for the session so the app does not refill behind you.

---

## 🛠️ Development & Build Commands

| For | Command |
| :--- | :--- |
| Serve | `npx nx serve camila` (port 4400) |
| Build | `npx nx build camila` |
| Unit tests | `npx nx test camila` |
| E2E journeys | `npx nx e2e camila` |
| Accessibility audit | `npx nx test-a11y camila` |
| Storybook | `npx nx storybook camila` (port 6008) |
| Validate a change | `npx nx affected -t lint test build` |

Ports: **4400** serve, **4401** e2e, **6008** Storybook.

---

## 🧪 Spec-Driven TDD

`.spec.ts` files are written before or alongside the implementation, Red-Green-Refactor, and cover all business logic. The domain layer is fully testable with no UI: the growth engine, the classifier and the use cases run against in-memory repository doubles in `application/testing/`.

---

## 📸 Visual Testing & Deterministic Stateful Journeys

Every UI component carries a `*.stories.ts` in the same folder, and the E2E journeys are **DSJ**: mobile viewport only (390×844), a frozen clock, a seeded database, and a continuous chain from write → reading → confirmation → folds, with `page.reload()` proving persistence.

The journeys never test against empty data by accident — `openSeeded()` and `openEmpty()` make the starting state explicit — and one journey asserts the first-run empty state deliberately, because that is a real product state.

---

## 🌿 Git & Versioning

The workspace rules apply: work is reviewed and committed through GitHub Desktop, in batches of at most ten files, each with a single Conventional Commits subject line, scope `camila`. The type decides the version: `fix` bumps patch, `feat` bumps minor, `feat!` bumps major.

---

## ⚠️ A Note on Children's Data

This product concerns a minor and is treated as YMYL throughout.

* **The child has no device and no account.** They look at the adult's phone. The separation is between screens: the child's screen reaches nothing but the figure.
* **A child's photograph never leaves the device it was added on** — not to Drive, not between two parents. Each parent adds their own. The app only displays it: no detection, no matching, no derived features.
* **We run no server.** No account, no backend, no database of ours. A household's diary syncs **adult-to-adult** through **their own Google Drive**, never through us.
* **Advertising is only ever rendered on the adult's screen**, behind the **"Grown-ups!"** tab, and never while the child's screen is showing.
* **Consent before personalised ads** in the EEA and the UK, through a certified CMP. Refusing leaves the app fully usable with non-personalised advertising.
* **Never write that nothing leaves the device.** It is not true any more, and an overstated privacy claim is a liability with users, with store reviewers and under consumer protection rules. `PRD.md` §1.6 is the claim to make.
* The assistant **scores events, never traits**. *"Helped with dinner"* is an event; *"is helpful"* is a profile of a minor, which is a different legal object under EU Regulation 2024/1689.
* GDPR and parental consent apply. The Portuguese digital consent age is 13 (Portuguese Law 58/2019, art. 16) — confirm with a lawyer; national law diverges within the EU.
* The product gives no medical, legal or financial advice, and makes no clinical claim.
