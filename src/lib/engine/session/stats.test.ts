import { describe, expect, it } from 'vitest';
import type { CatalogueEntry } from '../content/schema';
import {
	createScheduler,
	Grade,
	newPointCard,
	recordMistake,
	reviewPointCard
} from '../scheduler/index';
import {
	accuracyByFamily,
	addDays,
	dayStart,
	forecast,
	heatmap,
	masteryByLevel,
	streak,
	weakest,
	type StatAnswer
} from './stats';

const s = createScheduler();
// Wednesday 18 Nov 2026, local time
const NOW = new Date(2026, 10, 18, 15, 0);
const at = (daysAgo: number, hour = 10) => {
	const d = new Date(NOW);
	d.setDate(d.getDate() - daysAgo);
	d.setHours(hour, 0, 0, 0);
	return d.getTime();
};
const ans = (
	daysAgo: number,
	verdict: StatAnswer['verdict'] = 'correct',
	pointId = 'a'
): StatAnswer => ({
	pointId,
	verdict,
	timestamp: at(daysAgo)
});

const entry = (id: string, family: string, level = 'A2', itemCount = 5) =>
	({
		id,
		title: { en: id, de: id },
		level,
		family,
		prerequisites: [],
		compareWith: [],
		itemCount
	}) as unknown as CatalogueEntry & { itemCount: number };

describe('heatmap', () => {
	it('covers 12 full weeks starting on a Monday and counts answers per local day', () => {
		const grid = heatmap([ans(0), ans(0), ans(1), ans(200)], NOW);
		expect(grid).toHaveLength(84);
		expect(new Date(grid[0]!.day).getDay()).toBe(1); // Monday
		expect(grid.find((d) => d.day === dayStart(NOW))!.count).toBe(2);
		expect(grid.find((d) => d.day === dayStart(at(1)))!.count).toBe(1);
		expect(grid.reduce((n, d) => n + d.count, 0)).toBe(3); // 200 days ago is outside
		// the last week runs to Sunday, so future days are in the grid with 0
		expect(new Date(grid.at(-1)!.day).getDay()).toBe(0);
	});
	it('addDays survives the DST change', () => {
		const before = dayStart(new Date(2026, 2, 28));
		expect(new Date(addDays(before, 2)).getDate()).toBe(30);
	});
});

describe('streak', () => {
	it('counts consecutive days ending today', () =>
		expect(streak([ans(0), ans(1), ans(2), ans(4)], NOW)).toBe(3));
	it('still counts when today is not done yet', () =>
		expect(streak([ans(1), ans(2)], NOW)).toBe(2));
	it('is 0 after a missed day', () => expect(streak([ans(2), ans(3)], NOW)).toBe(0));
	it('several answers on one day count once', () => expect(streak([ans(0), ans(0)], NOW)).toBe(1));
});

describe('accuracyByFamily', () => {
	it('near-misses count as correct; weakest family first', () => {
		const result = accuracyByFamily(
			[
				ans(0, 'correct', 'a'),
				ans(0, 'near-miss', 'a'),
				ans(0, 'wrong', 'b'),
				ans(0, 'correct', 'b'),
				ans(0, 'correct', 'zzz')
			],
			[entry('a', 'cases'), entry('b', 'clauses')]
		);
		expect(result).toEqual([
			{ family: 'clauses', answers: 2, accuracy: 0.5 },
			{ family: 'cases', answers: 2, accuracy: 1 }
		]);
	});
});

describe('masteryByLevel', () => {
	it('counts points with content per level and mastery', () => {
		const card = reviewPointCard(s, newPointCard(s, 'a', 'form', NOW), Grade.Good, NOW).card;
		const result = masteryByLevel(
			[
				entry('a', 'cases'),
				entry('b', 'cases'),
				entry('c', 'cases', 'B1'),
				entry('x', 'cases', 'A2', 0)
			],
			[card]
		);
		expect(result.get('A2')).toEqual({ new: 1, learning: 0, familiar: 1, strong: 0, mastered: 0 });
		expect(result.get('B1')!.new).toBe(1);
	});
});

describe('forecast', () => {
	it('puts overdue reviews on today and ignores resolved mistakes', () => {
		const past = new Date(at(5));
		const overdue = reviewPointCard(s, newPointCard(s, 'a', 'form', past), Grade.Good, past).card;
		const fresh = reviewPointCard(s, newPointCard(s, 'b', 'form', NOW), Grade.Good, NOW).card;
		const mistake = recordMistake(s, undefined, 'a', 'case', NOW).card;
		const days = forecast(
			[overdue, fresh],
			[mistake, { ...mistake, key: 'mistake:a:gender', resolvedAt: NOW }],
			NOW
		);
		expect(days).toHaveLength(7);
		expect(days[0]!.count).toBe(2); // overdue + the mistake (due in minutes)
		const freshDay = Math.round((dayStart(fresh.fsrs.dueAt) - dayStart(NOW)) / 86_400_000);
		expect(days[freshDay]!.count).toBeGreaterThanOrEqual(1);
	});
});

describe('weakest', () => {
	it('ranks started points by lowest recall of their skills', () => {
		const old = new Date(at(30));
		const a = reviewPointCard(s, newPointCard(s, 'a', 'form', old), Grade.Good, old).card;
		const b = reviewPointCard(s, newPointCard(s, 'b', 'form', NOW), Grade.Good, NOW).card;
		const unstarted = newPointCard(s, 'c', 'form', NOW);
		const result = weakest([b, a, unstarted], (c) => s.retrievability(c.fsrs, NOW));
		expect(result.map((w) => w.pointId)).toEqual(['a', 'b']);
		expect(result[0]!.recall).toBeLessThan(result[1]!.recall);
	});
});
