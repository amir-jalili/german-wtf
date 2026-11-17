/** Stats (ROADMAP P2.7): empty state, then numbers after a session; the streak can be hidden. */
import { expect, test } from '@playwright/test';
import { allItems, answer } from './helpers';

test('stats are empty at first and fill up after a daily session', async ({ page }) => {
	await page.goto('/stats');
	await expect(page.getByTestId('stats-empty')).toBeVisible();

	const items = await allItems(page);
	await page.goto('/');
	await page.getByTestId('start-session').click();
	await answer(page, items, 'right');
	await page.getByRole('button', { name: 'Continue' }).click();
	await answer(page, items, 'wrong');
	await page.getByRole('button', { name: 'Continue' }).click();
	await answer(page, items, 'right');
	await page.getByRole('button', { name: 'Continue' }).click();
	// all answers are stored once the summary is ready
	await expect(page.getByTestId('summary')).toHaveAttribute('data-ready', 'true');

	await page.goto('/stats');
	await expect(page.getByTestId('streak')).toContainText('1 day');
	await expect(page.getByTestId('heatmap-summary')).toHaveText(/^3\s+answers · 1\s+active day$/);
	await expect(page.getByTestId('heatmap').locator('div')).toHaveCount(84);
	await expect(page.getByTestId('forecast').locator('li')).toHaveCount(7);
	await expect(page.getByTestId('accuracy')).toContainText('67%');
	await expect(page.getByTestId('weakest').locator('li')).toHaveCount(1);
	await expect(page.getByTestId('mastery-levels')).toBeVisible();

	await page.getByTestId('streak-toggle').uncheck();
	await expect(page.getByTestId('streak')).toHaveCount(0);
	// wait until the setting is committed to IndexedDB, then reload
	await expect
		.poll(() =>
			page.evaluate(
				() =>
					new Promise((done) => {
						const open = indexedDB.open('grammatik-gym');
						open.onsuccess = () => {
							const get = open.result
								.transaction('settings')
								.objectStore('settings')
								.get('showStreak');
							get.onsuccess = () => {
								done((get.result as { value?: unknown } | undefined)?.value);
								open.result.close();
							};
						};
					})
			)
		)
		.toBe(false);
	await page.reload();
	await expect(page.getByTestId('streak-toggle')).not.toBeChecked();
	await expect(page.getByTestId('streak')).toHaveCount(0);
});
