/** Grammar map (ROADMAP P2.6): levels, coming-soon points, search, mastery after practice. */
import { expect, test } from '@playwright/test';
import { allItems, answer } from './helpers';

test('map shows all levels, ready and coming-soon points, and finds points by search', async ({
	page
}) => {
	await page.goto('/map');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Grammar map');
	for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
		await expect(page.getByTestId(`level-${level}`)).toHaveCount(1);
	}
	await expect(page.getByTestId('coming-soon').first()).toBeAttached();
	const ready = page.getByTestId('map-point').filter({ has: page.getByTestId('mastery') });
	await expect(ready).toHaveCount(6);
	await expect(ready.first().getByTestId('mastery')).toHaveAttribute('data-mastery', 'new');

	// umlaut-insensitive search, English titles too
	await page.getByTestId('map-search').fill('wechselprapositionen');
	await expect(page.getByTestId('map-point')).toHaveCount(1);
	await page.getByTestId('map-search').fill('two way');
	await expect(page.getByTestId('map-point')).toHaveCount(1);
	await page.getByTestId('map-search').fill('zzzz');
	await expect(page.getByTestId('map-empty')).toBeVisible();
});

test('after a daily session the new point shows its mastery on the map', async ({ page }) => {
	const items = await allItems(page);
	await page.goto('/');
	await page.getByTestId('start-session').click();
	let pointId = '';
	for (let i = 1; i <= 3; i++) {
		pointId ||= (await page.getByTestId('exercise').getAttribute('data-item-id'))!.split('/')[0]!;
		await answer(page, items, 'right');
		await page.getByRole('button', { name: 'Continue' }).click();
	}
	await expect(page.getByTestId('summary')).toBeVisible();
	await page.goto('/map');
	const point = page.locator(`[data-testid="map-point"][data-point-id="${pointId}"]`);
	await expect(point.getByTestId('mastery')).not.toHaveAttribute('data-mastery', 'new');
});
