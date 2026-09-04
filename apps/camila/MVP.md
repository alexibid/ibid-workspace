# 🚀 Minimum Viable Product (MVP) — Camila

**Product Name:** Camila *(working name)*
**Version:** 0.1.0 (pre-MVP)
**Target Platform:** Mobile web

Scope and acceptance for the first shippable version. The full vision, the functional
requirements and the roadmap live in [`PRD.md`](PRD.md); this document does not repeat them.

---

**Decisions taken 2026-09-03:**

- **Positive only.** Thresholds carry one sign. `Rule` has no valence field. A tree that grows
  more slowly is indistinguishable from a tree that had fewer entries, so a negative side could
  never surface to the child without breaking the positive-parenting promise.
- **Five behaviour domains** — Behaviour, Chores, School, Talking and Family, in the language a
  parent would use. This set is simultaneously the classifier's entire vocabulary and the shape
  of what a child can earn.
- **One device, always.** The child has no device and no account — they look at the adult's phone.
  The child's screen is the entry point precisely so the phone can be handed over. Synchronisation,
  when it comes, is adult-to-adult only.

---

## 1. The loop

The MVP is done when this runs end to end and survives a reload:

```
parent writes a sentence
        ↓
assistant assigns a domain and a weight, on device
        ↓
the branch for that domain grows
        ↓
a threshold is crossed and a badge unfolds
        ↓
a wrong assignment is corrected in one tap, and the correction teaches the assistant
```

Nothing else is required for the MVP to be a product rather than a demo.

## 2. In scope

| | Delivered |
| --- | --- |
| **Shell** | Kirigami theme, pt/en, header, navigation, two routes |
| **Diary** | Free-text entry, persisted. One sentence is a complete entry |
| **Assistant** | On-device classifier with a shipped Portuguese vocabulary over the six domains |
| **Recognition** | A domain and a weight derived per entry, correctable |
| **Correction** | One-tap reassignment writing a private rule that outranks the baseline |
| **Rules** | Seeded thresholds per domain, editable as data |
| **Badges** | Earned when a threshold is crossed |
| **Tree** | `camila-growth-scene`, data-driven, one branch per domain |
| **Persistence** | RxDB, local only |

## 3. Out of scope, deliberately

| Deferred | To | Why |
| --- | --- | --- |
| Household sharing through Drive | Phase 2 | `@ibid/services` already solves the transport; the design constraint is in `PRD.md` §6.1 — a shared folder, not `appDataFolder`, because hidden and shared are mutually exclusive |
| Rewarded advertising | Phase 3 | Gated on §6.2 of the PRD: certified SDK, age gate, CMP, adult surface only, and a child build with no ad code in it |
| Speech-to-text dictation | Phase 2 | Native bridge; the diary works without it |
| Biometric / PIN guard | Phase 2 | Only meaningful once two devices exist |
| Multi-child UI | Phase 2 | **The schema partitions by child from day one regardless** |
| Household sharing between two adults | Phase 2 | Two parents, two phones, one file in their own Drive |
| Notifications | Never | The tree resting is the retention mechanic |

## 4. The five domains

| Domain | Covers | Icon |
| --- | --- | --- |
| **Behaviour** | managing frustration, waiting, behaving well out of the house | `verified` |
| **Chores** | the table, the dishes, tidying up, dressing, washing, eating, sleeping | `house` |
| **School** | homework, studying, reading, effort | `book` |
| **Talking** | telling, asking, explaining, listening | `people` |
| **Family** | siblings, grandparents, sharing, affection | `favorite` |

The set is closed. Adding a domain is a product decision, not a configuration change: it alters
the classifier's vocabulary, the seeded rules, and what a child can earn.

## 5. Acceptance criteria

**The diary asks for nothing.**
- A single word is accepted, scored and persisted.
- No validation error is reachable from the diary, under any input.
- The parent can write and leave without seeing a categorisation UI.

**The assistant is never absurd.**
- A fixture corpus of Portuguese sentences asserts the expected domain per entry.
- Below the confidence threshold the entry is kept and surfaced for one-tap assignment, never
  discarded and never loudly guessed.
- Every correction writes a private rule that outranks the shipped baseline on the next similar
  entry. This is asserted in a spec, not assumed.
- The classifier scores events, never traits.

**The tree is the score.**
- Growth is driven entirely by `TreeState`; no art asset decides behaviour.
- With no entries the tree **rests**. It never wilts, decays or loses anything, and no surface
  displays a message about nothing having been recorded.
- A raw point total is never the headline.

**Everything survives a reload.**
- The DSJ journey chains write → recognise → grow → badge → correct with `page.reload()` between
  steps.

**Quality gates.**
- `nx affected -t lint test build` green.
- Accessibility audit passes with no critical or serious violations.
- Every UI component has a story in the same folder.

## 6. Phases and batches

Each batch is one commit, at most ten files, handed over for the user to review and commit.

### Phase 0 — the app runs

| Batch | Contents | Proves |
| --- | --- | --- |
| 1 | `project.json`, four tsconfigs, `eslint.config.mjs`, `playwright.config.ts`, `public/` | `nx build camila` |
| 2 | `index.html`, `main.ts`, `styles.scss`, `app.config.ts`, `i18n.config.ts`, `theme.config.ts`, `app.{ts,html,scss}`, `app.routes.ts` | shell on the kirigami theme |
| 3 | Diary and tree pages with their stories | two routes render |
| 4 | `app.spec.ts`, `.storybook/`, two journeys | `nx test`, `nx e2e`, `nx test-a11y` |

Ports: **4400** serve, **4401** e2e, **6008** Storybook.

### Phase 1 — the domain, with no UI

| Batch | Contents |
| --- | --- |
| 5 | Domain models, the six domains as data, seeded rules, `Rule` and `TreeState` with specs |
| 6 | Classifier: shipped vocabulary, `predictDomain()`, learn keys, private-rule override, fixture corpus |
| 7 | RxDB schema partitioned by child, repositories, use cases |

The product is fully testable at the end of Phase 1, before a single pixel exists.

### Phase 2 — the parent surface

| Batch | Contents |
| --- | --- |
| 8 | `ibid-textarea` in `ibid-ui`, with story and spec — **scope `ibid-ui`, not `camila`** |
| 9 | Diary composer, wired to the use case |
| 10 | `ibid-chip` extracted from `oh-save-me`'s `active-filter-chips` — **scope `ibid-ui`** |
| 11 | Correction path |

### Phase 3 — the child surface

| Batch | Contents |
| --- | --- |
| 12 | `camila-growth-scene` |
| 13 | Tree route wired to `TreeState`, and the full DSJ journey |

## 7. The one real risk

`camila-growth-scene` is the only piece that cannot be derived from what already exists. It is
the product's whole visual identity, it is bespoke, and it is not specifiable in a table.

It is de-risked by being **data-driven rather than art-driven**: a pure SVG fed by `TreeState`
— one growth level per branch, one branch per domain — so the mechanic is testable and the art
can evolve without touching logic. The first version will be honest and simple, not exhibition
kirigami.

## 8. What is deliberately not decided here

Carried from `PRD.md` §7 and still open: the public name, the language and market choice the ASO
strategy depends on, ads versus lifetime-only, web and desktop monetisation, and the child
surface's age registers. None of them block the MVP.
