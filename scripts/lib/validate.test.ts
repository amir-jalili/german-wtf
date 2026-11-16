import { describe, expect, it } from 'vitest';
import { CatalogueSchema, GrammarPointSchema, ItemSchema } from '#lib/engine/content/schema.js';
import type { CurriculumPoint } from './curriculum-md';
import {
	correctSentences,
	findCycles,
	validateCatalogue,
	validateItem,
	validatePoints,
	wordCount
} from './validate';

const review = { status: 'verified', by: 'claude-blind-solve', date: '2026-11-17' } as const;

function catalogue(points: unknown[]) {
	return CatalogueSchema.parse({ schemaVersion: 1, points });
}
const entry = (id: string, level: string, prerequisites: string[] = [], extra: object = {}) => ({
	id,
	title: { en: id, de: `${id} de` },
	level,
	family: 'cases',
	prerequisites,
	...extra
});
const curriculumOf = (
	points: { id: string; level: string; title: { de: string }; prerequisites: string[] }[]
): CurriculumPoint[] =>
	points.map((p) => ({
		id: p.id,
		level: p.level as CurriculumPoint['level'],
		titleDe: p.title.de,
		prerequisites: p.prerequisites
	}));

describe('validateCatalogue', () => {
	it('accepts a consistent catalogue', () => {
		const cat = catalogue([entry('a', 'A1'), entry('b', 'A2', ['a'])]);
		expect(validateCatalogue(cat, curriculumOf(cat.points))).toEqual([]);
	});

	it('reports unknown prerequisites, prerequisites above the level and cycles', () => {
		const cat = catalogue([
			entry('a', 'A1', ['b']),
			entry('b', 'B1', ['a']),
			entry('c', 'A1', ['zzz'])
		]);
		const messages = validateCatalogue(cat, curriculumOf(cat.points)).map((p) => p.message);
		expect(messages).toContainEqual(expect.stringContaining('unknown prerequisite "zzz"'));
		expect(messages).toContainEqual(expect.stringContaining('above A1'));
		expect(messages).toContainEqual(expect.stringContaining('cycle'));
	});

	it('reports drift from CURRICULUM.md (level, title, prerequisites, missing ids)', () => {
		const cat = catalogue([entry('a', 'A1'), entry('b', 'A2', ['a'])]);
		const curriculum: CurriculumPoint[] = [
			{ id: 'a', level: 'A2', titleDe: 'other', prerequisites: [] },
			{ id: 'b', level: 'A2', titleDe: 'b de', prerequisites: [] },
			{ id: 'c', level: 'A2', titleDe: 'c', prerequisites: [] }
		];
		const messages = validateCatalogue(cat, curriculum).map((p) => p.message);
		expect(messages).toContainEqual(expect.stringContaining('level A1 ≠ CURRICULUM A2'));
		expect(messages).toContainEqual(expect.stringContaining('German title differs'));
		expect(messages).toContainEqual(expect.stringContaining('prerequisites [a] ≠ CURRICULUM []'));
		expect(messages).toContainEqual(expect.stringContaining('missing point "c"'));
	});
});

describe('findCycles', () => {
	it('finds a 3-cycle and ignores acyclic graphs', () => {
		const cyclic = catalogue([
			entry('a', 'A1', ['c']),
			entry('b', 'A1', ['a']),
			entry('c', 'A1', ['b'])
		]);
		expect(findCycles(cyclic.points)).toHaveLength(1);
		const acyclic = catalogue([
			entry('a', 'A1'),
			entry('b', 'A1', ['a']),
			entry('c', 'A1', ['a', 'b'])
		]);
		expect(findCycles(acyclic.points)).toEqual([]);
	});
});

const base = {
	level: 'A2',
	skill: 'form',
	explanation: 'x',
	errorTags: ['case'],
	review,
	source: 'original'
} as const;

describe('validateItem', () => {
	it('checks cloze gap count, canonical answer and distractor keys', () => {
		const ok = ItemSchema.parse({
			...base,
			id: 'p/001',
			type: 'cloze',
			text: 'Ich helfe dem {{alten}} Mann.',
			accepted: ['alten', 'alten']
		});
		expect(validateItem(ok, 'x').map((p) => p.message)).toEqual([
			'gap 1: duplicate accepted answers'
		]);
		const mismatch = ItemSchema.parse({
			...base,
			id: 'p/002',
			type: 'cloze',
			text: 'Ich helfe dem {{alten}} Mann.',
			accepted: ['alte']
		});
		expect(validateItem(mismatch, 'x')[0]?.message).toContain('first accepted answer is "alte"');
		const count = ItemSchema.parse({
			...base,
			id: 'p/003',
			type: 'cloze',
			text: '{{a}} und {{b}}',
			accepted: ['a']
		});
		expect(validateItem(count, 'x')[0]?.message).toContain('2 gap(s)');
		const note = ItemSchema.parse({
			...base,
			id: 'p/004',
			type: 'cloze',
			text: 'dem {{alten}}',
			accepted: ['alten'],
			distractorNotes: { alten: 'no' }
		});
		expect(validateItem(note, 'x')[0]?.message).toContain('is an accepted answer');
	});

	it('checks choice options and gap marker', () => {
		const bad = ItemSchema.parse({
			...base,
			id: 'p/005',
			type: 'choice',
			text: 'Wir wohnen in ___ Stadt.',
			options: ['der', 'der'],
			answer: 'dem'
		});
		const messages = validateItem(bad, 'x').map((p) => p.message);
		expect(messages).toContainEqual(expect.stringContaining('not among the options'));
		expect(messages).toContainEqual('duplicate options');
		const noGap = ItemSchema.parse({
			...base,
			id: 'p/006',
			type: 'choice',
			text: 'Wir wohnen in der Stadt.',
			options: ['a', 'b'],
			answer: 'a'
		});
		expect(validateItem(noGap, 'x')[0]?.message).toContain('___');
	});

	it('checks that order answers use exactly the tiles', () => {
		const item = ItemSchema.parse({
			...base,
			id: 'p/007',
			type: 'order',
			tiles: ['weil', 'ich', 'arbeiten', 'muss'],
			accepted: ['weil ich arbeiten muss', 'weil ich muss arbeiten', 'weil ich arbeiten'],
			fields: { connector: 'weil', mittelfeld: 'ich', rightBracket: 'arbeiten muss' }
		});
		const messages = validateItem(item, 'x').map((p) => p.message);
		expect(messages).toEqual([
			expect.stringContaining('"weil ich arbeiten" does not use exactly the tiles')
		]);
	});
});

describe('validatePoints', () => {
	const cat = catalogue([entry('dative-articles', 'A2', [], { family: 'cases' })]);
	const point = (items: object[], overrides: object = {}) =>
		GrammarPointSchema.parse({
			...entry('dative-articles', 'A2', [], { family: 'cases' }),
			version: 1,
			lesson: {
				summary: 's',
				rule: 'r',
				examples: [
					{
						de: 'Ich helfe dem Mann.',
						en: 'x',
						xray: [{ text: 'dem Mann', role: 'dat-obj', case: 'dat' }]
					}
				]
			},
			items,
			...overrides
		});

	it('accepts a consistent point file', () => {
		const files = [
			{
				path: 'content/points/cases/dative-articles.yaml',
				point: point([
					{
						...base,
						id: 'dative-articles/001',
						type: 'cloze',
						text: 'Ich helfe {{dem}} Mann.',
						accepted: ['dem']
					}
				])
			}
		];
		expect(validatePoints(files, cat)).toEqual([]);
	});

	it('reports path, catalogue drift, x-ray spans, duplicate sentences, length and book items', () => {
		const items = [
			{
				...base,
				id: 'dative-articles/001',
				type: 'cloze',
				text: 'Ich helfe {{dem}} Mann.',
				accepted: ['dem']
			},
			{
				...base,
				id: 'dative-articles/002',
				type: 'choice',
				text: 'Ich helfe ___ Mann.',
				options: ['dem', 'den'],
				answer: 'dem'
			},
			{
				...base,
				id: 'dative-articles/003',
				type: 'cloze',
				text: 'Ich helfe {{dem}} Mann mit dem großen Hund aus dem dritten Stock heute.',
				accepted: ['dem']
			},
			{
				...base,
				id: 'other/004',
				type: 'cloze',
				text: 'Ich danke {{dem}} Mann.',
				accepted: ['dem'],
				source: 'book-variant',
				origin: { book: 'b', chapter: '1', mode: 'variant' }
			}
		];
		const p = point(items, {
			level: 'A2',
			lesson: {
				summary: 's',
				rule: 'r',
				examples: [
					{ de: 'Ich helfe dem Mann.', en: 'x', xray: [{ text: 'der Frau', role: 'dat-obj' }] }
				]
			}
		});
		const messages = validatePoints(
			[{ path: 'content/points/wrong/dative-articles.yaml', point: p }],
			cat
		).map((m) => m.message);
		expect(messages).toContainEqual(
			expect.stringContaining('expected file path content/points/cases/dative-articles.yaml')
		);
		expect(messages).toContainEqual(expect.stringContaining('x-ray span "der Frau" not found'));
		expect(messages).toContainEqual(
			expect.stringContaining('duplicate sentence (same as dative-articles/001)')
		);
		expect(messages).toContainEqual(expect.stringContaining('words > 12 allowed at A2'));
		expect(messages).toContainEqual(
			expect.stringContaining('item id must start with "dative-articles/"')
		);
		expect(messages).toContainEqual(expect.stringContaining('book-based item in public content'));
	});
});

describe('helpers', () => {
	it('builds the correct sentence per type and counts words', () => {
		const cloze = ItemSchema.parse({
			...base,
			id: 'p/001',
			type: 'cloze',
			text: 'Ich helfe {{dem}} Mann.',
			accepted: ['dem']
		});
		expect(correctSentences(cloze)).toEqual(['Ich helfe dem Mann.']);
		const order = ItemSchema.parse({
			...base,
			id: 'p/002',
			type: 'order',
			prefix: 'Ich komme nicht, ',
			tiles: ['weil', 'ich', 'muss'],
			accepted: ['weil ich muss'],
			suffix: '.'
		});
		expect(correctSentences(order)).toEqual(['Ich komme nicht, weil ich muss.']);
		expect(wordCount('Ich helfe dem Mann.')).toBe(4);
		expect(wordCount('Wo? – Hier!')).toBe(2);
	});
});
