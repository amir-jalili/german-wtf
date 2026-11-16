import { describe, expect, expectTypeOf, it } from 'vitest';
import {
	CatalogueSchema,
	ChoiceItemSchema,
	ClozeItemSchema,
	GrammarPointSchema,
	ItemSchema,
	OrderItemSchema,
	type ClozeItem,
	type GrammarPoint,
	type Item
} from './schema';

const review = { status: 'verified', by: 'claude-blind-solve', date: '2026-11-17' } as const;

const baseItem = {
	id: 'adj-endings-definite/001',
	level: 'A2',
	skill: 'form',
	explanation: 'Dativ after the definite article → always -en.',
	errorTags: ['adj-ending'],
	review,
	source: 'original'
} as const;

describe('item schemas', () => {
	it('parses a single-gap cloze and normalises accepted to string[][]', () => {
		const item = ClozeItemSchema.parse({
			...baseItem,
			type: 'cloze',
			text: 'Ich helfe dem {{alten}} Mann.',
			hint: '(alt)',
			accepted: ['alten']
		});
		expect(item.accepted).toEqual([['alten']]);
		expect(item.audio).toBe(true);
		expect(item.retired).toBe(false);
	});

	it('parses a multi-gap cloze with one accepted list per gap', () => {
		const item = ClozeItemSchema.parse({
			...baseItem,
			type: 'cloze',
			text: 'Gestern {{bin}} ich nach Berlin {{gefahren}}.',
			accepted: [['bin'], ['gefahren']]
		});
		expect(item.accepted).toEqual([['bin'], ['gefahren']]);
	});

	it('rejects a cloze without a gap or with an empty accepted list', () => {
		expect(() =>
			ClozeItemSchema.parse({ ...baseItem, type: 'cloze', text: 'Kein Gap.', accepted: ['x'] })
		).toThrow(/gap/);
		expect(() =>
			ClozeItemSchema.parse({ ...baseItem, type: 'cloze', text: 'Ein {{x}}.', accepted: [] })
		).toThrow();
	});

	it('parses a choice item', () => {
		const item = ChoiceItemSchema.parse({
			...baseItem,
			type: 'choice',
			text: 'Wir wohnen in ___ Stadt.',
			options: ['der', 'die', 'dem', 'den'],
			answer: 'der'
		});
		expect(item.options).toHaveLength(4);
	});

	it('parses an order item with Feldermodell fields', () => {
		const item = OrderItemSchema.parse({
			...baseItem,
			type: 'order',
			prefix: 'Ich komme heute nicht, ',
			tiles: ['weil', 'ich', 'morgen', 'arbeiten', 'muss'],
			accepted: ['weil ich morgen arbeiten muss'],
			fields: { connector: 'weil', mittelfeld: 'ich morgen', rightBracket: 'arbeiten muss' }
		});
		expect(item.fields?.connector).toBe('weil');
	});

	it('rejects unknown item types, bad ids, unknown error tags and bad dates', () => {
		expect(() => ItemSchema.parse({ ...baseItem, type: 'dictation', text: 'x' })).toThrow();
		expect(() =>
			ItemSchema.parse({
				...baseItem,
				id: 'Bad_Id',
				type: 'choice',
				text: 'x',
				options: ['a', 'b'],
				answer: 'a'
			})
		).toThrow(/item id/);
		expect(() =>
			ItemSchema.parse({
				...baseItem,
				errorTags: ['typo'],
				type: 'choice',
				text: 'x',
				options: ['a', 'b'],
				answer: 'a'
			})
		).toThrow();
		expect(() =>
			ItemSchema.parse({
				...baseItem,
				review: { ...review, date: '17.11.2026' },
				type: 'choice',
				text: 'x',
				options: ['a', 'b'],
				answer: 'a'
			})
		).toThrow(/YYYY-MM-DD/);
	});

	it('accepts tatoeba and book sources, and an origin block', () => {
		const parsed = ItemSchema.parse({
			...baseItem,
			source: 'tatoeba:12345',
			type: 'choice',
			text: 'x',
			options: ['a', 'b'],
			answer: 'a'
		});
		expect(parsed.source).toBe('tatoeba:12345');
		const book = ItemSchema.parse({
			...baseItem,
			source: 'book-variant',
			origin: { book: 'Grammatik aktiv B2-C1', chapter: '12', exercise: 'Ü3', mode: 'variant' },
			type: 'choice',
			text: 'x',
			options: ['a', 'b'],
			answer: 'a'
		});
		expect(book.origin?.mode).toBe('variant');
		expect(() =>
			ItemSchema.parse({
				...baseItem,
				source: 'wikipedia',
				type: 'choice',
				text: 'x',
				options: ['a', 'b'],
				answer: 'a'
			})
		).toThrow();
	});
});

describe('grammar point and catalogue schemas', () => {
	const point = {
		id: 'adj-endings-definite',
		title: {
			en: 'Adjective endings after the definite article',
			de: 'Adjektivdeklination nach bestimmtem Artikel'
		},
		level: 'A2',
		family: 'adjectives',
		prerequisites: ['dative-articles'],
		compareWith: ['adj-endings-indefinite'],
		version: 1,
		lesson: {
			summary: 'After der/die/das the adjective only takes -e or -en.',
			rule: 'Weak endings …',
			table: {
				columns: ['m', 'f', 'n', 'pl'],
				rows: { nom: ['der alte Mann', 'die alte Frau', 'das alte Haus', 'die alten Häuser'] }
			},
			examples: [
				{
					de: 'Ich helfe dem alten Mann.',
					en: 'I help the old man.',
					xray: [{ text: 'dem alten Mann', role: 'dat-obj', case: 'dat', gender: 'm' }]
				}
			],
			pitfalls: ['Akkusativ masculine is -en.']
		},
		items: [
			{ ...baseItem, type: 'cloze', text: 'Ich helfe dem {{alten}} Mann.', accepted: ['alten'] }
		]
	};

	it('parses a full grammar point with defaults', () => {
		const parsed = GrammarPointSchema.parse(point);
		expect(parsed.generators).toEqual([]);
		expect(parsed.items[0]?.type).toBe('cloze');
		expect(parsed.lesson.examples[0]?.xray[0]?.case).toBe('dat');
	});

	it('rejects a point without a lesson or with an unknown family', () => {
		expect(() => GrammarPointSchema.parse({ ...point, lesson: undefined })).toThrow();
		expect(() => GrammarPointSchema.parse({ ...point, family: 'misc' })).toThrow();
	});

	it('parses a catalogue and requires the schema version', () => {
		const catalogue = CatalogueSchema.parse({
			schemaVersion: 1,
			points: [
				{
					id: 'noun-gender-articles',
					title: { en: 'Gender and articles', de: 'Genus und Artikel' },
					level: 'A1',
					family: 'articles'
				}
			]
		});
		expect(catalogue.points[0]?.prerequisites).toEqual([]);
		expect(() => CatalogueSchema.parse({ schemaVersion: 2, points: catalogue.points })).toThrow();
	});

	it('infers the expected TypeScript types', () => {
		expectTypeOf<ClozeItem['accepted']>().toEqualTypeOf<string[][]>();
		expectTypeOf<Item['type']>().toEqualTypeOf<'cloze' | 'choice' | 'order'>();
		expectTypeOf<GrammarPoint['level']>().toEqualTypeOf<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>();
		expect(true).toBe(true);
	});
});
