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
