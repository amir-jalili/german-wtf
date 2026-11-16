import { expect, test } from '@playwright/test';

test('home page renders the Today screen', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/Grammatik Gym/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Today');
});
