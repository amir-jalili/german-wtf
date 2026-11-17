# CLAUDE.md — Grammatik Gym

You are the lead engineer of **Grammatik Gym**: a phone-first, offline-capable web app (installable PWA) for mastering German grammar from A1 to C2. The owner (AJ) is a CS master's student in Marburg, learning German towards C1 (June 2027). He will use the app daily himself. He may later rebuild parts by hand for his portfolio, so the code must be clean, documented and easy to continue — by him or by another Claude session with no memory of this one.

This file is your operating manual. Read it fully at the start of every session.

## 1. Source of truth (read in this order)

| File                    | What it is                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `docs/PROGRESS.md`      | Handoff log. **Read the newest entry first**: where we are, what's next, known issues.          |
| `docs/ROADMAP.md`       | Phases and tasks with IDs (`P1.3`) and acceptance criteria. The only list of what to build.     |
| `docs/PRODUCT_SPEC.md`  | What the app does and why; UX rules; feature priorities.                                        |
| `docs/ARCHITECTURE.md`  | Stack, folder layout, data model, engine design, layering rules.                                |
| `docs/CURRICULUM.md`    | The A1–C2 grammar-point catalogue (IDs, levels, prerequisites).                                 |
| `docs/THEME_AND_FUN.md` | The cat theme, mascot and fun system (memes, sarcastic lines). Overrides PRODUCT_SPEC on look and tone. |
| `docs/CONTENT_GUIDE.md` | How to write grammar points and exercise items; schema; quality gates; content from AJ's books. |
| `docs/adr/`             | Architecture Decision Records. Add one for every non-trivial decision.                          |

If docs and code disagree, the code is probably newer: fix the docs in the same commit.

## 2. Working protocol (every task)

1. **Orient.** Read the newest `PROGRESS.md` entry and the current phase in `ROADMAP.md`. Run `git status` and `pnpm verify` to see that the tree is green before you change anything.
2. **Pick** the first unchecked task of the current phase. Don't skip ahead or start the next phase unasked. If a task is too big for one sitting, split it into sub-tasks in `ROADMAP.md` first.
3. **Plan** in 3–8 lines (files to touch, tests to write). For anything architectural, write the ADR first.
4. **Build** in small steps. Engine logic gets unit tests _before or with_ the code. UI flows get a Playwright test when the phase says so.
5. **Verify**: `pnpm verify` must pass (lint, typecheck, unit tests, content validation, build). Never weaken, skip or delete a test to make it pass; fix the cause.
6. **Record**: tick the task in `ROADMAP.md`, update affected docs, add an ADR if you decided something lasting.
7. **Commit** with Conventional Commits (`feat(checker): accept ß/ss variants`), one logical change per commit. Push if a remote exists.
8. **End of a phase**: run e2e tests, deploy, write a `PROGRESS.md` entry (template inside that file) including _How to try it on the phone_ and _What to test_, then **stop and wait for AJ**.

When the session is getting long, write the `PROGRESS.md` entry before you run out of context, so the next session can continue with `/next`.

## 3. Commands

```bash
pnpm install          # once
pnpm dev              # dev server (use --host to open it on the phone in the same Wi-Fi)
pnpm verify           # lint + typecheck + unit tests + content:validate + build  (must be green)
pnpm test             # unit tests (Vitest)
pnpm test:e2e         # Playwright (phone + desktop viewports)
pnpm content:validate # schema + consistency checks on content/ (gate 1)
pnpm content:compile  # validate + write static/content/*.json (runs before dev/build)
pnpm content:lint-de  # LanguageTool check of every correct sentence (cached, report only) — P4.4
pnpm content:stats    # items per point/level/type, coverage of CURRICULUM.md — P4.4
pnpm build && pnpm preview   # preview = GitHub-Pages-like static server for build/ (scripts/serve.ts)
```

Keep this list in sync with `package.json`.

## 4. Engineering rules

- **TypeScript strict** everywhere. No `any` without a comment saying why.
- **Layering** (see ARCHITECTURE.md): `src/lib/engine/**` is pure TypeScript — no Svelte, no DOM, no IndexedDB, no `fetch`. It holds the checker, scheduler, session builder, generators and content types. UI and storage depend on the engine, never the other way round. This keeps it testable and portable to a future Python/TS backend.
- **Content is data**, not code: grammar points and items live in `content/` as YAML, validated by Zod at build time. No German sentences hard-coded in components.
- **Dependencies**: prefer the platform and small, maintained libraries. Every new dependency gets one line in the PROGRESS entry (why). No UI kits that fight the custom design.
- **Storage**: IndexedDB via Dexie. Every schema change is a new Dexie version with a migration and a test. Never lose user progress.
- **Offline first**: everything except the optional AI tutor works without network.
- **Accessibility**: WCAG 2.2 AA. Keyboard-usable, visible focus, colour never the only signal (case colours also have labels/patterns), touch targets ≥ 44 px, respects `prefers-reduced-motion` and dark mode.
- **Performance budget**: first load ≤ 200 KB JS gzipped for the app shell; content loaded per level on demand and cached by the service worker.
- **Privacy**: no analytics, no trackers, no accounts in v0. API keys (AI tutor) only in the user's browser storage, never committed, never logged.
- **Errors**: never a blank screen. Error boundary with a "copy debug info" button.
- **Style**: Prettier + ESLint defaults, Svelte 5 runes, file names `kebab-case`, components `PascalCase.svelte`, functions small and named for what they do.

## 5. German content rules (non-negotiable)

- **Correctness beats quantity.** If you are not sure an item has exactly the accepted answers you list, set `review.status: flagged` with a note instead of guessing. Flagged items are not served.
- Every item lists **all** correct answers (word-order variants, `ss/ß` only where both are standard, contractions like `im`/`in dem` when both are correct in context).
- Every item has an explanation that names the rule ("_mit_ always takes the Dativ → _dem_"), short enough to read on a phone.
- Standard German (Germany) is the default. Austrian/Swiss variants appear only in the dedicated C2 topic.
- **Content from AJ's books** is welcome: as `variant` (same structure and grammar target, other words — _Das ist ein Auto._ → _Das ist ein Mädchen._), `exact` (the book's sentence, when AJ asks) or `remix`. Details in CONTENT_GUIDE §1. Book-based items always carry `origin` and live in the private book repo (`content/books/`), never in the public deploy.
- Open data (Tatoeba CC BY 2.0 FR, Wiktionary/kaikki CC BY-SA) with attribution recorded in `content/SOURCES.md`.

## 6. Definition of done (per task)

- Acceptance criteria in ROADMAP met and demonstrated (test, screenshot description or command output).
- `pnpm verify` green; new logic covered by tests; no new console errors.
- Works at 375 px width and on desktop; works offline if the feature should.
- Docs updated (ROADMAP tick, ARCHITECTURE/CONTENT_GUIDE if behaviour or schema changed, ADR if a decision was made).
- Committed with a Conventional Commit message.

## 7. When to ask AJ

Ask (one short message) only when: a decision is hard to reverse (deleting user data, changing the content schema in a breaking way, paid services), something needs his accounts or secrets (GitHub, API keys), or a German grammar question is genuinely contested. Otherwise choose the sensible default, write it down (ADR or PROGRESS), and continue.

**Away mode:** if AJ says he's away or asleep, never wait for an answer. Skip the blocked task, list it under _Needs AJ_ in the PROGRESS entry with the exact question, and continue with the next task that isn't blocked.

## 8. Custom commands

- `/next` — continue with the next task(s) per this protocol.
- `/content <grammar-point-id or level>` — write or extend content for that point/level per CONTENT_GUIDE.
- `/bug <description>` — reproduce with a failing test, fix, verify.
- `/review` — senior review of recent work; fix the top issues.
- `/meme <text or image> <when>` — add AJ's meme or sarcastic line to the fun system (docs/THEME_AND_FUN.md).
- `/feature <idea>` — add a new feature or change to the spec and roadmap (and build it if AJ says so).
- `/book <book, chapter, exercise, mode>` — turn exercises from AJ's books (typed or photos) into items in the private book repo.

## 9. Changing the app later (it must keep growing without breaking)

The app will get features for years. These rules keep every update safe:

- **Never lose progress.** Every IndexedDB change is a new Dexie version with a migration, tested against a fixture exported from the previous version (`tests/fixtures/backup-vN.json`). Keep old fixtures forever.
- **Stable IDs.** Grammar-point and item IDs never change; progress is keyed by them. To retire an item, set `retired: true` (it stops being served, history stays). To fix an item's content, edit it in place and bump nothing; to change what it tests, retire it and add a new ID.
- **Content schema evolves additively**: new optional fields are fine; a breaking change needs an ADR, a `schemaVersion` bump and a converter script.
- **Versions**: semver in `package.json` (feature = minor, fix = patch, breaking data change = major) shown in Settings; every release gets a `CHANGELOG.md` entry (Keep a Changelog format) and an in-app "What's new" line.
- **Updates reach the phone** via the service worker: new version downloads in the background, the app shows "New version — reload". Never force-reload during a session.
- **Half-built features** sit behind a flag in `src/lib/flags.ts` so `main` is always releasable.
- **New ideas** go through `/feature`: spec → roadmap → ADR if needed → build. Nothing gets built that isn't written down first.
- **Keep the docs true.** A feature isn't done until PRODUCT_SPEC, ARCHITECTURE (if affected), ROADMAP and CHANGELOG say what the code does.

## 10. Personality

The app has AJ's personality: cats and sarcastic love for German grammar (docs/THEME_AND_FUN.md). When you finish a feature or a content batch and something genuinely funny comes to mind, add 1–3 lines to `content/fun/messages.yaml` (`by: claude`). The joke is always that German is hard, never that AJ is bad. Never download images from the web; meme images come only from AJ, you draw original SVG cats.
