# 0003 — Book-based content in a private repo, delivered as book packs

- **Status:** accepted · 2026-11-16
- **Context:** AJ wants exercises from his own grammar books in the app: as variants (same grammar, other words) or exactly as printed. The app itself is deployed to a public URL.
- **Decision:** Book-based items use the normal item schema plus `origin` (book, chapter, exercise, mode) and `source: book-variant | book-exact`. They live in a separate private repo `grammatik-gym-books`, cloned into the git-ignored `content/books/`. `pnpm books:pack` builds a JSON pack that AJ imports on his devices; it is stored in IndexedDB. A CI guard fails the public build if book items leak into it.
- **Consequences:** AJ gets his books' exercises with SRS and progress per chapter; the public site and repo contain only our own content, so they can stay public safely. One manual step: import the pack after adding chapters (`pnpm dev` reads the folder directly).
- **Alternatives:** Book items in the main repo (public site exposes them; takedown risk for the whole app). Password-protected hosting (more ops, still a copy on a public server).
