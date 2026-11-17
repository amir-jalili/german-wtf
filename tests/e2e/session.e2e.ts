/**
 * Daily session (ROADMAP P2.5): Today plans the day from the cards on this device, one tap
 * starts it, the summary shows what got stronger, and Today then has nothing left.
 */
import { expect, test } from '@playwright/test';
import { allItems, answer } from './helpers';

test('fresh start: Today offers a new point, the session teaches it, then nothing is due', async ({
	page
}) => {
	const items = await allItems(page);
	await page.goto('/');
	const session = page.getByTestId('today-session');
	await expect(session).toBeVisible();
	await expect(page.getByTestId('count-new')).toContainText('New:');
	await expect(page.getByTestId('count-due')).toHaveCount(0);
	const start = page.getByTestId('start-session');
	await expect(start).toContainText('Start · 3 exercises');
	await start.click();

	await expect(page).toHaveURL(/\/session$/);
	await expect(page.getByTestId('step-source')).toHaveText('New');
	for (let i = 1; i <= 3; i++) {
		await expect(page.getByTestId('progress')).toHaveText(`${i} / 3`);
		await answer(page, items, 'right');
		await page.getByRole('button', { name: 'Continue' }).click();
	}

	const summary = page.getByTestId('summary');
	await expect(summary).toContainText('Done for today');
	await expect(summary).toContainText('100%');
	await expect(page.getByTestId('level-ups')).toContainText('new →');

	await summary.getByRole('link', { name: 'Back to Today' }).click();
	await expect(page.getByTestId('nothing-due')).toBeVisible();
	await expect(page.getByTestId('start-session')).toHaveCount(0);
});

test('a wrong answer in the session creates a mistake card that the next session serves', async ({
	page
}) => {
	const items = await allItems(page);
	await page.goto('/');
	await page.getByTestId('start-session').click();
	await answer(page, items, 'wrong');
	await page.getByRole('button', { name: 'Continue' }).click();
	for (let i = 2; i <= 3; i++) {
		await answer(page, items, 'right');
		await page.getByRole('button', { name: 'Continue' }).click();
	}
	await expect(page.getByTestId('summary')).toBeVisible();
	// The mistake card is due within minutes (FSRS learning step): jump the clock ahead.
	await page.clock.install({ time: new Date(Date.now() + 15 * 60_000) });
	await page.goto('/');
	// one mistake card per error tag of the wrong item
	await expect(page.getByTestId('count-mistakes')).toContainText(/Mistakes to fix: [1-9]/);
	await page.getByTestId('start-session').click();
	// due point card first, then the mistake card with an item that trains that error tag
	await expect(page.getByTestId('step-source')).toHaveText('Review');
	await answer(page, items, 'right');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByTestId('step-source')).toHaveText('Mistake');
});
