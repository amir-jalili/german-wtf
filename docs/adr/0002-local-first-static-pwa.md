# 0002 — Local-first static PWA, content as code

- **Status:** accepted · 2026-11-16
- **Context:** AJ wants to use the app on his phone within days, often without network (train, Mensa, work breaks), at zero running cost. Content correctness matters more than dynamic content.
- **Decision:**
  - SvelteKit with `adapter-static`, deployed as static files; installable PWA with a service worker.
  - All user state in IndexedDB (Dexie) on the device; JSON export/import as backup. No accounts, no server in v1.
  - Grammar content authored as YAML in `content/`, validated (Zod + scripts) and compiled to per-level JSON at build time. Generated paradigms come from pure TS generators.
  - Engine (checker, scheduler, session, generators) is pure TypeScript with no framework/browser imports, so it can move to a server later.
- **Consequences:** Fast, free, offline, private. No cross-device sync until a backend is added (Phase 8, separate ADR). Runtime AI is optional and BYOK only.
- **Alternatives considered:** FastAPI + Postgres + LLM generation at runtime (AJ's E9 portfolio design) — better as a later, hand-built version; too much ops and unverified content for a usable v1. Native apps — slower to build, store friction.
