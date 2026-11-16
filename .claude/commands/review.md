Do a senior code review of the work since the last PROGRESS entry (use `git log` and `git diff`). Focus: $ARGUMENTS

Check in this order: correctness (incl. German content correctness) → tests (missing cases, weak assertions) → architecture rules in CLAUDE.md §4 (engine purity, layering, migrations) → accessibility and phone UX → naming and readability → security/privacy.
List the top issues (max 7) with file:line and why. Then fix the top 3, run `pnpm verify`, commit, and note the rest as debt in PROGRESS.
