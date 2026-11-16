import { expect, test } from '@playwright/test';

/**
 * The service worker precaches the app shell on first visit, so a reload with the
 * network off must still render the app (ROADMAP P0.4).
 */
test('app shell loads offline after the first visit', async ({ page, context }) => {
	await page.goto('/');
	await page.waitForFunction(async () => {
		const registration = await navigator.serviceWorker.ready;
		return registration.active?.state === 'activated';
	});
	// Second (online) load so the page is controlled by the worker and precaching is complete.
	await page.reload();
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Today');
	await context.setOffline(false);
});

test('web app manifest is served and installable', async ({ page, request }) => {
	await page.goto('/');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	expect(href).toBeTruthy();
	const response = await request.get(new URL(href!, page.url()).toString());
	expect(response.ok()).toBe(true);
	const manifest = await response.json();
	expect(manifest.name).toBe('Grammatik Gym');
	expect(manifest.display).toBe('standalone');
	expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});
