import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { withPwa } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
	version: string;
};

/**
 * Base path for deployment. Empty locally; GitHub Actions sets BASE_PATH=/grammatik-gym
 * so the site works under https://<user>.github.io/grammatik-gym/ (ADR 0004).
 */
const base = parseBasePath(process.env.BASE_PATH);

function parseBasePath(value: string | undefined): '' | `/${string}` {
	if (!value) return '';
	if (!value.startsWith('/')) throw new Error(`BASE_PATH must start with "/": ${value}`);
	return value as `/${string}`;
}

/** The SPA fallback page: GitHub Pages serves 404.html for unknown paths, so deep links work. */
const FALLBACK = '404.html';

export default defineConfig({
	define: { __APP_VERSION__: JSON.stringify(pkg.version) },
	plugins: [
		tailwindcss(),
		withPwa(
			{
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter({ fallback: FALLBACK }),
				paths: { base }
			},
			// PWA / service worker strategy: see ADR 0005.
			{
				strategies: 'generateSW',
				// Absolute base and scope: Kit renders relative paths, so on a deep link (/practice/x)
				// a relative ./sw.js would resolve to /practice/sw.js and 404.
				base: `${base}/`,
				scope: `${base}/`,
				registerType: 'prompt', // never force-reload a session; the app shows "New version — reload"
				injectRegister: false, // registered from src/lib/pwa/register.svelte.ts
				manifestFilename: 'manifest.webmanifest',
				manifest: {
					id: `${base}/`,
					name: 'Grammatik Gym',
					short_name: 'Grammatik',
					description: 'Master German grammar from A1 to C2 in 15 minutes a day.',
					lang: 'en',
					start_url: `${base}/`,
					scope: `${base}/`,
					display: 'standalone',
					orientation: 'portrait',
					background_color: '#faf8ff',
					theme_color: '#6d28d9',
					icons: [
						{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
						{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
						{
							src: 'icons/icon-maskable-512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'maskable'
						}
					]
				},
				// Everything under static/ is already covered by globPatterns; listing files here again
				// would precache them twice with different revisions and break the worker.
				includeAssets: [],
				generateSW: {
					clientsClaim: true,
					skipWaiting: false,
					cleanupOutdatedCaches: true,
					// Precache the app shell and all compiled content so the whole app works offline.
					globPatterns: [
						'client/**/*.{js,css,ico,png,svg,webp,webmanifest,woff2}',
						'client/content/**/*.json',
						'prerendered/**/*.{html,json}'
					],
					globStrict: false, // client/content/ only exists once content is compiled (P1.3)
					navigateFallbackDenylist: [/^\/_app\//, /\.(?:json|webmanifest|png|svg)$/]
				},
				kit: {
					adapterFallback: FALLBACK,
					trailingSlash: 'never',
					spa: true
				},
				devOptions: { enabled: false }
			}
		)
	],
	test: {
		// Engine and script tests run in Node; UI flows are covered by Playwright (tests/e2e).
		environment: 'node',
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/unit/**/*.test.ts'],
		expect: { requireAssertions: true }
	}
});
