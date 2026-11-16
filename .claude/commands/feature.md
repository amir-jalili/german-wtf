AJ wants a new feature or a change: $ARGUMENTS

1. Read CLAUDE.md (esp. §9 "Changing the app later"), docs/PRODUCT_SPEC.md and docs/ROADMAP.md.
2. Write it down first:
   - PRODUCT_SPEC: add/adjust the feature (what, why, how it behaves on the phone).
   - ROADMAP: add it as tasks with IDs and acceptance criteria — inside the current phase if it's small and related, otherwise under `## Backlog` or as a new phase. Note if it changes the order of anything.
   - ADR if it touches architecture, storage, content schema or a dependency.
3. If AJ said "build it now": implement it following the working protocol (tests, `pnpm verify`, migration if storage changes, CHANGELOG entry, version bump), deploy, and add a PROGRESS entry with "What to test". Otherwise stop after step 2 and summarise in 3 lines.
