# Roadmap

Work top to bottom. Tick a task (`- [x]`) only when its acceptance criteria are met and `pnpm verify` is green. **Stop at the end of every phase** (🛑) and write a PROGRESS entry so AJ can try it on his phone. Split big tasks into sub-tasks here before starting them.

---

## Phase 0 — Foundations

Goal: an empty but real, deployed, installable app with CI.

- [x] **P0.1** Check toolchain (git, Node LTS, pnpm, gh). Install missing tools via Homebrew only after telling AJ. Record versions in PROGRESS.
- [x] **P0.2** Scaffold SvelteKit (Svelte 5, TS strict, adapter-static), Tailwind, ESLint, Prettier, Vitest, Playwright (iPhone 13 + Desktop Chrome projects), pnpm scripts from CLAUDE.md §3. `pnpm verify` green.
- [x] **P0.3** ESLint boundary rule: `src/lib/engine/**` may not import svelte, `$app/*`, dexie, DOM globals or `src/lib/{ui,db,stores}`. A test file proves the rule fires.
- [x] **P0.4** PWA: manifest, icons (simple original logo), service worker precaching the shell; Lighthouse "installable" passes; offline reload of `/` works (Playwright offline test).
- [x] **P0.5** App shell: bottom nav (Today · Map · Mistakes · Stats · Settings), dark mode, theme tokens incl. case colours N/A/D/G with letter badges, error boundary.
- [x] **P0.6** GitHub repo `grammatik-gym` (renamed `german-wtf` in P1.13) (ask AJ before creating; free GitHub Pages needs a public repo unless he has Pro — free with the GitHub Student Developer Pack; fine either way, because book content lives in a separate private repo) + Actions: verify + e2e on PR/push; deploy `main` to GitHub Pages. README with live URL.
- [x] **P0.7** ADR 0004 hosting choice, plus anything decided in P0.
- [x] **P0.8** Release plumbing: semver version shown in Settings, `CHANGELOG.md` (Keep a Changelog), "New version — reload" toast from the service worker, `src/lib/flags.ts` for feature flags, `tests/fixtures/` for backup fixtures (CLAUDE.md §9).

## Phase 1 — The core loop (AJ uses it on day 1)

Goal: learn and practise 6 real grammar points on the phone with excellent checking.

- [x] **P1.1** Content schemas (Zod) for catalogue, point, lesson, items: cloze, choice, order. Type tests.
- [x] **P1.2** `content/catalogue.yaml` with **all** points from CURRICULUM.md (id, titles, level, family, prereqs, compareWith). Validator: ids, cycles, sync with CURRICULUM.md.
- [x] **P1.3** `scripts/content-validate.ts` + `content-compile.ts` (YAML → `static/content/<level>.json`, hashed). Wired into `pnpm verify` and build.
- [x] **P1.4** Checker v1: normalise, accepted variants, near-miss (capitalisation, umlaut as ae/oe/ue, ß/ss, Levenshtein 1), `distractorNotes`, token diff with highlighted spans. ≥ 40 table-driven tests incl. German edge cases.
- [ ] **P1.5** Exercise components: Cloze (with umlaut bar), Choice, Order (tiles + Feldermodell strip). Keyboard + touch. Feedback panel (✅ / 🟡 / ❌ with diff, rule, "open lesson").
- [x] **P1.6** Lesson page `/point/[id]`: summary, rule (Markdown), table with case colours, x-rayed examples (tap a word → role/case), pitfalls, TTS play buttons, "Practise" button.
- [x] **P1.7** Content: lessons + ≥ 15 verified items each for `accusative-articles`, `dative-articles`, `two-way-prepositions`, `adj-endings-definite`, `subordinate-weil-dass`, `perfect-sein` (gates 1–3 of CONTENT_GUIDE).
- [x] **P1.8** Practice session (no SRS yet): pick a point → 10 items, interleaved types, summary screen.
- [x] **P1.9** Dexie v1: `reviewLog`, `settings`, `meta`; every answer logged. Export JSON button in Settings.
- [x] **P1.11** Cat theme (docs/THEME_AND_FUN.md §1, AJ's request 17 Nov): re-skin the shell with the cat palette (ginger accent, cream/oat, "night cat" dark mode), original SVG mascot *Dativ* with at least `loaf`, `smug`, `flat-on-keyboard`, `crying-thumbs-up`, `sleeping`; paw-print progress, cat-tail spinner, cat favicon + PWA icons. Contrast still AA; case colours unchanged. Install `setup/meme.md` as `.claude/commands/meme.md` (then remove `setup/`).
- [x] **P1.12** Fun system v1 (THEME_AND_FUN.md §2): schema + validation for `content/fun/`, pure `pickFun` with tests, triggers `session-done`, `perfect-session`, `wrong-streak-3`, `near-miss`, `late-night`, mascot bubble on the end-of-session screen, "Cat chaos level" setting (off / some / maximum). Remaining triggers come with the features that emit them (Phase 2: mastery, streaks, comeback, nothing-due).
- [x] **P1.13** Rename to **German WTF**, tagline "Was zur Katze?!" (AJ, 17 Nov, ADR 0006): all user-visible names, manifest name/short name/description, tagline under the mascot on Today, docs, package name; repo renamed to `german-wtf`, Pages at `/german-wtf/`. Storage ids unchanged. *Acceptance:* e2e checks title, manifest and tagline; live site served from the new URL.
- [x] **P1.10** E2E: open lesson → practise → answer right/near/wrong → summary; works offline after first load. Deploy. 🛑 **Stop: PROGRESS entry with phone install steps + what to test.**

## Phase 2 — Learning engine

Goal: open the app, tap one button, get today's right mix.

- [x] **P2.1** Scheduler: `ts-fsrs` wrapper, card keys `point:skill`, rating from verdict + time + "I guessed", target retention setting. Unit tests with fixed clock.
- [x] **P2.2** Mistake cards per `point:errorTag` with resolve rule; leech detection.
- [x] **P2.3** Dexie v3 migration (`cards`, `mistakeCards`), migration test from v1 and v2 data (v2 was taken by `funSeen` in P1.12).
- [x] **P2.4** Session builder: due → mistakes → new (quota, prerequisites), time budget, interleaving, fresh-item picking. Property-style tests (no item twice in a row, budget respected).
- [x] **P2.5** Today screen: start button with counts and minutes, end-of-session summary ("came back today", new mastery).
- [x] **P2.6** Grammar map: A1–C2 sections, families, mastery colours, due badges, prerequisite hints, search; points without content show "coming soon".
- [x] **P2.7** Stats: 12-week heatmap, streak (toggle), accuracy per family, mastery bars per level, 7-day forecast, weakest 5.
- [x] **P2.8** Settings: daily minutes, new/day, typed vs choice, retention, streak, theme, TTS voice/rate, UI language EN/DE (i18n setup). Import JSON backup with validation.
  - [x] **P2.8a** Import JSON backup: validate (`parseBackup`, v1–v3), confirm, replace all tables in one transaction, rebuild cards from the log; a broken file changes nothing.
  - [x] **P2.8b** Session settings: daily minutes, new points/day, target retention, streak.
  - [x] **P2.8c** Theme (system/light/dark) and TTS voice/rate.
  - [x] **P2.8d** Typed vs choice preference (cloze can be served as choice when the item has options).
  - [x] **P2.8e** UI language EN/DE (i18n setup, German strings).
- [ ] **P2.9** Book packs (ARCHITECTURE §8): private repo `german-wtf-books` cloned into git-ignored `content/books/` (ask AJ before creating), `origin` schema, `books:validate`, `books:pack`, CI guard against book items in the public build, _Import book pack_ in Settings, _My books_ tab with mastery per chapter, "Practise chapter X" on Today. First pack: one chapter AJ chooses, made with `/book`.
  - [x] **P2.9a** Book format (`book.yaml` + chapter files, item ids `<point>/<book>.<nnn>`), `books:validate`, `books:pack`, leak guard in `pnpm verify` and CI. Private repo created 2026-11-18.
  - [x] **P2.9b** Dexie v4 `bookPacks` (migration + fixture test, backup v4), _Import book pack_ in Settings, book items join sessions and point practice; `pnpm dev` loads `content/books/` directly.
  - [x] **P2.9c** _My books_ on the Map (book → chapter → mastery), "Practise chapter X" on Today.
  - [ ] **P2.9d** First real pack: one chapter AJ chooses, made with `/book`. _Needs AJ._
- [ ] **P2.10** E2E for a 2-day simulated schedule (clock mocked) and a book-pack import. Deploy. 🛑 **Stop.**

## Phase 3 — All exercise types and visual grammar

- [ ] **P3.1** Types + components: transform, combine, errorHunt, endingBuilder (with fading), paradigm, match, classify, dictation.
- [ ] **P3.2** X-ray mode toggle on any sentence (feedback, lessons, items with spans).
- [ ] **P3.3** Feldermodell visualiser for order/combine/transform feedback.
- [ ] **P3.4** Hint ladder (rule reminder → first letter → show answer = Again).
- [ ] **P3.5** "I guessed" and "Report this item" buttons; `/dev/review` queue page.
- [ ] **P3.6** Accessibility pass (axe in Playwright, keyboard-only run of every type). Deploy. 🛑 **Stop.**

## Phase 4 — Generators and A1–B1 content

- [ ] **P4.1** `engine/grammar`: article, pronoun and adjective-ending tables; conjugation (present, Präteritum, Partizip II, aux) for a lexicon; Konjunktiv II forms; n-Deklination. Fixtures hand-checked; 100 % branch coverage on tables.
- [ ] **P4.2** Lexicon YAML (≈ 400 nouns with gender/plural/n-decl flag, ≈ 250 verbs with principal parts, aux, separable prefix, reflexive, case/preposition government; ≈ 150 adjectives incl. irregular comparison). Own work; sources in SOURCES.md if any.
- [ ] **P4.3** Generators for closed paradigms (see ARCHITECTURE §5.4), wired into points via `generators:`.
- [ ] **P4.4** `content:lint-de` (LanguageTool, cached) and `content:stats` scripts.
- [ ] **P4.5** Content A1 complete (all points: lesson + items/generators, gates passed).
- [ ] **P4.6** Content A2 complete.
- [ ] **P4.7** Content B1 complete. Deploy. 🛑 **Stop.**

## Phase 5 — B2–C2 and style trainers

- [ ] **P5.1** Content B2 complete.
- [ ] **P5.2** Style trainers as guided transform flows: Verbal ↔ Nominal (all 6 relations), relative clause ↔ Partizipialattribut, direct ↔ indirect speech, active ↔ passive ↔ Passiversatz.
- [ ] **P5.3** Content C1 complete.
- [ ] **P5.4** Content C2 complete.
- [ ] **P5.5** Contrast drills for every pair in CURRICULUM.md. Deploy. 🛑 **Stop.**

## Phase 6 — Personal power features

- [ ] **P6.1** Adaptive placement test (~30 items) → long-interval "probably known" cards.
- [ ] **P6.2** Exam-style mixed sets per level (own items only; no real exam content, no trademark claims).
- [ ] **P6.3** Book progress page: mastery and weak spots per chapter across all books; "next chapter" suggestion in line with AJ's German Track.
- [ ] **P6.4** Mistake journal page + Fehlerliste Markdown export (exact format in PRODUCT_SPEC §4) + Anki CSV export.
- [ ] **P6.5** Self-study sentences (paste, mark gap, attach to point) and bookmarks/cram mode. Deploy. 🛑 **Stop.**

## Phase 7 — Optional AI tutor (BYOK, off by default)

- [ ] **P7.1** ADR for provider/model and browser-direct calls; key stored locally, clear warning text.
- [ ] **P7.2** "Explain more" on any feedback panel.
- [ ] **P7.3** Free-writing task per point with feedback focused on that point (JSON-schema output, rendered as inline corrections).
- [ ] **P7.4** Generate extra items for a point into the local review queue (never served until AJ approves). 🛑 **Stop.**

## Phase 8 — Polish and portfolio readiness

- [ ] **P8.1** Performance budget check, Lighthouse ≥ 95 in all categories, bundle report.
- [ ] **P8.2** E2E coverage of every exercise type and offline mode; visual regression snapshots for key screens.
- [ ] **P8.3** README as a case study (EN + DE): problem, features, architecture diagram, content-quality pipeline, numbers (points, items, tests).
- [ ] **P8.4** (Optional, ADR first) Sync backend design doc: FastAPI + Postgres, auth, conflict rules — the bridge to AJ's own E9 build.

---

## Backlog (ideas not yet scheduled — added via `/feature`)

- _(empty)_
