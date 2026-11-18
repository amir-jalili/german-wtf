# Architecture — German WTF

## 1. Overview

A **local-first static PWA**. All content ships with the app as validated JSON bundles; all user state lives in IndexedDB on the device. No server is needed to learn. Optional later: an AI tutor called directly from the browser with the user's own key, and a sync backend.

```
content/*.yaml ──(build: validate + compile)──► static/content/<level>.json ─┐
                                                                             ▼
┌──────────────────────── Browser (PWA, offline via service worker) ───────────────────────┐
│  routes/ (SvelteKit pages) ──► lib/ui (components) ──► lib/stores (state, runes)          │
│                                     │                         │                           │
│                                     ▼                         ▼                           │
│                         lib/engine (PURE TS)          lib/db (Dexie / IndexedDB)          │
│              checker · scheduler · session · generators · content types · diagnosis       │
└───────────────────────────────────────────────────────────────────────────────────────────┘
Later: lib/ai (BYOK tutor, optional) · server/ (FastAPI sync API, optional, ADR needed)
```

## 2. Stack (use current stable versions; record them in PROGRESS when set up)

| Concern         | Choice                                                   | Why                                                                |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Language        | TypeScript (strict)                                      | Safety for a long-lived codebase                                   |
| Framework       | SvelteKit + Svelte 5 (runes), `adapter-static`           | Small bundles, fast on phones, simple mental model, static hosting |
| Styling         | Tailwind CSS + CSS variables for theme tokens            | Fast iteration, consistent tokens, dark mode                       |
| PWA             | `@vite-pwa/sveltekit` (Workbox)                          | Installable, precache shell, runtime-cache content                 |
| Storage         | Dexie (IndexedDB)                                        | Versioned schema + migrations, good DX                             |
| Scheduling      | `ts-fsrs`                                                | Modern open SRS algorithm (same family as Anki's FSRS)             |
| Validation      | Zod                                                      | One schema for content build-time checks and runtime types         |
| Content format  | YAML (`yaml` package)                                    | Human-readable, diff-friendly                                      |
| Unit tests      | Vitest                                                   | Fast, TS-native                                                    |
| E2E             | Playwright (iPhone-size + desktop projects)              | Real flows, offline test                                           |
| Lint/format     | ESLint + Prettier + `svelte-check`                       | Standard                                                           |
| Package manager | pnpm                                                     | Fast, strict                                                       |
| CI/CD           | GitHub Actions → GitHub Pages (or Cloudflare Pages; ADR) | Free, simple                                                       |
| Audio           | Web Speech API `speechSynthesis` (de-DE)                 | Offline-capable on most devices, no cost                           |

Changing any of these needs an ADR.

## 3. Folder layout

```
german-wtf/   (local folder may still be called grammatik-gym)
├── CLAUDE.md  README.md  START_HERE.md
├── docs/  (spec, architecture, curriculum, content guide, roadmap, progress, adr/)
├── .claude/commands/  (next, content, bug, review)
├── content/
│   ├── points/<family>/<point-id>.yaml     # one grammar point: lesson + items
│   ├── contrasts/<pair-id>.yaml            # contrast drills
│   ├── lexicon/nouns.yaml verbs.yaml adjectives.yaml   # for generators
│   ├── catalogue.yaml                      # machine version of CURRICULUM.md (ids, level, prereqs, family)
│   ├── SOURCES.md                          # attribution for any open data used
│   └── books/                              # GIT-IGNORED: clone of the private repo german-wtf-books (§8)
├── scripts/
│   ├── content-validate.ts  content-compile.ts  content-lint-de.ts  content-stats.ts
├── src/
│   ├── lib/
│   │   ├── engine/              # PURE: no Svelte/DOM/IDB/fetch imports (enforced by ESLint rule)
│   │   │   ├── content/         # Zod schemas + TS types for points, items, catalogue
│   │   │   ├── checker/         # normalise, match, near-miss, diagnose
│   │   │   ├── scheduler/       # FSRS wrapper, card keys, mastery levels
│   │   │   ├── session/         # daily session builder, interleaving, item picking
│   │   │   ├── generators/      # adjective endings, articles, conjugation, perfect aux …
│   │   │   ├── grammar/         # declension tables, case/gender logic used by generators & X-ray
│   │   │   └── placement/       # adaptive placement test
│   │   ├── db/                  # Dexie schema, migrations, repositories
│   │   ├── stores/              # app state (runes), settings
│   │   ├── ui/                  # components: exercises/, lesson/, map/, charts/, common/
│   │   └── ai/                  # (later) BYOK tutor client
│   ├── routes/                  # /, /session, /map, /point/[id], /mistakes, /stats, /settings, /books
│   └── service-worker / pwa config
├── static/  (icons, manifest assets; compiled content goes to static/content/ at build)
└── tests/  (e2e/ ; unit tests sit next to code as *.test.ts)
```

## 4. Content model (TypeScript view; Zod is the source of truth)

```ts
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type Case = 'nom' | 'akk' | 'dat' | 'gen';
type Gender = 'm' | 'f' | 'n' | 'pl';

interface GrammarPoint {
	id: string; // kebab-case, stable forever, no level in it: 'adj-endings-definite'
	title: { en: string; de: string };
	level: Level;
	family: string; // 'cases' | 'articles' | 'adjectives' | 'verbs-tenses' | 'word-order' | 'connectors' | 'passive' | 'subjunctive' | 'style' | …
	prerequisites: string[]; // point ids
	compareWith: string[]; // confusable point ids (feeds contrast drills)
	lesson: Lesson;
	items: Item[]; // hand-written items
	generators?: GeneratorRef[]; // e.g. { id: 'adj-ending', params: { article: 'definite' } }
	version: number; // bump when lesson meaning changes
}

interface Lesson {
	summary: string; // 1–2 lines, EN
	rule: string; // Markdown, own words, ≤ 250 words
	table?: Table; // optional paradigm table
	examples: Example[]; // 3–5, each with annotations (spans → case/role) for X-ray
	pitfalls: string[]; // common mistakes
}

type Item =
	| ClozeItem
	| ChoiceItem
	| TransformItem
	| OrderItem
	| CombineItem
	| ErrorHuntItem
	| EndingBuilderItem
	| ParadigmItem
	| MatchItem
	| ClassifyItem
	| DictationItem;

interface BaseItem {
	id: string; // '<point-id>/<nnn>' stable
	type: string;
	level: Level;
	skill: 'form' | 'syntax' | 'meaning' | 'style'; // SRS is per point × skill
	prompt?: string; // instruction or EN translation hint
	explanation: string; // the rule applied here, 1–2 lines
	errorTags: ErrorTag[]; // what a wrong answer most likely means
	distractorNotes?: Record<string, string>; // wrong answer → specific feedback
	audio?: boolean; // default true
	review: { status: 'draft' | 'verified' | 'flagged'; by: string; date: string; note?: string };
	source: 'original' | 'generated' | 'tatoeba:<id>' | 'book-variant' | 'book-exact';
	origin?: {
		book: string;
		chapter: string;
		exercise?: string;
		mode: 'variant' | 'exact' | 'remix';
	}; // book items only
}
// Concrete item shapes and YAML examples: CONTENT_GUIDE.md
```

**Error tags** (closed list, extend via ADR): `case`, `gender`, `number`, `article-form`, `adj-ending`, `noun-ending` (n-Deklination, Dativ-Plural -n, Genitiv -s), `pronoun-form`, `verb-conjugation`, `verb-stem`, `tense-choice`, `aux-haben-sein`, `participle`, `separable-prefix`, `v2-position`, `verb-final`, `verb-cluster` (Ersatzinfinitiv, Satzklammer), `mittelfeld-order`, `preposition-choice`, `preposition-case`, `connector-choice`, `reflexive`, `mood` (Konjunktiv), `voice` (Passiv), `register`, `spelling`, `capitalisation`, `punctuation`.

## 5. Engine design

### 5.1 Checker (`engine/checker`)

Pipeline: `normalise(answer)` → exact match against normalised accepted answers → if none: **near-miss** check (capitalisation only; umlaut written as `ae/oe/ue` or missing; ß/ss; one internal typo in a word of ≥ 6 letters whose first and last letters are right and that isn't itself a different listed form — endings and short words are never "typos", because that is where the grammar lives) → if none: **diagnose**: look up `distractorNotes`; else compare token by token with the closest accepted answer and infer the tag (same lemma different ending → `adj-ending`/`article-form`/`verb-conjugation` by POS from the item metadata; same tokens different order → word-order tag; different preposition → `preposition-choice`). Returns:

```ts
type CheckResult =
	| { verdict: 'correct'; matched: string }
	| { verdict: 'near-miss'; matched: string; hint: string }
	| { verdict: 'wrong'; expected: string; diff: Span[]; tags: ErrorTag[]; feedback: string };
```

Exhaustively unit-tested with a table of (item, answer, expected result) cases, including German edge cases.

### 5.2 Scheduler (`engine/scheduler`)

- **Card** = `pointId × skill` (e.g. `adj-endings-definite:form`). A review picks an item of that point/skill not seen in the last N reviews, prefers types the user is weaker on.
- **Mistake card** = `pointId × errorTag`, created on the first wrong answer with that tag, scheduled with FSRS from then on; resolved (archived) after 3 consecutive correct reviews with stability ≥ 21 days.
- **Built (P2.1, ADR 0007):** `ts-fsrs` 6 with the FSRS-7 model, assembled synchronously (`fsrs.ts`), library-default learning steps, fuzz off; the FSRS `cardId` is the card key. `card-key.ts`, `rating.ts`, `mastery.ts`, `retention.ts` (kept free of ts-fsrs so Settings can import it).
- FSRS rating from the result (`gradeFromAnswer`): wrong → Again; near-miss or "I guessed" → Hard; correct → Good; correct and fast (< 40 % of the item's median time, needs ≥ 3 earlier timings) → Easy. Target retention 0.9 (setting `targetRetention`, clamped 0.70–0.97).
- **Mastery levels** per point (from stability): New → Learning (<3 d) → Familiar (<21 d) → Strong (<90 d) → Mastered (≥90 d).
- Leech: ≥ 6 lapses → flag, suggest the lesson, show the scaffolded version for the next 3 reviews; flag again every 3 further lapses.
- **Built (P2.2):** `cards.ts` — `PointCard` / `MistakeCard` (key `mistake:pointId:errorTag`) and pure transitions `reviewPointCard`, `recordMistake` (create, re-open or review Again; history is kept), `reviewMistakeCard` (streak counts every non-Again review, near-misses included), `needsScaffold`. Each returns `events` (`becameLeech`, `resolved`) for the UI and the fun system.

### 5.3 Session builder (`engine/session`)

Input: due cards, mistake cards, settings, time budget, today's new-point quota, optional focus (book chapter / point / contrast). Output: an ordered item list. Rules: due first (oldest overdue first, capped so a session fits the time budget; overflow stays due), then mistake cards, then new points (prerequisites met, catalogue order); interleave so no two consecutive items share a point unless it's a lesson block; contrast items paired.

**Built (P2.8):** Settings — session (minutes, new/day, typed vs choice via `engine/content/present.ts`, retention → `rebuildAllCards`, streak), look and sound (UI language EN/DE via `src/lib/i18n/messages-de.ts`, typed against the English keys; theme mirrored to localStorage for a flash-free start; TTS voice + rate through `setSpeechPrefs`), backup import. The settings store keeps values changed while it is still loading.

**Built (P2.7):** `session/stats.ts` — `heatmap` (12 weeks, Monday-first, local days), `streak` (counts from yesterday if today isn't done), `accuracyByFamily` (near-misses count as correct), `masteryByLevel`, `forecast` (7 days, overdue on today), `weakest` (lowest current recall per point). Setting `showStreak` (toggle on Stats). The session summary sets `data-ready` once every answer is stored.

**Built (P2.6):** `session/map.ts` — `buildMap` (per point: ready, mastery = weakest skill, due = due cards + due open mistakes, prerequisites with content not yet started) and `matchesSearch` (all query words in de/en title, id or family; case, umlaut and ß folded). Page `/map`: levels as `<details>` (open when they have ready points or while searching), families inside.

**Built (P2.5):** `session/progress.ts` compares card snapshots before/after a session (came back, level-ups, resolved mistakes, new leeches → fun triggers). App glue in `src/lib/srs/daily.ts` (`prepareToday`, `recordStepAnswer`, plan hand-off Today → `/session`); storage helpers in `src/lib/db/srs.ts`. Settings `dailyMinutes` (15) and `newPerDay` (1).

**Built (P2.4):** `session/daily.ts` — `buildDailySession(input)` returns `{ steps, overflow, counts, minutes }`. Capacity = minutes × 60 / seconds-per-item (default 30 s). Each due card gets one fresh item of its point/skill (`pickFreshItem`: not among the last 20 answered if avoidable, else least recently seen); each due open mistake card gets an item of its point whose `errorTags` include the tag; each new point gets a block of 3 items. Prerequisites without content don't block; one with content is met once its card has been reviewed. `interleave` spreads reviews greedily by point and puts new-point blocks at the end. Leech cards' steps carry `scaffold: true`. Property-style tests over 200 random inputs (budget, no repeated item, allowed neighbours, quota). Contrast pairing waits for contrast content (P5.5).

### 5.4 Generators (`engine/generators`)

Pure functions `(lexicon, params, rng) → Item[]` for closed paradigms: definite/indefinite/possessive/kein article forms by case & gender; adjective endings (weak/mixed/strong); personal & reflexive pronouns; present/Präteritum/Perfekt forms incl. haben/sein; Konjunktiv II forms; n-Deklination; comparative/superlative. Correct by construction from `engine/grammar` tables, which are themselves tested against hand-checked fixtures. Generated items carry `source: 'generated'` and `review.status: 'verified'` only when the generator has tests covering that paradigm.

### 5.5 X-ray annotations

Examples (and optionally items) carry spans: `{ text, role: 'subj'|'akk-obj'|'dat-obj'|'gen-attr'|'prep-obj'|'verb'|'verb-part'|'pred', case?, gender?, note? }` where `text` is the exact words of the span (first occurrence in the sentence) — easier to write by hand than character offsets; the validator checks that the text occurs. The UI colours them; tapping a word shows its role and case. Written by hand in content; generators emit them automatically.

## 6. Storage (Dexie)

Tables — **v1 (built, `src/lib/db/schema.ts`)**: `reviewLog` (append-only: itemId, pointId, cardKey `pointId:skill`, verdict, answer, ms, timestamp, mode), `settings` (key/value), `meta` (key/value, e.g. `createdAt`). **v2 (built, P1.12)**: `funSeen` (fun-system history: funId, event, timestamp). Settings keys so far: `catChaos` (`off`/`some`/`maximum`), `targetRetention` (number), `dailyMinutes`, `newPerDay`, `showStreak`. **v3 (built, P2.3)**: `cards` (`PointCard`: key `pointId:skill`, pointId, skill, ts-fsrs state incl. `dueAt` Date, optional leech state; indexes `pointId`, `fsrs.dueAt`) and `mistakeCards` (`MistakeCard`, key `mistake:pointId:errorTag`; indexes `pointId`, `errorTag`, `fsrs.dueAt`); `reviewLog` entries gain optional `errorTags` on wrong answers. The v3 upgrade **replays the existing review log** into point cards (`replayAnswers`: answers to one card within 30 min are one review, graded by `gradeForSitting`), so Phase 1 practice counts; mistake cards start empty because v1/v2 never stored tags. Backups: `BackupV3Schema` coerces ISO dates back to `Date`; v1/v2 backups upgrade through the same replay. **v4 (built, P2.9b)**: `bookPacks` (`StoredBook`, key `slug`: the packed book with its chapters and items, plus `packHash`, `packCreatedAt`, `importedAt`); `reviewLog.mode` gains `chapter`. `BackupV4Schema` includes the books; importing a pre-v4 backup keeps the books already on the device. **Planned**, each in its own new Dexie version with a migration test (`src/lib/db/migration.test.ts`): `selfStudy`, `bookmarks`. The IndexedDB name stays `grammatik-gym` forever (ADR 0006). Public content is **not** stored in IDB (only imported book packs are); it's fetched from `/content/<level>.json` and cached by the service worker. Export/import = JSON of all tables + versions (`src/lib/db/backup.ts`, Zod-validated; import in `src/lib/db/import.ts`: validate → confirm in the UI → replace every table in one transaction → rebuild cards from the imported log; one fixture per version in `tests/fixtures/backup-vN.json`).

## 7. Build & deploy

- `content:compile` runs before `vite build`: validates all YAML, expands generators where pre-generation is cheaper, writes `static/content/<level>.json` + `catalogue.json` with a content hash.
- GitHub Actions: on PR/push run `pnpm verify` and Playwright; on `main` deploy to GitHub Pages (base path configured). Cache-busting via content hash; the service worker updates in the background and shows "New version — reload".

## 8. Book packs (AJ's books, private)

- `content/books/` is git-ignored in this repo and holds a clone of a **private** repo `german-wtf-books`: `books/<book-slug>/book.yaml` (title, chapters → point ids) and `books/<book-slug>/<chapter>.yaml` (items, same schema plus `origin`). Optional page photos in `books/<book-slug>/scans/` (private repo only).
- `pnpm books:validate` runs the normal content gates on it. `pnpm books:pack` writes `private-dist/book-pack-<date>.json` (git-ignored; never in `static/`, never deployed). A CI test fails the public build if any item with `origin` or a `book-*` source reaches `static/content/`.
- App: Settings → _Import book pack_ (file picker; on iPhone from Files/iCloud Drive/AirDrop) → stored in IndexedDB `bookPacks`; re-import replaces by pack version, progress is keyed by item id so it survives. Book items join the session builder like any item; the Map gets a _My books_ tab (book → chapter → mastery); Today offers "Practise chapter X".
- Built (P2.9a): format and rules in CONTENT_GUIDE §1; engine schemas in `src/lib/engine/content/books.ts` (item ids `<point>/<book-slug>.<nnn>`, so they can never collide with public ids); reading, validation and packing in `scripts/lib/books.ts`; `pnpm books:guard` (`scripts/books-guard.ts`) runs after the build inside `pnpm verify` — so in CI and before every deploy — and fails on any object with `origin`, a book source or id, or a pack file in `static/content/` or `build/`.
- Built (P2.9b): `src/lib/db/books.ts` (import = validate, then `bulkPut` by slug; remove keeps answers); `src/lib/content/books.ts` merges imported books (and in `pnpm dev` the pack that `books:pack --dev` writes to `private-dist/dev-book-pack.json`, served at `/__dev/book-pack.json` by a serve-only Vite plugin) into `loadServableItems` and point practice. Settings → _My books_ is `src/lib/ui/books/BookPacks.svelte`.
- Built (P2.9c): `src/lib/engine/session/books.ts` (`chapterProgress`, `nextChapter`, `buildChapterSession` → steps with source `chapter`, logged with mode `chapter`); `chapterPlan`/`handOffChapter` in `src/lib/srs/daily.ts` hand the steps to `/session`; `src/lib/ui/books/ChapterList.svelte` on the Map.
- `pnpm dev` also loads `content/books/` directly, so AJ can test new book items on the laptop without importing.

## 9. Future seams (don't build yet)

- `lib/ai`: one interface `Tutor { explain(item, answer); feedback(text, pointIds); generate(pointId, n) }` with an Anthropic implementation (BYOK, browser-direct). Output of `generate` goes to a local review queue only.
- `server/` (FastAPI + Postgres): sync of `cards`, `mistakeCards`, `reviewLog` with last-write-wins per card and append-only logs. Requires ADR.
