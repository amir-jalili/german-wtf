import { describe, expect, it } from 'vitest';
import { ItemSchema, type CatalogueEntry, type Item, type Skill } from '../content/schema';
import {
	createScheduler,
	Grade,
	newPointCard,
	recordMistake,
	reviewPointCard,
	type MistakeCard,
	type PointCard
} from '../scheduler/index';
import { mulberry32 } from '../util/rng';
import {
	allowedNeighbours,
	buildDailySession,
	capacityFor,
	interleave,
	pickFreshItem,
	type SessionInput,
	type SessionStep
} from './daily';

const s = createScheduler();
const NOW = new Date('2026-11-17T08:00:00.000Z');
const DAY = 86_400_000;

function item(
	pointId: string,
	n: number,
	skill: Skill = 'form',
	tags: Item['errorTags'] = ['case']
): Item {
	return ItemSchema.parse({
		id: `${pointId}/${String(n).padStart(3, '0')}`,
		type: 'cloze',
		level: 'A2',
		skill,
		text: 'Ich sehe {{den}} Hund.',
		accepted: ['den'],
		explanation: 'x',
		errorTags: tags,
		review: { status: 'verified', by: 'c', date: '2026-11-17' },
		source: 'original'
	});
}

function entry(id: string, prerequisites: string[] = []): CatalogueEntry {
	return {
		id,
		title: { en: id, de: id },
		level: 'A2',
		family: 'cases',
		prerequisites,
		compareWith: []
	} as CatalogueEntry;
}

/** A point card reviewed Good once at `reviewedDaysAgo`, due according to FSRS. */
function reviewed(pointId: string, reviewedDaysAgo: number, skill: Skill = 'form'): PointCard {
	const at = new Date(NOW.getTime() - reviewedDaysAgo * DAY);
	return reviewPointCard(s, newPointCard(s, pointId, skill, at), Grade.Good, at).card;
}

function input(over: Partial<SessionInput> = {}): SessionInput {
	return {
		now: NOW,
		catalogue: [],
		itemsByPoint: new Map(),
		cards: [],
		mistakeCards: [],
		lastSeen: new Map(),
		recentItemIds: [],
		minutes: 10,
		newPerDay: 1,
		newToday: 0,
		rng: mulberry32(1),
		...over
	};
}

const items = (pointId: string, n: number) =>
	Array.from({ length: n }, (_, i) => item(pointId, i + 1));

describe('capacityFor', () => {
	it('fits whole items into the budget', () => {
		expect(capacityFor(10)).toBe(20);
		expect(capacityFor(15, 45)).toBe(20);
		expect(capacityFor(0)).toBe(0);
	});
});

describe('pickFreshItem', () => {
	const pool = items('p', 4);
	it('avoids recent and used items, then prefers the least recently seen', () => {
		const lastSeen = new Map([
			['p/001', 300],
			['p/002', 100],
			['p/003', 200]
		]);
		const pick = (used: string[], recent: string[]) =>
			pickFreshItem(pool, new Set(used), new Set(recent), lastSeen, mulberry32(3))?.id;
		expect(pick([], [])).toBe('p/004'); // never seen
		expect(pick(['p/004'], [])).toBe('p/002');
		expect(pick(['p/004'], ['p/002'])).toBe('p/003');
		// all recent → still serves the least recently seen unused one
		expect(pick(['p/004'], ['p/001', 'p/002', 'p/003'])).toBe('p/002');
		expect(pick(['p/001', 'p/002', 'p/003', 'p/004'], [])).toBeUndefined();
	});
});

describe('buildDailySession', () => {
	const catalogue = ['a', 'b', 'c', 'd', 'e'].map((id) => entry(id));
	const itemsByPoint = new Map(catalogue.map((e) => [e.id, items(e.id, 12)]));

	it('takes due cards first, most overdue first, and leaves overflow due', () => {
		const cards = [reviewed('a', 30), reviewed('b', 60), reviewed('c', 45), reviewed('d', 0)];
		const plan = buildDailySession(
			input({ catalogue, itemsByPoint, cards, minutes: 1, newPerDay: 3 }) // capacity 2
		);
		expect(plan.steps.map((x) => x.pointId).sort()).toEqual(['b', 'c']);
		expect(plan.overflow.due).toBe(1); // 'a' did not fit; 'd' isn't due yet
		expect(plan.counts).toEqual({ due: 2, mistakes: 0, newPoints: 0 });
	});

	it('serves due mistake cards after due cards, with an item that trains that tag', () => {
		const tagged = new Map([
			['a', [item('a', 1, 'form', ['case']), item('a', 2, 'form', ['adj-ending'])]]
		]);
		const mistake: MistakeCard = recordMistake(
			s,
			undefined,
			'a',
			'adj-ending',
			new Date(NOW.getTime() - DAY)
		).card;
		const plan = buildDailySession(
			input({
				catalogue: [entry('a')],
				itemsByPoint: tagged,
				cards: [reviewed('a', 0)],
				mistakeCards: [mistake]
			})
		);
		expect(plan.steps).toHaveLength(1);
		expect(plan.steps[0]).toMatchObject({
			source: 'mistake',
			mistakeKey: 'mistake:a:adj-ending',
			cardKey: 'a:form'
		});
		expect(plan.steps[0]!.item.id).toBe('a/002');
	});

	it('ignores resolved mistake cards', () => {
		const m = recordMistake(s, undefined, 'a', 'case', new Date(NOW.getTime() - DAY)).card;
		const plan = buildDailySession(
			input({
				catalogue: [entry('a')],
				itemsByPoint,
				cards: [reviewed('a', 0)],
				mistakeCards: [{ ...m, resolvedAt: NOW }]
			})
		);
		expect(plan.steps).toEqual([]);
	});

	it('introduces new points in catalogue order within the quota, as a block of 3', () => {
		const plan = buildDailySession(input({ catalogue, itemsByPoint, newPerDay: 2 }));
		expect(plan.steps.map((x) => x.pointId)).toEqual(['a', 'a', 'a', 'b', 'b', 'b']);
		expect(plan.steps.every((x) => x.source === 'new')).toBe(true);
		expect(plan.counts.newPoints).toBe(2);
		expect(
			buildDailySession(input({ catalogue, itemsByPoint, newPerDay: 2, newToday: 2 })).steps
		).toEqual([]);
	});

	it('skips points without content and respects prerequisites that have content', () => {
		const cat = [entry('x'), entry('b', ['a']), entry('a'), entry('c', ['no-content'])];
		const byPoint = new Map([
			['a', items('a', 5)],
			['b', items('b', 5)],
			['c', items('c', 5)]
		]);
		const plan = buildDailySession(input({ catalogue: cat, itemsByPoint: byPoint, newPerDay: 3 }));
		// x has no items; b waits for a; c's prerequisite has no content so it doesn't block
		expect([...new Set(plan.steps.map((x) => x.pointId))]).toEqual(['a', 'c']);
		const later = buildDailySession(
			input({ catalogue: cat, itemsByPoint: byPoint, newPerDay: 3, cards: [reviewed('a', 0)] })
		);
		expect([...new Set(later.steps.map((x) => x.pointId))]).toEqual(['b', 'c']);
	});

	it('marks leech cards for the scaffolded version', () => {
		const card = {
			...reviewed('a', 30),
			leech: { flaggedAt: NOW, lapsesAtFlag: 6, scaffoldLeft: 2 }
		};
		const plan = buildDailySession(input({ catalogue, itemsByPoint, cards: [card], newPerDay: 0 }));
		expect(plan.steps[0]?.scaffold).toBe(true);
	});

	it('does not serve items answered recently when fresh ones exist', () => {
		const pool = new Map([['a', items('a', 3)]]);
		const plan = buildDailySession(
			input({
				catalogue: [entry('a')],
				itemsByPoint: pool,
				cards: [reviewed('a', 30)],
				recentItemIds: ['a/001', 'a/002']
			})
		);
		expect(plan.steps.map((x) => x.item.id)).toEqual(['a/003']);
	});
});

describe('session properties (random inputs)', () => {
	function randomInput(seed: number): SessionInput {
		const rng = mulberry32(seed);
		const nPoints = 2 + Math.floor(rng() * 8);
		const catalogue = Array.from({ length: nPoints }, (_, i) =>
			entry(`p${i}`, i > 0 && rng() < 0.3 ? [`p${i - 1}`] : [])
		);
		const itemsByPoint = new Map(
			catalogue.map((e) => [
				e.id,
				Array.from({ length: Math.floor(rng() * 6) }, (_, k) =>
					item(e.id, k + 1, rng() < 0.7 ? 'form' : 'syntax', [rng() < 0.5 ? 'case' : 'adj-ending'])
				)
			])
		);
		const cards = catalogue
			.filter(() => rng() < 0.6)
			.map((e) => reviewed(e.id, Math.floor(rng() * 40), rng() < 0.7 ? 'form' : 'syntax'));
		const mistakeCards = cards
			.filter(() => rng() < 0.4)
			.map(
				(c) =>
					recordMistake(
						s,
						undefined,
						c.pointId,
						rng() < 0.5 ? 'case' : 'adj-ending',
						new Date(NOW.getTime() - Math.floor(rng() * 5) * DAY)
					).card
			);
		const allIds = [...itemsByPoint.values()].flat().map((i) => i.id);
		return input({
			catalogue,
			itemsByPoint,
			cards,
			mistakeCards,
			recentItemIds: allIds.filter(() => rng() < 0.3),
			minutes: 1 + Math.floor(rng() * 15),
			newPerDay: Math.floor(rng() * 4),
			rng
		});
	}

	it.each(Array.from({ length: 200 }, (_, i) => i + 1))(
		'seed %i: budget, no repeats, interleaving',
		(seed) => {
			const inp = randomInput(seed);
			const plan = buildDailySession(inp);
			const { steps } = plan;
			// budget respected
			expect(steps.length).toBeLessThanOrEqual(capacityFor(inp.minutes));
			// no item twice in a session (so never twice in a row)
			expect(new Set(steps.map((x) => x.item.id)).size).toBe(steps.length);
			// every step's item belongs to its point; mistake items train the tag
			for (const st of steps) {
				expect(st.item.id.startsWith(`${st.pointId}/`)).toBe(true);
				expect(st.cardKey).toBe(`${st.pointId}:${st.item.skill}`);
				if (st.mistakeKey) expect(st.item.errorTags).toContain(st.mistakeKey.split(':')[2]);
			}
			// two reviews of the same point are adjacent only if no other ordering could avoid it
			const reviews = steps.filter((x) => x.source !== 'new');
			const perPoint = new Map<string, number>();
			for (const r of reviews) perPoint.set(r.pointId, (perPoint.get(r.pointId) ?? 0) + 1);
			const maxShare = Math.max(0, ...perPoint.values());
			const avoidable = maxShare <= reviews.length - maxShare + 1;
			if (avoidable) {
				for (let i = 1; i < steps.length; i++)
					expect(allowedNeighbours(steps[i - 1]!, steps[i]!)).toBe(true);
			}
			// new-point quota
			expect(plan.counts.newPoints).toBeLessThanOrEqual(Math.max(0, inp.newPerDay - inp.newToday));
		}
	);
});

describe('interleave', () => {
	const step = (
		pointId: string,
		n: number,
		source: SessionStep['source'] = 'due'
	): SessionStep => ({
		item: item(pointId, n),
		pointId,
		source,
		cardKey: `${pointId}:form`
	});
	it('spreads reviews and keeps new blocks together at the end', () => {
		const out = interleave([
			step('a', 1),
			step('a', 2),
			step('b', 1),
			step('n', 1, 'new'),
			step('n', 2, 'new')
		]);
		expect(out.map((x) => x.pointId)).toEqual(['a', 'b', 'a', 'n', 'n']);
	});
});
