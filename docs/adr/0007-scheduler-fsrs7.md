# 0007 — Scheduler: ts-fsrs 6 with the FSRS-7 model, built synchronously

- **Status:** accepted · 2026-11-17 (P2.1)
- **Context:** ARCHITECTURE §5.2 picked `ts-fsrs`. Version 6 (current) replaced the old `fsrs()` API with composable schedulers (`defineScheduler` + model + chrono + middlewares) and made FSRS-7 the default model. Its convenience preset `DefaultScheduler()` is `async` (it lazy-loads the model module), which would force every engine caller to await.
- **Decision:**
  - Use **FSRS-7** with the library's default weights and the same middleware stack as `DefaultScheduler()` (retention, fuzzing, stats, scheduled days, learning steps, maximum and monotonic interval), but build it **synchronously** in `src/lib/engine/scheduler/fsrs.ts` by importing `FSRS7Model` from `ts-fsrs/models/fsrs-7` directly. The engine stays pure and synchronous.
  - Keep the library defaults for short-term learning (`learningSteps 1m, 10m`, `relearningSteps 10m`, fractional days). A card answered wrong can be due again within minutes; the session builder (P2.4) decides whether it re-appears in the same session. Turning short-term steps off made FSRS-7 produce sub-day intervals for every rating, which is worse for a daily app.
  - **Fuzz off.** Deterministic intervals make tests and "due today" counts predictable; with a few hundred cards the clustering fuzz prevents is negligible. Revisit if forecasts show spikes (P2.7).
  - The FSRS card id is our card key (`pointId:skill`, or `mistake:pointId:errorTag` for P2.2), never a random UUID.
  - Target retention is a setting (`targetRetention`, default 0.9, clamped 0.70–0.97).
  - Rating from the result, per ARCHITECTURE §5.2: wrong → Again; near-miss or "I guessed" → Hard; correct → Good; correct and faster than 40 % of the item's median time → Easy (only with ≥ 3 earlier timings of that item).
- **Consequences:** FSRS state is stored as ts-fsrs returns it (numbers + `Date`s) in the Dexie `cards` table (P2.3). Changing the model version later means re-computing state from `reviewLog`, which is kept forever for exactly this reason.
- **Alternatives:** `DefaultScheduler()` (async everywhere); the deprecated v5-compatible `fsrs()` API (will be removed); FSRS-6 (no reason to pick the older model).
