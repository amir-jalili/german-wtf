import { describe, expect, it } from 'vitest';
import { ItemSchema, type Item } from '../content/schema';
import { mulberry32 } from '../util/rng';
import { pickPracticeItems, summarise } from './practice';

const review = { status: 'verified', by: 'c', date: '2026-11-17' } as const;
const base = {
	level: 'A1',
	skill: 'form',
	explanation: 'x',
	errorTags: ['case'],
	review,
	source: 'original',
	audio: true,
	retired: false
} as const;
const cloze = (n: number): Item => ({
	...base,
	id: `p/${n}`,
	type: 'cloze',
	text: `{{a}} ${n}`,
	accepted: [['a']]
});
const choice = (n: number): Item => ({
	...base,
	id: `p/${n}`,
	type: 'choice',
	text: `___ ${n}`,
	options: ['a', 'b'],
	answer: 'a'
});
const order = (n: number): Item => ({
	...base,
	id: `p/${n}`,
	type: 'order',
	tiles: ['a', 'b'],
	accepted: ['a b']
});

describe('pickPracticeItems', () => {
	const items = [
		...Array.from({ length: 6 }, (_, i) => cloze(i)),
		...Array.from({ length: 3 }, (_, i) => choice(10 + i)),
		...Array.from({ length: 3 }, (_, i) => order(20 + i))
	];

	it('picks at most count items, never the same item twice, never two of the same type in a row', () => {
		for (let seed = 0; seed < 25; seed++) {
			const picked = pickPracticeItems(items, { count: 10, rng: mulberry32(seed) });
			expect(picked).toHaveLength(10);
			expect(new Set(picked.map((i) => i.id)).size).toBe(10);
			for (let i = 1; i < picked.length; i++) expect(picked[i]!.type).not.toBe(picked[i - 1]!.type);
		}
	});

	it('falls back to repeating a type when nothing else is left and skips drafts/retired', () => {
		const only = [
			cloze(1),
			cloze(2),
			cloze(3),
			{ ...cloze(4), review: { ...review, status: 'draft' } },
			{ ...cloze(5), retired: true }
		];
		const picked = pickPracticeItems(only, { count: 10, rng: mulberry32(1) });
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
