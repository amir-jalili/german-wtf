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

test('session settings change what Today offers', async ({ page }) => {
	await page.goto('/settings');
	await page.getByTestId('new-per-day').getByRole('radio', { name: '2' }).click();
	await expect(page.getByTestId('new-per-day').getByRole('radio', { name: '2' })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await page.getByTestId('minutes').getByRole('radio', { name: '5', exact: true }).click();
	await page.getByTestId('retention').getByRole('radio', { name: /Exam/ }).click();
	await expect(page.getByTestId('retention').getByRole('radio', { name: /Exam/ })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	// in-app navigation, like a user (a full reload could race the pending settings write)
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click();
	await expect(page.getByTestId('start-session')).toContainText('Start · 6 exercises');
	await page
		.getByRole('navigation', { name: 'Main' })
		.getByRole('link', { name: 'Settings' })
		.click();
	await page.getByTestId('new-per-day').getByRole('radio', { name: '0' }).click();
	await expect(page.getByTestId('new-per-day').getByRole('radio', { name: '0' })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	// in-app navigation, like a user (a full reload could race the pending settings write)
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click();
	await expect(page.getByTestId('nothing-due')).toBeVisible();
});

test('with "Choosing", cloze gaps with distractors become multiple choice', async ({ page }) => {
	await page.goto('/settings');
	await page.getByTestId('answer-mode').getByRole('radio', { name: 'Choosing' }).click();
	await expect(
		page.getByTestId('answer-mode').getByRole('radio', { name: 'Choosing' })
	).toHaveAttribute('aria-checked', 'true');
	const all = await allItems(page);
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Map' }).click();
	await page.locator('[data-point-id="dative-articles"] a').click();
	await page.getByRole('link', { name: /Practise/ }).click();
	let converted = 0;
	for (let i = 0; i < 10; i++) {
		const exercise = page.getByTestId('exercise');
		const item = all.get((await exercise.getAttribute('data-item-id'))!)!;
		// which cloze items convert is unit-tested on all content (present-content.test.ts);
		// here: the setting takes effect, and a converted item is answered by tapping
		if (item.type === 'cloze' && (await page.getByLabel('Gap 1').count()) === 0) {
			converted++;
			await exercise.getByRole('button', { name: new RegExp(`${item.accepted[0]![0]}$`) }).click();
			await expect(page.getByTestId('feedback')).toContainText('Correct');
		} else {
			await answer(page, all, 'right');
		}
		await page.getByRole('button', { name: 'Continue' }).click();
	}
	expect(converted).toBeGreaterThan(0);
});
