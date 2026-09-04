# 📄 Product Requirement Document (PRD)

**Product Name:** Camila *(working name — see §6)*
**Version:** 0.1.0 (pre-MVP)
**Target Platforms:** Mobile web today; Android and iOS through Capacitor when the loop is proven
**Core Tech Stack:** Angular 22, RxDB, `ibid-ui` with the Kirigami theme, CSS 3D

---

## 1. Executive Summary & Mission: The Paper Reward That Gets Built

### 1.1. Product Mission
**Camila** is a family reward system whose prize is a real object. Chore apps hand a child a
number that goes up; Camila hands them a **paper figure that unfolds as they earn it**, on screen
in three dimensions, and finally as a printable template they cut out and build with a parent.
The points stop being an abstraction the moment the dinosaur stands on the shelf.

The adult side is deliberately the opposite of a form. The parent **writes one ordinary sentence**
— *"Tidied up his toys and gave his brother a hug"* — and an **on-device assistant** reads it,
proposes which behaviour domains it touched and how many points each is worth, and asks for a
confirmation. Nothing is categorised by hand unless the parent wants to correct it.

### 1.2. Who Pays, and How
Camila has no server, so it has no server bill. That makes two things possible that a
subscription product cannot offer: the app is free to use, and the adult can **unlock more
figures by watching a rewarded ad on their own screen**. Advertising is a parent-side
transaction — the child's surface is never touched by it — and it is what pays for the
catalogue instead of a monthly fee.

### 1.3. Target User & Persona ("Nobody Fills In Forms at 22:30")
Camila is for a parent who is tired. Chip pickers and category dropdowns feel frictionless to a
designer and feel like paperwork to a parent at the end of a long day. Every feature must pass
this test: *does it ask the adult to think, structure or choose before it accepts what happened?*
If it does, the assistant has to absorb that work.

The child is the **viewer**, not the operator. They open the app to see how far the figure has
unfolded, not to manage anything.

### 1.4. Two Faces, One Device
The child's screen is the entry point. A **"Grown-ups!"** paper tab in the top-right corner crosses
into the adult side. The boundary is a privilege change, not a feature switch: the child sees
their standing, never the diary. Biometrics or a PIN guard that crossing *(not implemented yet,
see §5)*.

### 1.5. How the Assistant Learns (In Plain Language)
Camila runs a lightweight classifier that lives entirely inside the device.

* **In simple terms:** the assistant ships knowing a few hundred ordinary Portuguese words —
  *dishes*, *teeth*, *hug*, *patience* — and which part of family life each one belongs to.
  When the parent corrects a reading, it privately remembers the words of that sentence and,
  from then on, that household's own vocabulary outranks the one it was born with.
* **Private and instant:** the diary text is never sent anywhere to be read. There is no external
  service, no upload, no server of ours anywhere in the path. It works offline, immediately, at zero cost.
  Where the diary does travel — between the adults of a household — it travels through their own
  Google Drive and nowhere else (see §1.6).
* **It reads clauses, not keywords:** *"didn't brush his teeth"* earns nothing, while *"lavou os
  dentes sem eu pedir"* earns the full amount — negation is scoped to its own clause.

### 1.6. One Device, Two Screens — and Where Data Lives

**The child has no device.** They look at the adult's phone. That is the whole reason the child's
screen is the entry point and the adult's side sits behind a tab: you open the app, hand the phone
over, and take it back. There is no child install, no child account, no child login.

So the boundary that matters is between **screens**, not devices:

* The **child's screen** shows the figure, its folds and its progress. Nothing else is reachable
  from it.
* The **adult's screen**, behind the **"Grown-ups!"** tab, holds the diary, the readings and the
  settings.

The most sensitive thing the app can hold is a **photograph of a child**, and the product wants
one: each child gets a widget carrying their own face, so the app is visibly about *them* rather
than about a category. That photo is treated as the hardest case in the whole system — see §4.9.

Around that, two facts about data:

1. **We operate no server.** No Camila account, no backend, no database. We never receive, store
   or process a word of a family's diary.
2. **Synchronisation is adult-to-adult only** — two parents, two phones, one household file in
   **their own Google Drive**, so each sees what the other wrote. It is their file, in their
   storage, under their Google account.

Advertising sits on the adult's screen, behind the tab. Because there is only one device, this is
a rule about **what is rendered where**, not about which binary is installed — worth knowing
before anyone writes a stronger claim than that.

---

## 2. Strategic Differentiators

1. **The prize is a physical object.** Points unfold a paper figure on screen and end as a
   printable template the family builds together. No competitor in the chore-app category ends
   in something the child can hold.
2. **One sentence in, several domains out.** The assistant reads free text and proposes multiple
   behaviour domains with points each, for a single confirmation — instead of asking the parent
   to pick a category, then a child, then a value.
3. **No server of ours (Local-First).** Every rule runs on the device, and what a family shares
   between its own adults travels through their own Google Drive. We operate no backend, so
   there is nothing for us to lose, sell or be compelled to hand over *(see §1.6)*.
4. **Free because it costs us nothing to run.** With no infrastructure to pay for, the catalogue
   is unlocked by a rewarded ad on the adult's screen rather than by a subscription — against a
   category whose loudest complaint, by volume of one-star reviews, is billing and cancellation.
5. **Positive only.** Thresholds carry one sign. The figure grows or rests; it never shrinks.
   A tree that grows more slowly is indistinguishable from one that had fewer entries, which is
   why the negative side was dropped rather than hidden.
6. **A design that is the product.** Cut paper, folded surfaces and a single display serif — the
   Kirigami theme is not decoration on a chore tracker, it is what makes a child want to look.

---

## 3. System Architecture & Tech Stack

| Layer | Technology | Function / Description |
| :--- | :--- | :--- |
| **Frontend Core** | Angular 22 (SPA), signals | Reactive UI and state, zoneless-friendly. |
| **UI Design System** | `libs/ibid-ui` + Kirigami theme | Cut-paper surfaces, hand-drawn contours, `ibid-*` atoms. No third-party kit. |
| **Local Database** | RxDB (Dexie in the browser, memory in tests) | Offline-first document store. Nothing reaches IndexedDB outside `infrastructure/rxdb/`. |
| **On-Device Assistant** | Pure TypeScript in `domain/` | Two layers of word matching: a shipped Portuguese vocabulary plus privately learned rules that always win. No external service. |
| **3D Figure** | CSS 3D transforms | Extruded paper profiles and box nets rendered with `clip-path` faces and contour bands. **No 3D library.** |
| **Printable Template** | Inline SVG, A4 `viewBox` | Two variants from one geometry: coloured and line-art. |
| **Household Sync** | `@ibid/services` → Google Drive REST API | One household file in the inviting adult's Drive, shared with the co-parent's Google account. Already built for `oh-save-me`. **Not wired into Camila yet, see §5.** |
| **Rewarded Advertising** | Certified ad SDK, adult surface only | Unlocks catalogue figures. Loaded lazily on the adult's screen, behind an age gate. Never rendered while the child's screen is showing. **Not implemented, see §5.** |
| **Consent** | CMP (TCF v2.2 in the EEA and UK) | Required before any personalised ad request. **Not implemented, see §5.** |
| **Mobile Wrapper** | Capacitor | **Not started.** Needed for biometrics, notifications and the ad SDK, see §5. |

---

## 4. Functional Requirements — User Stories

### 4.1. Seeing the Figure (Child)
* **FR-01:** As a child, the app opens straight onto my paper figure in three dimensions, with no
  login and nothing to read first.
* **FR-02:** As a child, I can drag the figure to turn it, and use three paper keys to turn it or
  put it back the way it started.
* **FR-03:** As a child, I can tap **See the template** to see the template the figure is cut from.
* **FR-04:** As a child, I can flip between the coloured template and one I can colour in myself.
* **FR-05:** As a child, the figure never shames me: with nothing recorded it simply rests, and no
  screen tells me nothing was written about me. *(Behaviour carried over; the resting state
  currently belongs to the folded-figure view, see §5.)*

### 4.2. Writing the Diary (Adult)
* **FR-06:** As a parent, I write what happened in my own words, in one box, and nothing else is
  required of me.
* **FR-07:** As a parent, a single word is a complete entry — the app never tells me it is too
  short and never shows a validation error on a diary.
* **FR-08:** As a parent, when I save, the assistant tells me how it read the sentence — which
  domains and how many points each — and I confirm with one tap.
* **FR-09:** As a parent, I can overrule that reading with chips before confirming, and only then
  does the assistant learn from it.
* **FR-10:** As a parent, I can dismiss a reading entirely and leave the entry unassigned.
* **FR-11:** As a parent, an entry the assistant could not read is kept, never discarded and never
  guessed at loudly.

### 4.3. Points, Thresholds and Folds
* **FR-12:** As a parent, points accumulate per behaviour domain: Behaviour, Chores, School,
  Talking and Family.
* **FR-13:** As a parent, crossing a threshold earns a fold; badge identity is deterministic, so
  the same fold is never earned twice.
* **FR-14:** As a parent, correcting an old entry recomputes the whole figure from scratch, and a
  fold that was already earned keeps its original date.

### 4.4. Crossing to the Adult Side
* **FR-15:** As a parent, a **"Grown-ups!"** paper tab takes me from the child's screen to the diary.
* **FR-16:** As a parent, that crossing is protected by biometrics with a PIN fallback.
  **Not implemented — the tab is currently open, see §5.**
* **FR-17:** As a child, I can never reach the diary, the teacher notes or an unassigned entry.

### 4.5. Unlocking Figures with a Rewarded Ad
* **FR-A1:** As a parent, I can unlock another figure for the catalogue by watching a rewarded ad,
  without paying anything.
* **FR-A2:** As a parent, an ad is never shown to me without my having crossed into the adult side
  first — advertising exists only behind the **"Grown-ups!"** tab.
* **FR-A3:** As a child, no advertisement of any kind is ever rendered on my screen or on my
  device. The ad SDK is absent from the child build, not merely suppressed in it.
* **FR-A4:** As a user in the EEA or the UK, I am asked for consent through a certified CMP before
  any personalised ad request, and I can refuse and still use every feature that does not depend
  on unlocking a new figure.
* **FR-A5:** As a parent, refusing consent gives me non-personalised advertising rather than no
  app — the rewarded unlock keeps working.
* **FR-A6:** As a parent, an unlock I earned is mine permanently and never has to be re-earned.

### 4.6. Sharing a Household Between Two Adults
* **FR-S1:** As a parent, I can invite the other parent to the household by email, and from then
  on we both see the same diary, the same points and the same folds.
* **FR-S2:** As a parent, the household file lives in **my own Google Drive**, under my Google
  account, and is shared with the co-parent's Google account. It never passes through a server
  belonging to the product.
* **FR-S3:** As a parent, when the other parent writes an entry or confirms a reading, I see the
  change the next time my device syncs.
* **FR-S4:** As a parent, when both of us change something while offline, the conflict is resolved
  without either of us losing an entry.
* **FR-S5:** As a parent, I can revoke the other adult's access, and doing so removes their
  ability to read anything further.
* **FR-S6:** As a child, I have no device and no account — I look at the adult's phone, and the
  child's screen is all I can reach from it.

### 4.9. A Face for Each Child
* **FR-P1:** As a parent, I can add a photograph of my child from my own phone, and from then on
  that child's widget carries their face.
* **FR-P2:** As a parent, each child in the household has their own widget with their own photo,
  so the app is about them by name and by face rather than about a generic profile.
* **FR-P3:** As a parent, the widget is available on my phone's home screen, so I see my child's
  face and their progress without opening the app.
* **FR-P4:** As a parent, the photograph **never leaves the device I added it on**. It is not in
  the Drive payload, it is not in a backup we control, and it never reaches a server — because
  there is none.
* **FR-P5:** As a parent, if my co-parent wants the same widget on their phone, they add their
  own photo. A child's face is the one thing this product deliberately refuses to transmit, even
  between two parents.
* **FR-P6:** As a parent, the app **only ever displays** the photograph. It is never analysed,
  never matched, never used to recognise anyone, and no derived data is computed from it.
* **FR-P7:** As a parent, I can replace or delete the photo at any moment, and deleting it removes
  it from the device rather than hiding it.

### 4.7. Language and Access
* **FR-18:** As a user, the app speaks European Portuguese by default and English as a second
  language, and never shows a literal product name written into a template.
* **FR-19:** As a user of assistive technology, every figure and template carries a text
  equivalent, and decorative shapes inside labelled controls are hidden rather than announced
  unnamed.
* **FR-20:** As a user, the child's screen fits the viewport without scrolling.

### 4.8. Keeping Data Private
* **FR-21:** As a user, no diary text, no learned vocabulary and no correction is ever sent to a
  server operated by this product, because none exists.
* **FR-22:** As a parent, everything my household shares travels through **our own Google Drive**
  and is stored under our own Google account. **Not implemented, see §5.**
* **FR-23:** As a parent, the assistant scores events, never traits — *"helped with dinner"*, not
  *"is helpful"* — so nothing the app derives amounts to a profile of my child.
* **FR-24:** As a parent, advertising is only ever rendered on the adult's screen, behind the
  **"Grown-ups!"** tab, and never while my child is looking at their own screen.
* **FR-25:** As a user, the app's privacy copy states exactly this boundary and never claims that
  nothing leaves the device, which would be untrue.

---

## 5. Roadmap & Ideas

**Next, in order:**

1. **The template generator.** A small companion app where a figure is described and previewed,
   producing the SVG net and the matching 3D data from **one source of truth**. Today the 3D
   figure and the printable template are two hand-authored geometries, and keeping them in step
   by hand is the thing that will rot first.
2. **Folds tied to the figure.** The figure currently stands complete. It should assemble part by
   part as thresholds are crossed — which is what turns the points into suspense.
3. **Biometrics and PIN** on the "Grown-ups!" crossing, which needs Capacitor.
4. **The parent dashboard**: a mosaic of actionable cards — a parents' meeting inside seven days,
   entries waiting to be read — and a footer dock for new entry, points, calendar and settings.
   Cards must be **results, never settings**.
5. **Household sharing.** One document in the inviting adult's Drive, shared with the co-parent's
   Google account, carrying diary, points and folds. Reuses `GoogleDriveSyncService` and
   `ConflictResolverService`.
6. **Rewarded advertising**, with everything §4.5 and §6.2 require: a certified SDK, an age gate,
   a CMP, adult surface only, and a child build with no ad code in it.
7. **A face for each child.** A local photograph and a per-child widget, including a home-screen
   widget. Requires native work: WidgetKit on iOS and an app widget provider on Android, both
   through Capacitor.
8. **Notifications** for the daily ritual. The 2019 predecessor died partly for lack of them.

**Ideas, not commitments:**

* **Visual arithmetic.** The points are already summed; showing the sum as paper strips would
  teach simple addition and give the child a reason to look at the adult's side.
* **A figure from the child's own drawing.** Photograph it, and the generator turns it into a
  cut-and-fold net. Stronger than any licensed character, and legally ours.

**Deliberately not on the roadmap:**

* **Licensed characters.** Distributing or generating a figure of a copyrighted character is
  infringement, and it is what gets an app pulled. The route to a beloved character is the
  child's own drawing.
* **Money.** No allowance, no card, no real currency — that is PSD2 territory and a different
  product.
* **School system integration.** INOVAR and SIGE are closed. Teacher notes are parent-entered by
  design, not by limitation.
* **A negative side.** See §2.4.

---

## 6. Compliance Obligations That Follow From Advertising and Sharing

These are requirements, not preferences. Each is a gate, and identifying them is not the same as
clearing them — **every item below needs a lawyer's confirmation before release.**

### 6.1. The Drive constraint that shapes the design
Google Drive's `appDataFolder` is a hidden, per-user, per-application folder — and files inside it
**cannot be shared with another account**. Hidden and shared are mutually exclusive. Two designs
follow from that, and the product must pick one:

* **Shared household folder** *(recommended)*: a normal folder in the inviting adult's Drive,
  shared by email with the co-parent. Visible to both of them in their own Drive, invisible to
  everyone else, never on our infrastructure. This is the only option that actually supports two
  parents.
* **Hidden per-adult folder**: `appDataFolder`, invisible even to its owner — but then each adult
  has an island, and nothing is shared. Suitable only for a single-parent household.

### 6.2. Advertising
* **Apple's Kids Category forbids third-party advertising and third-party analytics.** A rewarded
  ad model is therefore incompatible with it. Camila ships as a **parenting tool for adults**,
  which is what it is: the adult is the operator, the buyer and the only person the ad is shown to.
* **Google Play Families Policy** applies wherever a child is part of the audience. Expect a
  mixed-audience classification, which requires a **certified ad SDK**, age-appropriate ad
  content, and an **age screen before any advertising surface**.
* **EEA and UK**: personalised advertising requires consent gathered through a certified CMP
  (TCF v2.2 for Google's stack). Refusal must leave the app usable, with non-personalised ads.
* **Advertising is never rendered while the child's screen is showing.** Since there is one
  device, this is enforced by the screen boundary rather than by which binary is installed.
* **The privacy copy must be exact.** *"Nothing ever leaves the device"* is no longer true and
  must not be written anywhere. §1.6 is the claim to make.

### 6.3. The child's photograph
* It is **personal data of a minor** and the most sensitive item in the system. It stays on the
  device it was added on, is never synchronised, and never reaches a server.
* The app **displays it and nothing more**. No facial detection, no matching, no derived features
  — which keeps it clear of biometric processing under GDPR Article 9, a threshold that applies
  the moment an image is processed *for the purpose of uniquely identifying* someone.
* A home-screen widget renders outside the app's own guard. Whatever the widget shows is visible
  to anyone holding the phone, so it carries the face and the progress — never a diary line.
* Deletion must actually delete.

### 6.4. Children's data
* GDPR and parental consent apply. The Portuguese digital consent age is 13 (Portuguese Law 58/2019,
  art. 16); national law diverges within the EU.
* The assistant **scores events, never traits**. A trait is a profile of a minor, which is a
  different legal object under EU Regulation 2024/1689.
* No clinical claim, and no medical, legal or financial advice.
* EAA accessibility obligations apply to consumer digital products since June 2025.

---

## 7. Open Decisions

1. **The public name.** `camila` is the folder and the working name. It is a real person's name;
   shipping under it is not a default.
2. **Route to market.** Market research points away from a PT-PT consumer launch: the whole
   category on the Portuguese App Store totals roughly 22 ratings, and ClassDojo already owns the
   school relationship with 50 M+ installs and native pt-PT. The candidate that survives scrutiny
   is B2B2C through clinicians. This decision changes onboarding, multi-tenancy urgency and the
   entire copy register.
3. **Construction grammar.** Two are implemented: extruded silhouette (one mirrored profile plus
   a contour band — simpler to fold) and box nets (prisms with tabs — trivially generatable, and
   the net *is* the 3D model). The generator should commit to one.
4. **Is printing the ending, or is the screen enough?** If printing is required, the product
   depends on a printer and cardstock being to hand. Staged unlocking softens this: print once,
   at the end, when there is a reason.
5. **Does a paid unlock sit beside the rewarded ad?** A one-off purchase that unlocks the whole
   catalogue and removes advertising is the honest companion to a rewarded ad — two paths to the
   same content. A third path, or separately priced figures, would read as double-dipping in a
   category whose loudest complaint is billing.
6. **What does a shared household look like when the adults separate?** Revocation is in §4.5,
   but who keeps the file, and what the other adult is left with, is a product decision with real
   consequences for real families.
7. **Does the photograph really never sync?** The recommendation is no — each parent adds their
   own, which costs one action and removes the single most sensitive item from the payload
   entirely. Syncing it would be more convenient and materially worse.
8. **Does the co-parent see the diary in full, or only the confirmed readings?** Full sharing is
   simpler and matches how the feature was asked for; partial sharing would protect an adult who
   writes candidly. This should be decided deliberately rather than by default.
