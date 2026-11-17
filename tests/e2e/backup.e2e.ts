/** Backup import (ROADMAP P2.8a): validate, confirm, replace; a broken file changes nothing. */
import { expect, test } from '@playwright/test';

test('importing a backup asks first, then replaces progress and rebuilds the map', async ({
	page
}) => {
	await page.goto('/settings');
	await expect(page.getByTestId('answer-count')).toHaveText(/^0 /);

	// a broken file: readable error, nothing changes
	await page.getByTestId('import-file').setInputFiles({
		name: 'broken.json',
		mimeType: 'application/json',
		buffer: Buffer.from('{"app":"something-else"}')
	});
	await expect(page.getByTestId('import-error')).toContainText('not a German WTF backup');
	await expect(page.getByTestId('import-confirm')).toHaveCount(0);

	// a real v3 backup: shows what's inside, writes only after "Replace my progress"
	await page.getByTestId('import-file').setInputFiles('tests/fixtures/backup-v3.json');
	const confirm = page.getByTestId('import-confirm');
	await expect(confirm).toContainText('Backup found: 5 answers');
	await confirm.getByRole('button', { name: 'Replace my progress' }).click();
	await expect(page.getByTestId('import-done')).toContainText('Imported: 5 answers');
	await expect(page.getByTestId('answer-count')).toHaveText(/^5 /);
	// the imported settings apply (the fixture sets the chaos level to maximum)
	await expect(page.getByRole('radio', { name: 'Maximum' })).toHaveAttribute(
		'aria-checked',
		'true'
	);

	await page.goto('/map');
	const point = page.locator('[data-testid="map-point"][data-point-id="accusative-articles"]');
	await expect(point.getByTestId('mastery')).not.toHaveAttribute('data-mastery', 'new');
});
