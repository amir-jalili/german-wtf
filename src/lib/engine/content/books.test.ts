import { describe, expect, it } from 'vitest';
import {
	bookItemsByPoint,
	BookPackSchema,
	isBookItem,
	itemBookSlug,
	itemPointId,
	mergeItemsByPoint,
	type PackedBook
} from './books';
import { ItemIdSchema, ItemSchema, type Item } from './schema';

const item = (id: string, extra: object = {}): Item =>
	ItemSchema.parse({
		id,
		type: 'cloze',
		level: 'A2',
		skill: 'form',
		text: 'mit {{dem}} Bus',
		accepted: ['dem'],
		explanation: 'x',
		errorTags: ['case'],
		review: { status: 'verified', by: 'c', date: '2026-11-18' },
		source: 'original',
		...extra
	});

describe('book item ids', () => {
	it('accepts public ids and book ids, rejects anything else', () => {
		for (const ok of ['dative-articles/001', 'dative-articles/testbuch-a2.001'])
			expect(ItemIdSchema.safeParse(ok).success).toBe(true);
		for (const bad of ['dative-articles/.001', 'dative-articles/Buch.001', 'x/1', 'x/a.b.001'])
			expect(ItemIdSchema.safeParse(bad).success).toBe(false);
	});

	it('splits point id and book slug', () => {
		expect(itemPointId('dative-articles/testbuch-a2.003')).toBe('dative-articles');
		expect(itemBookSlug('dative-articles/testbuch-a2.003')).toBe('testbuch-a2');
		expect(itemBookSlug('dative-articles/003')).toBeUndefined();
	});

	it('recognises book items by origin, source or id', () => {
		expect(isBookItem(item('p/001'))).toBe(false);
		expect(isBookItem(item('p/b.001'))).toBe(true);
		expect(isBookItem(item('p/001', { source: 'book-exact' }))).toBe(true);
		expect(
			isBookItem(item('p/001', { origin: { book: 'B', chapter: '1', mode: 'variant' } }))
		).toBe(true);
	});
});

describe('book items by point', () => {
	const books: PackedBook[] = [
		{
			slug: 'b',
			title: 'B',
			chapters: [
				{ id: '1', title: 'one', items: [item('p/b.001'), item('q/b.001')] },
				{ id: '2', title: 'two', items: [item('p/b.002')] }
			]
		}
	];

	it('groups in book order and merges after the public items without mutating', () => {
		const byPoint = bookItemsByPoint(books);
		expect(byPoint.get('p')?.map((i) => i.id)).toEqual(['p/b.001', 'p/b.002']);
		const base = new Map([['p', [item('p/001')]]]);
		const merged = mergeItemsByPoint(base, byPoint);
		expect(merged.get('p')?.map((i) => i.id)).toEqual(['p/001', 'p/b.001', 'p/b.002']);
		expect(merged.get('q')).toHaveLength(1);
		expect(base.get('p')).toHaveLength(1);
	});

	it('the pack schema rejects other files', () => {
		expect(BookPackSchema.safeParse({ format: 'german-wtf-backup' }).success).toBe(false);
	});
});
