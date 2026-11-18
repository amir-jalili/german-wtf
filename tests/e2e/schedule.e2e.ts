/**
 * Simulated days (ROADMAP P2.10), clock mocked. Day 1 learns a new point; quick, all-right
 * answers grade Easy, so its cards graduate straight to review (due in days, not minutes).
 * Day 2 resets the new-point quota and Stats shows a 2-day streak; on day 7 the day-1 cards
 * are due and come back.
 */
import { expect, test, type Page } from '@playwright/test';
import { allItems, answer, type Item } from './helpers';

/** Answers every step right until the summary is saved; returns the step sources seen. */
async function runSession(page: Page, items: Map<string, Item>): Promise<string[]> {
	const sources: string[] = [];
	await page.getByTestId('start-session').click();
	const summary = page.getByTestId('summary');
	while (!(await summary.isVisible())) {
		sources.push((await page.getByTestId('step-source').textContent()) ?? '');
		await answer(page, items, 'right');
		await expect(page.getByTestId('feedback')).toHaveAttribute('data-verdict', 'correct');
		await page.getByRole('button', { name: 'Continue' }).click();
	}
	await expect(summary).toHaveAttribute('data-ready', 'true');
	return sources;
}

const at = (iso: string) => new Date(iso);

test('simulated days: learn, new quota resets the next day, reviews come back when due', async ({
	page
}) => {
	await page.clock.install({ time: at('2026-11-18T08:00:00') });
	const items = await allItems(page);

	// Day 1, 08:00 — a fresh start offers one new point.
	await page.goto('/');
	await expect(page.getByTestId('count-new')).toBeVisible();
	await expect(page.getByTestId('count-due')).toHaveCount(0);
	expect(new Set(await runSession(page, items))).toEqual(new Set(['New']));
	await page.getByRole('link', { name: 'Back to Today' }).click();
	await expect(page.getByTestId('nothing-due')).toBeVisible();

	// Day 1, 20:00 — nothing new (quota 1 per day) and nothing due yet.
	await page.clock.setSystemTime(at('2026-11-18T20:00:00'));
	await page.goto('/');
	await expect(page.getByTestId('nothing-due')).toBeVisible();

	// Day 2, 09:00 — a new day: the next new point is offered; day 1's cards aren't due.
	await page.clock.setSystemTime(at('2026-11-19T09:00:00'));
	await page.goto('/');
	await expect(page.getByTestId('count-new')).toBeVisible();
	await expect(page.getByTestId('count-due')).toHaveCount(0);
	expect(await runSession(page, items)).toContain('New');
	await page.goto('/stats');
	await expect(page.getByTestId('streak')).toContainText('2 days');

	// Day 7, 09:00 — day 1's cards are due and come back.
	await page.clock.setSystemTime(at('2026-11-25T09:00:00'));
	await page.goto('/');
	await expect(page.getByTestId('count-due')).toBeVisible();
	expect(await runSession(page, items)).toContain('Review');
	await expect(page.getByTestId('came-back')).toBeVisible();
});
