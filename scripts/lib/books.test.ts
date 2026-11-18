import { describe, expect, it } from 'vitest';
import { BookPackSchema } from '#lib/engine/content/books.js';
import { buildPack, readBooks, validateBooks, type BookSource } from './books';
import { findBookLeaks, isPackFileName } from './books-guard';
import { readCatalogue } from './load-content';

const FIXTURE = 'tests/fixtures/books/books';
const catalogue = readCatalogue();

async function fixture(): Promise<BookSource[]> {
	const { books, problems } = await readBooks(FIXTURE);
	expect(problems).toEqual([]);
	return books;
}

/** A deep copy of the fixture with one item changed. */
function withItem(books: BookSource[], change: (item: Record<string, unknown>) => void) {
	const copy = structuredClone(books);
	change(copy[0]!.chapters[0]!.chapter.items[0] as unknown as Record<string, unknown>);
	return copy;
}

describe('book validation', () => {
	it('the fixture book passes every gate', async () => {
		expect(validateBooks(await fixture(), catalogue)).toEqual([]);
	});

	it('a missing folder means no books, not an error', async () => {
		expect(await readBooks('tests/fixtures/books/nothing-here')).toEqual({
			books: [],
			problems: []
		});
	});

	it.each([
		[
			'id without the book slug',
			(i: Record<string, unknown>) => (i.id = 'accusative-articles/001'),
			/id must be/
		],
		[
			'unknown point',
			(i: Record<string, unknown>) => (i.id = 'no-such-point/testbuch-a2.001'),
			/not in the catalogue/
		],
		['missing origin', (i: Record<string, unknown>) => delete i.origin, /need an origin/],
		[
			'wrong chapter',
			(i: Record<string, unknown>) => ((i.origin as { chapter: string }).chapter = '9'),
			/origin.chapter/
		],
		[
			'source ≠ mode',
			(i: Record<string, unknown>) => (i.source = 'book-exact'),
			/source must be book-variant/
		],
		['level ≠ point', (i: Record<string, unknown>) => (i.level = 'B2'), /level B2/]
	])('reports %s', async (_name, change, message) => {
		const problems = validateBooks(withItem(await fixture(), change), catalogue);
		expect(problems.map((p) => p.message).join('\n')).toMatch(message);
	});

	it('book ids may not reuse public ids, and ids are unique across books', async () => {
		const books = await fixture();
		const id = books[0]!.chapters[0]!.chapter.items[0]!.id;
		expect(validateBooks(books, catalogue, new Set([id]))[0]?.message).toMatch(/public content/);
		const twice = [...books, { ...structuredClone(books[0]!), dir: 'testbuch-a2' }];
		expect(validateBooks(twice, catalogue).map((p) => p.message)).toContain(
			'book slug "testbuch-a2" used twice'
		);
	});

	it('runs the normal item gates too', async () => {
		const books = withItem(await fixture(), (i) => (i.accepted = [['ein']]));
		expect(
			validateBooks(books, catalogue)
				.map((p) => p.message)
				.join()
		).toMatch(/gap 1/);
	});
});

describe('book pack', () => {
	it('contains only verified items, in book and chapter order, and validates', async () => {
		const pack = buildPack(await fixture(), new Date('2026-11-18T10:00:00Z'));
		expect(BookPackSchema.parse(pack)).toBeTruthy();
		const [book] = pack.books;
		expect(book?.chapters.map((c) => c.id)).toEqual(['3', '4']);
		const ids = book?.chapters.flatMap((c) => c.items.map((i) => i.id));
		expect(ids).toHaveLength(5);
		expect(ids).not.toContain('accusative-articles/testbuch-a2.004'); // draft
		expect(pack.createdAt).toBe('2026-11-18T10:00:00.000Z');
		// same content → same hash
		expect(buildPack(await fixture(), new Date()).hash).toBe(pack.hash);
	});
});

describe('leak guard', () => {
	it('finds book items, origins and packs anywhere in a JSON value', async () => {
		const pack = buildPack(await fixture(), new Date());
		const item = pack.books[0]!.chapters[0]!.items[0]!;
		const level = { level: 'A2', points: [{ id: 'p', items: [{ ...item, origin: undefined }] }] };
		expect(findBookLeaks(level, 'A2.json')).toHaveLength(1);
		expect(findBookLeaks(pack, 'x.json').some((l) => l.message === 'a whole book pack')).toBe(true);
		expect(findBookLeaks({ points: [{ id: 'p/001', source: 'original' }] }, 'ok.json')).toEqual([]);
		expect(isPackFileName('build/book-pack-2026-11-18.json')).toBe(true);
		expect(isPackFileName('build/content/A2.json')).toBe(false);
	});
});
