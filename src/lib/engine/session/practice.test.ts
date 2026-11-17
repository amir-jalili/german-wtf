import { describe, expect, it } from 'vitest';
import { ItemSchema, type Item } from '../content/schema';
import { mulberry32 } from '../util/rng';
import { pickPracticeItems, summarise } from './practice';

const base = {
	level: 'A1',
	skill: 'form',
	explanation: 'x',
	errorTags: ['case'],
	review: { status: 'verified', by: 'c', date: '2026-11-17' },
	source: 'original'
};
const id = (n: number): string => `p/${String(n).padStart(3, '0')}`;
const cloze = (n: number): Item =>
	ItemSchema.parse({ ...base, id: id(n), type: 'cloze', text: `{{a}} ${n}`, accepted: ['a'] });
const choice = (n: number): Item =>
	ItemSchema.parse({
		...base,
		id: id(n),
		type: 'choice',
		text: `___ ${n}`,
		options: ['a', 'b'],
		answer: 'a'
	});
const order = (n: number): Item =>
	ItemSchema.parse({ ...base, id: id(n), type: 'order', tiles: ['a', 'b'], accepted: ['a b'] });

describe('pickPracticeItems', () => {
	const items = [
		...Array.from({ length: 6 }, (_, i) => cloze(i)),
		...Array.from({ length: 3 }, (_, i) => choice(10 + i)),
		...Array.from({ length: 3 }, (_, i) => order(20 + i))
	];

	it('picks count items, never the same item twice, never two of the same type in a row', () => {
		for (let seed = 0; seed < 50; seed++) {
			const picked = pickPracticeItems(items, { count: 10, rng: mulberry32(seed) });
			expect(picked).toHaveLength(10);
			expect(new Set(picked.map((i) => i.id)).size).toBe(10);
			for (let i = 1; i < picked.length; i++) expect(picked[i]!.type).not.toBe(picked[i - 1]!.type);
		}
	});

	it('mixes types even when one type dominates the pool (21 items: 13 cloze, 4 choice, 4 order)', () => {
		const pool = [
			...Array.from({ length: 13 }, (_, i) => cloze(i)),
			...Array.from({ length: 4 }, (_, i) => choice(20 + i)),
			...Array.from({ length: 4 }, (_, i) => order(30 + i))
		];
		for (let seed = 0; seed < 50; seed++) {
			const picked = pickPracticeItems(pool, { count: 10, rng: mulberry32(seed) });
			for (let i = 1; i < picked.length; i++) expect(picked[i]!.type).not.toBe(picked[i - 1]!.type);
		}
	});

	it('repeats a type only when nothing else is left, and skips drafts and retired items', () => {
		const draft = {
			...cloze(4),
			review: { status: 'draft' as const, by: 'c', date: '2026-11-17' }
		};
		const retired = { ...cloze(5), retired: true };
		const picked = pickPracticeItems([cloze(1), cloze(2), cloze(3), draft, retired], {
			count: 10,
			rng: mulberry32(1)
		});
		expect(picked.map((i) => i.id).sort()).toEqual(['p/001', 'p/002', 'p/003']);
	});

	it('is deterministic for a seed', () => {
		const a = pickPracticeItems(items, { count: 5, rng: mulberry32(7) }).map((i) => i.id);
		const b = pickPracticeItems(items, { count: 5, rng: mulberry32(7) }).map((i) => i.id);
		expect(a).toEqual(b);
	});
});

describe('summarise', () => {
	it('counts verdicts; near-misses count as correct for accuracy', () => {
		expect(summarise(['correct', 'near-miss', 'wrong', 'correct'])).toEqual({
			total: 4,
			correct: 2,
			nearMiss: 1,
			wrong: 1,
			accuracy: 0.75
		});
		expect(summarise([]).accuracy).toBe(0);
	});
});
