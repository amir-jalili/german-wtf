# 0004 — Hosting on GitHub Pages (project site)

- **Status:** accepted · 2026-11-16
- **Context:** The app is a static PWA (ADR 0002). It needs free hosting with HTTPS (required for service workers and "Add to Home Screen"), automatic deploys from `main`, and no ops. AJ already uses GitHub (`gh` is logged in).
- **Decision:** GitHub Actions builds `main` and deploys `build/` to **GitHub Pages** as a project site, `https://<owner>.github.io/grammatik-gym/`.
  - The build runs with `BASE_PATH=/grammatik-gym`; `vite.config.ts` feeds it to `paths.base`, the web manifest (`start_url`, `scope`, `id`) and the service-worker scope. Locally `BASE_PATH` is empty, so dev and e2e run at `/`.
  - Deep links (`/point/<id>`) work because `adapter-static` writes an SPA fallback as `404.html`, which GitHub Pages serves for unknown paths.
  - `pnpm preview` runs `scripts/serve.ts`, a small server that mimics GitHub Pages (clean URLs, `404.html` fallback) so local previews and Playwright see the same behaviour as production.
  - A CI guard fails the deploy if any book-based item (ADR 0003) reaches `build/content`.
  - The repo may be public (needed for free Pages without GitHub Pro); book content never lives in it.
- **Consequences:** Zero cost, HTTPS, deploy in ~2 min per push. URL carries the `/grammatik-gym` prefix (a custom domain can be added later without code changes). Pages has a 1 GB soft limit and no server logic, which fits ADR 0002.
- **Alternatives:** Cloudflare Pages (also free, root-path URLs, but another account and a second CI integration). Netlify/Vercel (free tiers with limits; overkill for static files).
