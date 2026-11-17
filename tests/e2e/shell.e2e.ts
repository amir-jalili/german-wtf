import { expect, test } from '@playwright/test';
import { waitForSetting } from './helpers';

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
	expect(dark).toBe('rgb(23, 20, 17)');
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

test('the update toast appears when a new version is ready and can be dismissed', async ({
	page
}) => {
	await page.goto('/dev/styles');
	await page.getByRole('button', { name: 'Simulate new version' }).click();
	const toast = page.getByRole('status');
	await expect(toast).toContainText('New version ready');
	await toast.getByRole('button', { name: 'Later' }).click();
	await expect(toast).toBeHidden();
});

test('Today shows the mascot and the tagline', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('img', { name: /Dativ the cat/ })).toBeVisible();
	await expect(page.getByTestId('tagline')).toHaveText('Was zur Katze?!');
});

test('theme setting overrides the system and survives a reload', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/settings');
	await page.getByTestId('theme').getByRole('radio', { name: 'Night cat' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	const bg = () => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
	expect(await bg()).toBe('rgb(23, 20, 17)');
	await waitForSetting(page, 'theme', 'dark');
	await page.reload();
	// set before first paint from the localStorage mirror
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.getByTestId('theme').getByRole('radio', { name: 'System' }).click();
	await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
	expect(await bg()).not.toBe('rgb(23, 20, 17)');
});

test('the UI can switch to German and remembers it', async ({ page }) => {
	await page.goto('/settings');
	await page.getByTestId('ui-language').getByRole('radio', { name: 'Deutsch' }).click();
	const nav = page.getByRole('navigation', { name: 'Main' });
	await expect(nav.getByRole('link', { name: 'Heute' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Einstellungen');
	await nav.getByRole('link', { name: 'Karte' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grammatikkarte');
	await waitForSetting(page, 'uiLanguage', 'de');
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grammatikkarte');
	await nav.getByRole('link', { name: 'Einstellungen' }).click();
	await page.getByTestId('ui-language').getByRole('radio', { name: 'English' }).click();
	await expect(nav.getByRole('link', { name: 'Today' })).toBeVisible();
});
