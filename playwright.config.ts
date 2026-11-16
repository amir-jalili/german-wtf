import { defineConfig, devices } from '@playwright/test';

/**
 * Two projects: a phone (iPhone 13 viewport, touch) and a desktop.
 * Both run on Chromium: it is the only engine where Playwright's service-worker and
 * offline emulation are reliable, which the offline tests depend on (see ADR 0005).
 */
export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	projects: [
		{
			name: 'phone',
			use: { ...devices['iPhone 13'], browserName: 'chromium' }
		},
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
