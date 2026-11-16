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

### 2026-11-16 · Kickoff · Build kit written

- **Done:** Product spec, architecture, curriculum (A1–C2), content guide, roadmap, ADRs 0001–0003, Claude commands (/next /content /book /feature /bug /review), project permission rules, CLAUDE.md §9 rules for safe future updates. AJ's books are welcome as content (variant/exact/remix) via private book packs. No code yet.
- **Next:** P0.1 — check the toolchain and record versions.
