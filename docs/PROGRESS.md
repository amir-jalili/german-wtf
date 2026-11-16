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
