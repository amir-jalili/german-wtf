import { describe, expect, it } from 'vitest';
import type { CatalogueEntry } from '../content/schema';
import {
	createScheduler,
	Grade,
	newPointCard,
	recordMistake,
	reviewPointCard
} from '../scheduler/index';
import { buildMap, matchesSearch, searchKey } from './map';

const s = createScheduler();
const T0 = new Date('2026-11-01T08:00:00.000Z');
const NOW = new Date('2026-11-17T08:00:00.000Z');

const entry = (
	id: string,
	itemCount: number,
	prerequisites: string[] = [],
	de = id
): CatalogueEntry & { itemCount: number } =>
	({
		id,
		title: { en: id, de },
		level: 'A2',
		family: 'cases',
		prerequisites,
		compareWith: [],
		itemCount
	}) as CatalogueEntry & { itemCount: number };

describe('buildMap', () => {
	const catalogue = [
		entry('a', 10),
		entry('b', 10, ['a', 'no-content']),
		entry('no-content', 0),
		entry('c', 5, ['a'])
	];
	const reviewedA = reviewPointCard(s, newPointCard(s, 'a', 'form', T0), Grade.Good, T0).card;

	it('marks content, mastery, due counts and unmet prerequisites', () => {
		const mistake = recordMistake(s, undefined, 'a', 'case', T0).card;
		const map = buildMap(catalogue, [reviewedA], [mistake], NOW);
		const byId = new Map(map.map((m) => [m.entry.id, m]));
		expect(byId.get('a')).toMatchObject({
			ready: true,
			mastery: 'familiar',
			due: 2,
			missingPrerequisites: []
		});
		expect(byId.get('no-content')).toMatchObject({ ready: false, mastery: 'new', due: 0 });
		// 'a' is started, the other prerequisite has no content → nothing missing
		expect(byId.get('b')!.missingPrerequisites).toEqual([]);
	});

	it('lists prerequisites with content that were never practised', () => {
		const map = buildMap(catalogue, [], [], NOW);
		expect(map.find((m) => m.entry.id === 'b')!.missingPrerequisites).toEqual(['a']);
		expect(map.every((m) => m.due === 0 && m.mastery === 'new')).toBe(true);
	});

	it('ignores resolved mistakes and cards not yet due', () => {
		const mistake = { ...recordMistake(s, undefined, 'a', 'case', T0).card, resolvedAt: T0 };
		const map = buildMap(catalogue, [reviewedA], [mistake], T0);
		expect(map[0]!.due).toBe(0);
	});
});

describe('search', () => {
	const point = entry('two-way-prepositions', 18, [], 'Wechselpräpositionen');
	it.each([
		['', true],
		['wechsel', true],
		['WECHSELPRAPOSITIONEN', true],
		['wechselpraepositionen', true],
		['two way', true],
		['cases', true],
		['genitiv', false],
		['wechsel genitiv', false]
	])('%j → %s', (q, hit) => expect(matchesSearch(point, q)).toBe(hit));
	it('folds ß and umlauts both ways', () => {
		expect(searchKey('Straße über')).toBe(searchKey('strasse uber'));
		expect(searchKey('Präteritum')).toBe(searchKey('Praeteritum'));
	});
});
