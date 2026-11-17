Turn exercises from AJ's grammar books into German WTF items: $ARGUMENTS
(expected: book, chapter, exercise(s), mode `variant` (default) / `exact` / `remix`; text typed or page photos attached or given as file paths).

Follow docs/CONTENT_GUIDE.md §1 and the gates in §6:

1. Read the exercise(s). If a photo is unclear, list what you couldn't read and ask instead of guessing.
2. Map each exercise to grammar-point id(s) from docs/CURRICULUM.md; add the chapter → points mapping to `content/books/<book-slug>/book.yaml`.
3. Write items in `content/books/<book-slug>/<chapter>.yaml` in the requested mode. `variant`: same structure and same grammar target (case, gender, number, tense, construction), other words. `exact`: as printed. `remix`: 2–4 variants per sentence that vary gender/case/person on purpose. Every item: `origin`, `source`, our own explanation, errorTags, all accepted answers.
4. `pnpm books:validate`, then the blind-solve pass; flag anything uncertain. If AJ gave the answer key, check against it.
5. Commit in the private books repo (`content(<book> <chapter>): N items, <mode>`), run `pnpm books:pack`, and tell AJ the pack file path to import on the phone.
   If book packs aren't built yet (ROADMAP P2.9), write the YAML anyway and say it will be importable after P2.9.
