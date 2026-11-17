# 0006 — Rename to "German WTF" (was "Grammatik Gym")

- **Status:** accepted · 2026-11-17 · amends 0003 (book repo name) and 0004 (Pages URL)
- **Context:** AJ renamed the app to match its cat personality (THEME_AND_FUN.md): **German WTF**, tagline **"Was zur Katze?!"** (a pun on *Was zur Hölle?!*). The GitHub repo and the Pages URL move with it.
- **Decision:**
  - Every user-visible name becomes *German WTF* (app title, PWA manifest `name` and `short_name`, home-screen title, README, docs, `package.json` name). The tagline appears under the mascot on Today and in the manifest description.
  - Repo `amir-jalili/grammatik-gym` → `amir-jalili/german-wtf`; Pages moves to `https://amir-jalili.github.io/german-wtf/`. The deploy workflow derives `BASE_PATH` from the repo name, so no code change is needed for the path.
  - The planned private book repo is named `german-wtf-books`.
  - **Internal storage identifiers do not change:** the IndexedDB database stays `grammatik-gym` (`DB_NAME`) and backups keep `"app": "grammatik-gym"`. They are keys, not names; changing them would orphan stored progress or make old backups unimportable (CLAUDE.md §9). Backup *file names* use the new name.
- **Consequences:** Same origin (`amir-jalili.github.io`), so IndexedDB data carries over to the new path. A home-screen install made from the old URL keeps the old scope and must be re-installed from the new URL (GitHub Pages does not redirect a renamed project site). The old service worker at `/grammatik-gym/` is harmless and unused. Git remotes redirect after the rename, but `origin` is updated anyway.
- **Alternatives:** Rename the database too, with a copy-migration (risk without benefit; the name is never shown).
