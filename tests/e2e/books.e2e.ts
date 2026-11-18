/**
 * Book packs (P2.9): import the committed fixture pack (a made-up book, see
 * tests/fixtures/books/) in Settings, see it listed after a reload, reject a wrong file,
 * remove it again.
 */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { answer, type Item } from './helpers';

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

test('Today offers a book chapter; practising it shows progress under My books', async ({
	page
}) => {
	const pack = JSON.parse(readFileSync(PACK, 'utf8')) as {
		books: { chapters: { id: string; items: Item[] }[] }[];
	};
	const items = new Map(
		pack.books[0]!.chapters.find((c) => c.id === '3')!.items.map((i) => [i.id, i])
	);

	await page.goto('/settings');
	await page.getByTestId('book-pack-file').setInputFiles(PACK);
	await expect(page.getByTestId('book-pack-done')).toBeVisible();

	await page.goto('/');
	const offer = page.getByTestId('today-chapter');
	await expect(offer).toContainText('Testbuch A2 · Chapter 3: Akkusativ und Dativ');
	await expect(offer).toContainText(/0 \/ 3\s+answered/);
	await offer.getByTestId('practise-chapter').click();

	await expect(page.getByTestId('progress')).toHaveText('1 / 3');
	for (let i = 0; i < 3; i++) {
		await expect(page.getByTestId('step-source')).toHaveText('Book chapter');
		await answer(page, items, 'right');
		await expect(page.getByTestId('feedback')).toHaveAttribute('data-verdict', 'correct');
		await page.getByTestId('continue').click();
	}
	await expect(page.getByTestId('summary')).toHaveAttribute('data-ready', 'true');
	await expect(page.getByTestId('summary')).toContainText('3 correct');

	await page.goto('/map');
	await page.getByRole('tab', { name: 'My books' }).click();
	const chapter = page.locator('[data-book="testbuch-a2"] [data-chapter="3"]');
	await expect(chapter.getByTestId('chapter-answered')).toHaveText(/3 \/ 3\s+answered/);
	await expect(chapter.getByTestId('mastery')).not.toHaveAttribute('data-mastery', 'new');
	await expect(page.locator('[data-chapter="4"]').getByTestId('mastery')).toHaveAttribute(
		'data-mastery',
		'new'
	);
});
