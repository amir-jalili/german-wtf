# Architecture — Grammatik Gym

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
grammatik-gym/
├── CLAUDE.md  README.md  START_HERE.md
├── docs/  (spec, architecture, curriculum, content guide, roadmap, progress, adr/)
├── .claude/commands/  (next, content, bug, review)
├── content/
│   ├── points/<family>/<point-id>.yaml     # one grammar point: lesson + items
│   ├── contrasts/<pair-id>.yaml            # contrast drills
│   ├── lexicon/nouns.yaml verbs.yaml adjectives.yaml   # for generators
│   ├── catalogue.yaml                      # machine version of CURRICULUM.md (ids, level, prereqs, family)
│   ├── SOURCES.md                          # attribution for any open data used
│   └── books/                              # GIT-IGNORED: clone of the private repo grammatik-gym-books (§8)
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
- FSRS rating from the result: wrong → Again; near-miss or "I guessed" → Hard; correct → Good; correct and fast (< 40 % of the item's median time) → Easy. Target retention 0.9 (setting).
- **Mastery levels** per point (from stability): New → Learning (<3 d) → Familiar (<21 d) → Strong (<90 d) → Mastered (≥90 d).
- Leech: ≥ 6 lapses → flag, suggest the lesson, show the scaffolded version for the next 3 reviews.

### 5.3 Session builder (`engine/session`)

Input: due cards, mistake cards, settings, time budget, today's new-point quota, optional focus (book chapter / point / contrast). Output: an ordered item list. Rules: due first (oldest overdue first, capped so a session fits the time budget; overflow stays due), then mistake cards, then new points (prerequisites met, catalogue order); interleave so no two consecutive items share a point unless it's a lesson block; contrast items paired.

### 5.4 Generators (`engine/generators`)

Pure functions `(lexicon, params, rng) → Item[]` for closed paradigms: definite/indefinite/possessive/kein article forms by case & gender; adjective endings (weak/mixed/strong); personal & reflexive pronouns; present/Präteritum/Perfekt forms incl. haben/sein; Konjunktiv II forms; n-Deklination; comparative/superlative. Correct by construction from `engine/grammar` tables, which are themselves tested against hand-checked fixtures. Generated items carry `source: 'generated'` and `review.status: 'verified'` only when the generator has tests covering that paradigm.

### 5.5 X-ray annotations

Examples (and optionally items) carry spans: `{ text, role: 'subj'|'akk-obj'|'dat-obj'|'gen-attr'|'prep-obj'|'verb'|'verb-part'|'pred', case?, gender?, note? }` where `text` is the exact words of the span (first occurrence in the sentence) — easier to write by hand than character offsets; the validator checks that the text occurs. The UI colours them; tapping a word shows its role and case. Written by hand in content; generators emit them automatically.

## 6. Storage (Dexie)

Tables — **v1 (built, `src/lib/db/schema.ts`)**: `reviewLog` (append-only: itemId, pointId, cardKey `pointId:skill`, verdict, answer, ms, timestamp, mode), `settings` (key/value), `meta` (key/value, e.g. `createdAt`). **Planned**, each in its own new Dexie version with a migration test: `cards` (key, pointId, skill, fsrs state, mastery) and `mistakeCards` (v2, P2.3), `funSeen` (fun-system history, THEME_AND_FUN §2), `bookPacks` (P2.9), `selfStudy`, `bookmarks`. Content is **not** stored in IDB; it's fetched from `/content/<level>.json` and cached by the service worker. Export/import = JSON of all tables + versions (`src/lib/db/backup.ts`, Zod-validated; one fixture per version in `tests/fixtures/backup-vN.json`).

## 7. Build & deploy

- `content:compile` runs before `vite build`: validates all YAML, expands generators where pre-generation is cheaper, writes `static/content/<level>.json` + `catalogue.json` with a content hash.
- GitHub Actions: on PR/push run `pnpm verify` and Playwright; on `main` deploy to GitHub Pages (base path configured). Cache-busting via content hash; the service worker updates in the background and shows "New version — reload".

## 8. Book packs (AJ's books, private)

- `content/books/` is git-ignored in this repo and holds a clone of a **private** repo `grammatik-gym-books`: `books/<book-slug>/book.yaml` (title, chapters → point ids) and `books/<book-slug>/<chapter>.yaml` (items, same schema plus `origin`). Optional page photos in `books/<book-slug>/scans/` (private repo only).
- `pnpm books:validate` runs the normal content gates on it. `pnpm books:pack` writes `private-dist/book-pack-<date>.json` (git-ignored; never in `static/`, never deployed). A CI test fails the public build if any item with `origin` or a `book-*` source reaches `static/content/`.
- App: Settings → _Import book pack_ (file picker; on iPhone from Files/iCloud Drive/AirDrop) → stored in IndexedDB `bookPacks`; re-import replaces by pack version, progress is keyed by item id so it survives. Book items join the session builder like any item; the Map gets a _My books_ tab (book → chapter → mastery); Today offers "Practise chapter X".
- `pnpm dev` also loads `content/books/` directly, so AJ can test new book items on the laptop without importing.

## 9. Future seams (don't build yet)

- `lib/ai`: one interface `Tutor { explain(item, answer); feedback(text, pointIds); generate(pointId, n) }` with an Anthropic implementation (BYOK, browser-direct). Output of `generate` goes to a local review queue only.
- `server/` (FastAPI + Postgres): sync of `cards`, `mistakeCards`, `reviewLog` with last-write-wins per card and append-only logs. Requires ADR.
