import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildPack, readBooks } from '../../../scripts/lib/books';
import { BookPackImportError, importBookPack, loadBooks, removeBook } from './books';
import { logAnswer } from './review-log';
import { GymDB } from './schema';

const { books } = await readBooks('tests/fixtures/books/books');
const pack = buildPack(books, new Date('2026-11-18T09:00:00Z'));
const packText = JSON.stringify(pack);

let db: GymDB;
let n = 0;
beforeEach(async () => {
	db = new GymDB(`books-${n++}`);
	await db.open();
});
afterEach(async () => {
	await db.delete();
});

describe('book packs in IndexedDB', () => {
	it('imports a pack, and re-importing replaces the book by slug', async () => {
		const first = await importBookPack(db, packText, 1);
		expect(first.books).toEqual([
			{ slug: 'testbuch-a2', title: 'Testbuch A2', chapters: 2, items: 5, replaced: false }
		]);
		const smaller = structuredClone(pack);
		smaller.books[0]!.chapters.pop();
		smaller.hash = 'other';
		const second = await importBookPack(db, JSON.stringify(smaller), 2);
		expect(second.books[0]).toMatchObject({ chapters: 1, replaced: true });
		const [stored] = await loadBooks(db);
		expect(stored).toMatchObject({ slug: 'testbuch-a2', packHash: 'other', importedAt: 2 });
		expect(stored!.chapters).toHaveLength(1);
	});

	it('keeps other books and never touches the review log', async () => {
		const other = structuredClone(pack);
		other.books[0]!.slug = 'anderes-buch';
		other.books[0]!.title = 'Anderes Buch';
		await importBookPack(db, JSON.stringify(other));
		const item = pack.books[0]!.chapters[0]!.items[0]!;
		const answer = { type: 'cloze' as const, gaps: ['einen'] };
		const { checkItem } = await import('#lib/engine/checker/index.js');
		await logAnswer(db, {
			item,
			pointId: 'accusative-articles',
			answer,
			check: checkItem(item, answer),
			ms: 1
		});
		await importBookPack(db, packText);
		expect((await loadBooks(db)).map((b) => b.title)).toEqual(['Anderes Buch', 'Testbuch A2']);
		await removeBook(db, 'testbuch-a2');
		expect((await loadBooks(db)).map((b) => b.slug)).toEqual(['anderes-buch']);
		expect(await db.reviewLog.count()).toBe(1);
	});

	it.each([
		['not JSON', '{', 'This file is not JSON.'],
		[
			'a backup',
			JSON.stringify({ app: 'grammatik-gym', dbVersion: 4 }),
			/not a German WTF book pack/
		],
		[
			'a damaged pack',
			JSON.stringify({ ...pack, books: [] }),
			/different app version, or it is damaged/
		]
	])('rejects %s and stores nothing', async (_name, text, message) => {
		await expect(importBookPack(db, text)).rejects.toThrow(BookPackImportError);
		await expect(importBookPack(db, text)).rejects.toThrow(message);
		expect(await db.bookPacks.count()).toBe(0);
	});
});
