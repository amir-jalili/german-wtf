/**
 * Book packs (P2.9): import the committed fixture pack (a made-up book, see
 * tests/fixtures/books/) in Settings, see it listed after a reload, reject a wrong file,
 * remove it again.
 */
import { expect, test } from '@playwright/test';

const PACK = 'tests/fixtures/book-pack.json';

test('import a book pack, keep it across reloads, reject a backup, remove the book', async ({
	page
}) => {
	await page.goto('/settings');
	const section = page.getByTestId('book-packs');
	await expect(section.getByTestId('no-books')).toBeVisible();

	await section.getByTestId('book-pack-file').setInputFiles(PACK);
	await expect(section.getByTestId('book-pack-done')).toHaveText(
		/Imported: Testbuch A2 \(2\s+chapters, 5\s+exercises\)/
	);
	await expect(section.locator('[data-book="testbuch-a2"]')).toContainText('Testbuch A2');

	// Same pack again → the book is replaced, not duplicated.
	await section.getByTestId('book-pack-file').setInputFiles(PACK);
	await expect(section.getByTestId('book-pack-done')).toHaveText(/Updated: Testbuch A2/);
	await page.reload();
	await expect(page.getByTestId('book-packs').locator('[data-book]')).toHaveCount(1);

	// A backup is not a book pack: clear message, nothing changes.
	await page.getByTestId('book-pack-file').setInputFiles('tests/fixtures/backup-v3.json');
	await expect(page.getByTestId('book-pack-error')).toHaveText(/not a German WTF book pack/);
	await expect(page.locator('[data-book]')).toHaveCount(1);

	await page.locator('[data-book="testbuch-a2"]').getByRole('button', { name: 'Remove' }).click();
	await page.getByRole('button', { name: 'Yes, remove' }).click();
	await expect(page.getByTestId('no-books')).toBeVisible();
});
