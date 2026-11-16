# 0005 — Service-worker strategy and e2e testing setup

- **Status:** accepted · 2026-11-16
- **Context:** The app must work fully offline after the first visit, must never force-reload a running session, and must be testable offline in CI. SvelteKit 3 removed its built-in `$service-worker` module, so the PWA layer comes from `@vite-pwa/sveltekit` v2 (`withPwa`), which is young (early 2026) but the only maintained SvelteKit-3 integration of Workbox.
- **Decision:**
  - **Precache everything**: the generated Workbox worker precaches the app shell *and* all compiled content (`content/*.json`). First install downloads a few MB in the background; after that every grammar point works offline. (The performance budget concerns the initial JS bundle, which still loads per route.)
  - **Update flow**: `registerType: 'prompt'`, `skipWaiting: false`, `clientsClaim: true`. A new worker waits; `src/lib/pwa/register.svelte.ts` flips `needRefresh` and the UI shows "New version — reload". Nothing reloads until the user taps it.
  - **Navigation fallback**: offline navigations to non-precached routes (e.g. `/point/<id>`) get `404.html`, the SPA shell.
  - **Manifest and icon links** are written in `src/app.html` (the plugin does not inject them into Kit's HTML). Icons are generated from `src/lib/assets/logo*.svg` by `scripts/icons.sh` (needs `rsvg-convert`) and committed.
  - **Playwright** runs two projects, *phone* (iPhone 13 viewport, touch) and *desktop*, both on **Chromium**: Playwright's service-worker and `setOffline` emulation are only reliable there. Real-device checks on iOS Safari are done by AJ at each phase end (PROGRESS "What to test").
  - **Unit tests** are Vitest in Node only (engine, scripts). No browser-mode component tests: UI behaviour is covered end to end, which keeps `pnpm verify` fast.
- **Consequences:** Reliable offline use; one tap to update; CI can prove offline behaviour. Risk: the PWA plugin is new, so pin its major version and re-check the generated `build/sw.js` after upgrades (the precache list must contain `404.html`, `./` and the `_app` assets exactly once).
- **Alternatives:** Hand-written service worker (more control, more code to maintain and test). WebKit in Playwright for the phone project (closer to Safari, but flaky service workers and no offline emulation).
