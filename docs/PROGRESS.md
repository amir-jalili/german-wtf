# Progress — handoff log

Newest entry on top. Every session that changes anything ends with an entry, so the next session (or AJ) can continue without context. Keep entries short and factual.

## Entry template

```markdown
### YYYY-MM-DD · Phase N · <one-line summary>

- **Done:** task IDs + one line each (commits: abc123, …)
- **Decisions:** ADR links or one-liners; new dependencies and why
- **State:** `pnpm verify` green? e2e green? deployed URL + version
- **How to try it on the phone:** steps (only at the end of a phase)
- **What to test:** 3–6 concrete things AJ should try and report back
- **Known issues / debt:** …
- **Next:** the exact next task ID and first step
```

## Toolchain (P0.1, 2026-11-16)

| Tool | Version |
|---|---|
| macOS | Darwin 27.0 (Apple Silicon) |
| git | 2.54.0 (Apple Git-157) |
| Node | 26.13.1 (`.nvmrc`) |
| pnpm | 12.21.0 (`packageManager` field) |
| gh | 2.104.0, logged in as `amir-jalili` |
| Claude Code | 2.1.326 |

Nothing had to be installed. Key packages: SvelteKit 3.2, Svelte 5.57, Vite 8.3, TypeScript 6.0, Tailwind 4.3, Vitest 5.1, Playwright 1.65 (exact versions in `pnpm-lock.yaml`).

## Content coverage

| Level | Points in catalogue | With lesson | Verified items | Generators |
| ----- | ------------------- | ----------- | -------------- | ---------- |
| A1    | 26                  | 0           | 0              | 0          |
| A2    | 28                  | 0           | 0              | 0          |
| B1    | 36                  | 0           | 0              | 0          |
| B2    | 34                  | 0           | 0              | 0          |
| C1    | 24                  | 0           | 0              | 0          |
| C2    | 14                  | 0           | 0              | 0          |

_(Update counts from `pnpm content:stats`; the catalogue counts above are the CURRICULUM.md counts at kickoff — correct them if the catalogue differs.)_

## Entries

### 2026-11-18 · Phase 2 done 🛑 · German WTF v0.3.0 live — daily sessions, spaced repetition, map, stats, book packs

- **Done:** everything in the entry below (P2.1–P2.8), plus:
  - P2.9a: book format, `books:validate`, `books:pack` and the `books:guard` leak check inside `pnpm verify` (0f8f6f7).
  - P2.9b: Dexie v4 `bookPacks`, backup v4, *Import book pack* in Settings, book items join sessions and point practice; `pnpm dev` serves `content/books/` directly (265fd88).
  - P2.9c: *My books* tab on the Map, "Practise chapter X" on Today (65d970f).
  - P2.10: e2e for simulated days with a mocked clock, plus the book-pack import and chapter-practice e2e tests (aec9c1d); release 0.3.0 (8494822).
- **Private repo:** `amir-jalili/german-wtf-books` was created 2026-11-18 (AJ said yes). It is private and only has a README so far. It is already cloned at `content/books/`, which is git-ignored here.
- **Decisions:**
  - Book item ids are `<point-id>/<book-slug>.<nnn>`, so they can never collide with public ids. The part before `/` is still the point id, and the content schema change is additive.
  - A book item needs `origin.book` equal to the book's title, `origin.chapter` equal to its file's chapter, a matching `source` (`book-exact` only for `mode: exact`), and `level` equal to the point's level.
  - Word limits apply to variants only, not to exact book sentences.
  - Importing a pack replaces books by slug and keeps other books. Removing a book keeps all answers. Importing a backup from before v4 keeps the books on the device; a v4 backup replaces them.
  - Book items share their point's cards, so chapter practice counts as real reviews. A chapter's mastery is the weakest card its items review.
  - Today offers the first chapter that isn't answered through or "strong" yet.
  - The leak guard scans every JSON file in `static/content/` and `build/` for `origin`, book sources, book ids and pack files. It runs in CI and before every deploy.
  - There is no new ADR; this is ADR 0003 as built.
- **New dependencies:** none.
- **State:** `pnpm verify` is green with 619 unit tests. All 72 browser tests passed three runs in a row. CI and Deploy are green. **Live: https://amir-jalili.github.io/german-wtf/ — v0.3.0** (smoke-checked: version, Today, *My books* section).
- **How to try it on the phone:**
  1. Open the home-screen app while online. "New version — reload" should appear; tap it. Settings should then say 0.3.0.
  2. Today → **Start**. The first day is one new point with 3 exercises. Come back tomorrow for the next one; reviews come back when they're due.
  3. Map and Stats: have a look around. Settings has the new options (minutes, new points per day, typing or choosing, theme, voice, German interface).
  4. Book packs, with a test book until we make a real one: AirDrop `tests/fixtures/book-pack.json` from the laptop to the phone and save it to Files. Then Settings → *My books* → *Import book pack…*. Today now shows "Testbuch A2 · Chapter 3", and the Map has a *My books* tab. Remove the test book afterwards (Settings → *My books* → *Remove*); your answers stay saved.
- **What to test (please report back):**
  1. Does the daily session feel right in length and mix? Are 15 minutes and 1 new point a day the right defaults?
  2. Typing vs choosing (Settings): is tapping an answer useful on the train, or too easy?
  3. Importing the test pack from Files on iPhone: does the file picker find it?
  4. German interface: which English strings still bother you? (Known: Check/Continue, feedback, lesson headings.)
  5. Night-cat theme and the German voice: is the voice list usable on your iPhone?
- **Known issues / debt:**
  - Everything listed in the entry below still applies.
  - A book item for a point that has no public lesson yet is served in sessions, but its point page says "no exercises yet".
  - The dev pack is rebuilt only when `pnpm dev` starts.
  - Book-pack errors are English only, like the backup errors.
- **Needs AJ:** **P2.9d, the first real pack.** Which book and chapter? Send the exercises with `/book <book>, <chapter>, <exercise>, <variant|exact|remix>`, as photos or typed. I'll write them into the private repo and run `pnpm books:pack`; you then import `private-dist/book-pack-<date>.json` on the phone.
- **Next:** wait for AJ's feedback. Then P2.9d once AJ names a chapter, and Phase 3 from P3.1 (exercise types: transform, combine, errorHunt, endingBuilder, …).

### 2026-11-17 · Phase 2 (in progress) · Scheduler, storage v3, one-tap Today, Map, Stats, Settings — waiting for AJ on book packs

- **Done:** P2.1 FSRS-7 scheduler wrapper, card keys, `gradeFromAnswer`, mastery levels (3695723) · P2.2 mistake cards (point × error tag, resolve after 3 correct + stability ≥ 21 d) and leeches (≥ 6 lapses, re-flag every 3, scaffold next 3 reviews) (69c87cb) · P2.3 Dexie v3 `cards` + `mistakeCards`, upgrade replays the old review log so Phase 1 practice counts, backup v3 + fixture (19ebc35) · P2.4 `buildDailySession`: due → mistakes → new points, time budget, fresh items, interleaving; property tests over 200 random inputs (504f2c7) · P2.5 Today start button with counts and minutes, `/session`, summary (came back, level-ups, fixed mistakes, leech hint), new fun lines (ed3d60f) · P2.6 full grammar map: levels, families, mastery badges, due badges, prerequisite hints, umlaut-insensitive search, coming-soon points (8d20316) · P2.7 Stats: 12-week heatmap, streak with toggle, 7-day forecast, mastery per level, accuracy per family, weakest 5 (7695b75) · P2.8 Settings, split into a–e: backup import (validate → confirm → replace in one transaction → rebuild cards; b9f0dc0), session settings incl. retention target (8d3cfb4), theme + German voice/speed (8483501), typed vs choice: 59 of 65 cloze items can be answered by tapping, with options from `distractorNotes` filtered through the checker (4031228), German UI (5735693). Also fix v0.2.1: bottom nav no longer hides page ends on iPhone (dc6e051).
- **Decisions:** [ADR 0007](adr/0007-scheduler-fsrs7.md): ts-fsrs 6 with FSRS-7, built synchronously, library-default learning steps, no fuzz, card id = card key. **SRS cards are a cache of the review log**: after every answer the point's cards are rebuilt by `replayAnswers`, the same function the v3 upgrade and backup import use. Answers to one card within 30 min form one sitting = one FSRS review (practice mode's 10 items don't count as 10 reviews). The review log now stores `mode`, `errorTags` and `mistakeKey`. New settings (UI comes in P2.8): `targetRetention` 0.9, `dailyMinutes` 15, `newPerDay` 1.
- **New dependency:** `ts-fsrs` 6.0.0. It's the FSRS scheduler (ARCHITECTURE §2). Its chunk is 44.6 KB gzipped and loads only on the Today, practice, session and settings pages (precached); the first-load preload is about 47 KB.
- **State:** `pnpm verify` green (587 unit tests), e2e 66/66 (three runs in a row). Pushed. Not version-bumped or announced yet; that happens at the P2.10 stop.
- **Known issues / debt:** contrast pairing in the session builder waits for contrast content (P5.5). The leech scaffold only shows a hint plus a lesson link, because scaffolded item versions come with endingBuilder (P3.1). Seconds-per-item is a fixed 30 s, not learned from timings yet. `newToday` counts points first answered today, including in practice mode.
- **Bugs found and fixed on the way:** the session summary appeared before the last answer was saved (now `data-ready` waits for it). The settings store dropped a change made in the first moments after start (the initial load overwrote it). The layout e2e test now ignores unrendered content and waits for late content.
- **Known debt (Settings):** some UI strings are still hard-coded English inside components: exercise buttons (Check/Continue), feedback labels, lesson headings, the chaos-level labels and the practice summary. They need moving into `messages.ts`/`messages-de.ts`. The settings store has no unit test (runes); it's covered by e2e.
- **Needs AJ (P2.9 book packs):** (1) May I create the **private** repo `amir-jalili/german-wtf-books` (ADR 0003/0006)? (2) Which book and chapter should be the first pack? Send photos or typed exercises with `/book`. Meanwhile the plumbing (origin schema, `books:validate`, `books:pack`, CI leak guard, *Import book pack*, *My books*) can be built against a test fixture.
- **Next:** P2.9 (after AJ's answer), then P2.10: e2e for a 2-day simulated schedule (`page.clock`) and a book-pack import, version bump 0.3.0 + CHANGELOG, deploy 🛑.

### 2026-11-17 · Phase 1 done 🛑 · German WTF v0.2.0 live — 6 points, cat theme, fun system
- **Done:** P1.8 picker fixed (greedy type interleaving) · P0.6 repo + Pages · P1.6 lesson page (rule, case-coloured table, tappable x-ray examples, TTS, Practise) · P1.7 five more points, 112 verified items in total · P1.9 Dexie v1 + answer log + backup export · P1.11 cat theme (palette, mascot *Dativ* in 7 moods, paw progress, tail spinner, cat icons, `/meme` command) · P1.13 rename to **German WTF** (AJ's `/feature`) · P1.12 fun system (schema, `pickFun`, Dexie v2 `funSeen`, Cat chaos level) · P1.10 e2e + deploy. Also a minimal Map (ready points by level) so Today → Map → lesson works. Commits 618d8a0…47ae88c.
- **Content (gate 3):** each point was blind-solved in a fresh context. All 112 keys matched. The reviewers found one real ambiguity, *Die Katze springt auf ___ Sofa* (Dativ also possible), which I rewrote with *sich legen*. They also flagged a regional *habe gelaufen*, now fixed with a clear direction. Gate 2 (LanguageTool) arrives with P4.4.
- **Decisions:** ADR 0006: the rename keeps internal storage ids (`grammatik-gym` IndexedDB name, backup `app` id) so no progress is lost. The Dexie v2 slot went to `funSeen`, so P2.3 becomes v3. The fun system falls back to the least recently seen line instead of going silent when all were seen in the last 20. *some* = milestones + 1 extra per session; milestones are first-session, perfect-session, point-learned/mastered, level-complete, streaks, comeback. The contrast test found white-on-light case badges in dark mode (≈2.5:1, from P0.5), now fixed.
- **New dependencies:** `dexie` (IndexedDB with versioned migrations, ADR 0002) · `fake-indexeddb` (dev; DB and migration tests in Node).
- **State:** `pnpm verify` green (209 unit tests, content 112/112 servable, 12 fun lines). e2e 28/28 (phone + desktop). CI and Deploy green. **Live: https://amir-jalili.github.io/german-wtf/ — v0.2.0.** First load 45 KB JS gzipped. Live smoke check passed, including an offline deep link.
- **How to try it on the phone:**
  1. iPhone: open **https://amir-jalili.github.io/german-wtf/** in **Safari** → Share → *Add to Home Screen* → it appears as **German WTF** with the cat icon. (Android: Chrome → ⋮ → *Install app*.)
  2. Open it once **from the home-screen icon** while online, tap through Map → a lesson → Practise. This downloads everything for offline use.
  3. Flight mode on → open the app again. Everything should still work.
  4. If you installed the old *Grammatik Gym* address, delete that icon: the address changed (ADR 0006).
- **What to test (please report back):**
  1. **Typing on the phone:** cloze gaps + the ä ö ü ß bar. Does the keyboard cover the gap or the Check button? Does Enter submit?
  2. **The checker:** in *Adjektivdeklination* type *schoenen* for *schönen* or *grosse* for *große*, in *Perfekt mit sein* a typo like *gefahrn*, or any answer in CAPITALS. These should be 🟡 "Almost", while *den/dem* should be ❌. Any answer you think is right but marked wrong → `/bug`.
  3. **Content:** any sentence that sounds odd, an explanation that confuses you, or an item with two right answers.
  4. **Sentence builder:** tapping tiles in and out. Is it comfortable at your phone's size?
  5. **Dativ:** set Settings → *Cat chaos level* → *Maximum* and make three mistakes in a row. Funny or annoying? Then try *Off*.
  6. **Lesson x-ray:** tap the coloured words in the examples. Are the colours and N/A/D/G letters clear in dark mode too?
- **Known issues / debt:** CONTENT_GUIDE §5 asks ≥ 25 items for syntax points; `subordinate-weil-dass` has 16 (ROADMAP P1.7 required ≥ 15). Feldermodell tiles don't snap into zones yet (P3.3). The Map is a simple list (P2.6). Lighthouse not run yet (P8.1; manifest + offline covered by e2e). The fun-system triggers for mastery, streaks, comeback and nothing-due come with Phase 2. The CHANGELOG headline still lists "Grammatik Gym" once, on purpose (AJ's instruction). START_HERE keeps your local folder path and the "E9 Grammatik Gym" portfolio name, which I didn't rename.
- **Fix v0.2.1 (/bug):** the bottom nav covered the end of pages on iPhone (lesson "Practise" button half hidden). Cause: the lesson's fixed bar sat at a hard-coded 64 px and ignored the 34 px home-indicator inset. Now one `--nav-h` + `--safe-bottom` token drives the nav, the page padding, the (now sticky) Practise bar and the update toast; `tests/e2e/layout.e2e.ts` checks every page at 375 px with a faked iPhone inset.
- **Next:** wait for AJ's feedback. Then Phase 2, starting with P2.1 (scheduler: `ts-fsrs` wrapper, card keys `point:skill`, tests with a fixed clock).

### 2026-11-17 · Phase 1 (paused mid-phase by AJ) · Foundations done, core loop half-built
- **Done (Phase 0):** P0.1 toolchain (table above) · P0.2 SvelteKit 3 / Svelte 5 / Vite 8 / TS 6 / Tailwind 4 / Vitest 5 / Playwright scaffold, `pnpm verify` · P0.3 engine-purity ESLint rule + test · P0.4 PWA (manifest, original logo, precaching SW, offline e2e) · P0.5 app shell (bottom nav, light/dark tokens, case badges N/A/D/G, error panel with copy-debug-info) · P0.7 ADR 0004 (GitHub Pages) + ADR 0005 (SW strategy, Playwright on Chromium) · P0.8 version in Settings, CHANGELOG + in-app "What's new", update toast, `src/lib/flags.ts`, `tests/fixtures/`. Commits 472faaa…ec85696.
- **Done (Phase 1):** P1.1 Zod schemas (cloze/choice/order) · P1.2 `content/catalogue.yaml` with all 162 points (English titles, families, compareWith written by hand) · P1.3 `content:validate` (ids, prereq cycles/levels, CURRICULUM sync, per-item checks, duplicate sentences, level word limits, x-ray spans, book guard) + `content:compile` → `static/content/*.json` (precached by the SW) · P1.4 checker (54 table-driven cases; conservative typo rule: only internal edits in 6+-letter words). Commits e6dbabe…9ae82ed.
- **Built but not ticked:** P1.5 exercise components (Cloze with umlaut bar, Choice with keys 1–6, Order with tiles + Feldermodell strip, FeedbackPanel with diff/rule/lesson link/TTS) — lint/typecheck green, **not yet seen in a browser, no e2e yet** (planned with P1.10). P1.7 first point: `accusative-articles` lesson + 21 verified items (blind-solved, all keys matched; one near-duplicate sentence fixed). Commit 10432ca.
- **Half-done (commit d8bba0a, `wip`):** P1.8 `src/lib/engine/session/practice.ts` (pick 10 items, interleave types, summary) + `/practice/[id]` route. **`pnpm verify` is RED at HEAD**: 2 failing tests in `practice.test.ts` — (1) the round-robin picker still yields two `cloze` in a row for some seeds (rotation logic in `pickPracticeItems` is wrong: after `types.push(types.splice(...))` the next `candidates[0]` can be the type just used when it was the only one with items left — rewrite as: choose the non-last type with the most remaining items, else the last type); (2) fixture ids in the test must be `p/001`-style (ItemSchema requires 3 digits) — the fallback test's expected ids need updating to `p/001…p/003`. Fix both first thing, then `pnpm verify`, then tick P1.8 only after the route is checked in the browser.
- **Decisions:** ADR 0004 (GitHub Pages project site, BASE_PATH, 404.html SPA fallback, `scripts/serve.ts` as preview), ADR 0005 (precache everything incl. content JSON; prompt-style updates; Chromium-only Playwright; no component tests). Not ADR-worthy but recorded: `#lib/<path>.js` import style (SvelteKit 3 `imports` map; `.svelte.ts` modules import as `.svelte.js`); `$app/env` replaces `$app/environment`; `HandleClientError` comes from `@sveltejs/kit/hooks`; `$app/paths` has no `base` export — use `resolve('/')` or `asset()`; order tiles are compared case-insensitively and the UI capitalises the first tile; x-ray spans use `text` not offsets (ARCHITECTURE §5.5 updated).
- **New dependencies:** `@vite-pwa/sveltekit` 2 (+ `magicast`, required by it) — only maintained SvelteKit-3 Workbox integration; `tsx` — runs the TypeScript scripts; `zod` 4, `yaml` 2 — content schema and YAML parsing.
- **State:** HEAD d8bba0a is red (see above); 10432ca is the last green commit (lint, typecheck, 124 unit tests, content:validate, build; e2e 20/20). Not deployed, no GitHub repo yet.
- **Needs AJ:** P0.6 — may I create the public GitHub repo `grammatik-gym` under `amir-jalili` and enable Pages (workflows `.github/workflows/{ci,deploy}.yml` are ready; README already names `https://amir-jalili.github.io/german-wtf/ (renamed from /grammatik-gym/, ADR 0006)`)? I planned to ask this once, together with the first deploy at the end of Phase 1.
- **Known issues / debt:** Feldermodell tiles don't snap into zones (static strip above the exercise, zones filled only in feedback; P3.3 builds the real visualiser). Lighthouse "installable" not run yet (manifest + SW checked by Playwright instead; run Lighthouse at P8.1 or when deployed). `/dev/*` pages are unlisted but public. `hooks.client.ts` exposes error messages on purpose (local-only app).
- **Next:** fix `practice.test.ts` + picker (above) → `pnpm verify` green → open `/practice/accusative-articles` in the browser (`pnpm dev`) and check all three exercise types on a 375 px viewport → P1.6 lesson page (`/point/[id]` is a placeholder: add summary, rule via `Md`, table with `CaseBadge`, x-rayed examples, pitfalls, TTS, "Practise" button) → P1.7 remaining five points (`dative-articles`, `two-way-prepositions`, `adj-endings-definite`, `subordinate-weil-dass`, `perfect-sein`; use `tsx scripts/content-blind.ts <id>` + a fresh subagent for the blind solve) → P1.9 Dexie → P1.10 e2e + ask AJ about the repo + deploy.

### 2026-11-16 · Kickoff · Build kit written

- **Done:** Product spec, architecture, curriculum (A1–C2), content guide, roadmap, ADRs 0001–0003, Claude commands (/next /content /book /feature /bug /review), project permission rules, CLAUDE.md §9 rules for safe future updates. AJ's books are welcome as content (variant/exact/remix) via private book packs. No code yet.
- **Next:** P0.1 — check the toolchain and record versions.
