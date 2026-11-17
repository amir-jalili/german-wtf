/**
 * Phase 1 core loop (ROADMAP P1.10): lesson → practise → right / almost / wrong → summary,
 * the fun system (P1.12), and the same flow offline after the first visit.
 * Items are random, so answers are looked up in the compiled content bundle.
 */
import { expect, test, type Page } from '@playwright/test';
import { answer, itemsOf, type Mode } from './helpers';

async function setChaos(page: Page, level: 'Off' | 'Some' | 'Maximum'): Promise<void> {
	await page.goto('/settings');
	await page.getByRole('radio', { name: level }).click();
	await expect(page.getByRole('radio', { name: level })).toHaveAttribute('aria-checked', 'true');
}

test('lesson → practise → right, almost, wrong → summary, with the cat commenting', async ({
	page
}) => {
	await setChaos(page, 'Maximum');
	const items = await itemsOf(page, 'A1', 'accusative-articles');

	// Today → map → lesson, the way AJ gets there on the phone.
	await page.goto('/');
	await page.getByRole('link', { name: 'Open the grammar map' }).click();
	await expect(page.getByRole('link', { name: /Wechselpräpositionen/ })).toBeVisible();
	await page.getByRole('link', { name: /Akkusativ: Artikel/ }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Akkusativ: Artikel');
	await page.getByRole('link', { name: /Practise/ }).click();
	await expect(page.getByTestId('progress')).toHaveText('1 / 10');

	// Steps 3–5 are wrong (wrong-streak), the rest right — except the first cloze item on a
	// non-wrong step, which is answered in capitals to produce a near-miss (cloze items make
	// up most of every session, so this always happens).
	const plan: Mode[] = [
		'right',
		'right',
		'wrong',
		'wrong',
		'wrong',
		'right',
		'right',
		'right',
		'right',
		'right'
	];
	const verdicts: string[] = [];
	let sawNearMiss = false;
	for (const [i, planned] of plan.entries()) {
		const type = await page.getByTestId('exercise').getAttribute('data-item-type');
		const mode: Mode = planned === 'right' && type === 'cloze' && !sawNearMiss ? 'almost' : planned;
		const expected = await answer(page, items, mode);
		const feedback = page.getByTestId('feedback');
		await expect(feedback).toHaveAttribute('data-verdict', expected);
		verdicts.push(expected);
		if (expected === 'near-miss') {
			sawNearMiss = true;
			await expect(feedback).toContainText('Almost');
		}
		if (expected === 'wrong') await expect(feedback).toContainText('Not quite');
		// Fun never replaces feedback: when it appears, the feedback is still there.
		if (verdicts.slice(-3).every((v) => v === 'wrong') && verdicts.length >= 3) {
			await expect(page.getByTestId('fun')).toBeVisible();
			await expect(page.getByTestId('header-mascot')).toHaveAttribute(
				'data-mood',
				'flat-on-keyboard'
			);
			await expect(feedback).toBeVisible();
		}
		await page.getByTestId('continue').click();
		if (i < plan.length - 1) await expect(page.getByTestId('progress')).toHaveText(`${i + 2} / 10`);
	}

	const summary = page.getByTestId('summary');
	await expect(summary).toContainText('Done for now');
	const wrong = verdicts.filter((v) => v === 'wrong').length;
	await expect(summary).toContainText(`${wrong} wrong`);
	await expect(summary.getByTestId('fun')).toBeVisible();
	expect(wrong).toBeGreaterThanOrEqual(3);
	expect(sawNearMiss).toBe(true);

	// Every answer was logged.
	await page.goto('/settings');
	await expect(page.getByTestId('answer-count')).toHaveText(/^10 answers/);
});

test('serious mode shows no fun at all', async ({ page }) => {
	await setChaos(page, 'Off');
	const items = await itemsOf(page, 'A2', 'dative-articles');
	await page.goto('/practice/dative-articles');
	for (let i = 0; i < 10; i++) {
		await answer(page, items, 'wrong');
		await expect(page.getByTestId('fun')).toHaveCount(0);
		await page.getByTestId('continue').click();
	}
	await expect(page.getByTestId('summary')).toBeVisible();
	await expect(page.getByTestId('fun')).toHaveCount(0);
});

test('lesson and practice work offline after the first visit', async ({ page, context }) => {
	await page.goto('/');
	await page.waitForFunction(
		async () => (await navigator.serviceWorker.ready).active?.state === 'activated'
	);
	await page.reload();
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
	const items = await itemsOf(page, 'A2', 'two-way-prepositions');

	await context.setOffline(true);
	await page.goto('/point/two-way-prepositions');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Wechselpräpositionen/);
	await page.getByRole('link', { name: /Practise/ }).click();
	await answer(page, items, 'right');
	await expect(page.getByTestId('feedback')).toHaveAttribute('data-verdict', 'correct');
	await context.setOffline(false);
});
