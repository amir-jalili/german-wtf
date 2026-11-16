// The whole app is a static, prerendered PWA (ADR 0002). Routes that cannot be
// prerendered (dynamic ids) are served by the SPA fallback configured in vite.config.ts.
export const prerender = true;
export const trailingSlash = 'never';
