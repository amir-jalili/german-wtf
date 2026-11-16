Bug report from AJ: $ARGUMENTS

1. Reproduce it: write a failing unit or Playwright test that shows the bug (or explain why it can't be reproduced and what you checked).
2. Find the root cause; fix it in the right layer (engine vs UI vs content).
3. `pnpm verify` (+ e2e if UI) green. If it was a content error, also check sibling items for the same mistake.
4. Commit `fix(<scope>): …`, add one line to the newest PROGRESS entry, deploy if a deploy pipeline exists.
