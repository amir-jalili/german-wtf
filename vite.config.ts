import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/**
 * Base path for deployment. Empty locally; GitHub Actions sets BASE_PATH=/grammatik-gym
 * so the site works under https://<user>.github.io/grammatik-gym/.
 */
const base = parseBasePath(process.env.BASE_PATH);

function parseBasePath(value: string | undefined): '' | `/${string}` {
	if (!value) return '';
	if (!value.startsWith('/')) throw new Error(`BASE_PATH must start with "/": ${value}`);
	return value as `/${string}`;
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				// SPA fallback so deep links like /point/<id> work on static hosting (GitHub Pages serves 404.html).
				fallback: '404.html'
			}),
			paths: { base }
		})
	],
	test: {
		// Engine and script tests run in Node; UI flows are covered by Playwright (tests/e2e).
		environment: 'node',
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/unit/**/*.test.ts'],
		expect: { requireAssertions: true }
	}
});
