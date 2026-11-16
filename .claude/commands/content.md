Write or extend German grammar content for: $ARGUMENTS
(a grammar-point id from docs/CURRICULUM.md, a family, or a level like "A2").

Follow docs/CONTENT_GUIDE.md exactly:

1. This is the main (public) content: write it yourself. Exercises from AJ's books go through `/book` instead.
2. Lesson (rule in own words, table if useful, 3–5 x-rayed examples, pitfalls), consistent with prerequisite lessons.
3. Items in batches of 10–15, mixed types, ≥ 30 % typed production, every correct variant listed, explanation + errorTags on each.
4. Quality gates: `pnpm content:validate`, `pnpm content:lint-de`, then the blind-solve pass in a fresh context (subagent). Fix, then mark verified. If unsure about German, flag — never guess.
5. Update the coverage table in docs/PROGRESS.md, commit as `content(<id>): …`.
   For a whole level, do the points in catalogue order and commit per point.
