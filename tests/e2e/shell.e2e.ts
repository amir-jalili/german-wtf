import { expect, test } from '@playwright/test';

const tabs = [
	{ label: 'Today', path: '/', heading: 'Today' },
	{ label: 'Map', path: '/map', heading: 'Grammar map' },
	{ label: 'Mistakes', path: '/mistakes', heading: 'Mistakes' },
	{ label: 'Stats', path: '/stats', heading: 'Stats' },
	{ label: 'Settings', path: '/settings', heading: 'Settings' }
];

test('bottom navigation reaches every tab and marks the current one', async ({ page }) => {
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Main' });
	for (const tab of tabs) {
		await nav.getByRole('link', { name: tab.label }).click();
		await expect(page).toHaveURL(new RegExp(`${tab.path.replace('/', '\\/')}$`));
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(tab.heading);
		await expect(nav.getByRole('link', { name: tab.label })).toHaveAttribute(
			'aria-current',
			'page'
		);
	}
});

test('nav links are at least 44 px tall (touch targets)', async ({ page }) => {
	await page.goto('/');
	const links = page.getByRole('navigation', { name: 'Main' }).getByRole('link');
	for (const box of await links.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))) {
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.width).toBeGreaterThanOrEqual(44);
	}
});

test('dark mode follows the system colour scheme', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	const light = await page.evaluate(
		() => getComputedStyle(document.documentElement).backgroundColor
	);
	await page.emulateMedia({ colorScheme: 'dark' });
	const dark = await page.evaluate(
		() => getComputedStyle(document.documentElement).backgroundColor
	);
	expect(light).not.toBe(dark);
	expect(dark).toBe('rgb(15, 13, 23)');
});

test('settings shows the app version', async ({ page }) => {
	await page.goto('/settings');
	await expect(page.getByTestId('app-version')).toHaveText(/^\d+\.\d+\.\d+/);
});

test('a render error shows the error panel instead of a blank screen', async ({ page }) => {
	await page.goto('/dev/crash');
	await page.getByRole('button', { name: 'Crash now' }).click();
	const alert = page.getByRole('alert');
	await expect(alert).toContainText('Something went wrong');
	await expect(alert).toContainText('Test crash from /dev/crash');
	await expect(alert.getByRole('button', { name: 'Copy debug info' })).toBeVisible();
});

test('unknown routes show the error panel with the status', async ({ page }) => {
	await page.goto('/does-not-exist');
	await expect(page.getByRole('alert')).toContainText('404');
});
