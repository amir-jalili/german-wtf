import { describe, expect, it } from 'vitest';
import {
	cardKey,
	clampRetention,
	createScheduler,
	Grade,
	gradeFromAnswer,
	isDue,
	masteryOf,
	median,
	parseCardKey,
	weakestMastery,
	type FsrsCard
} from './index';

const T0 = new Date('2026-11-17T08:00:00.000Z');
const DAY = 86_400_000;
const days = (card: FsrsCard, from: Date) => (card.dueAt.getTime() - from.getTime()) / DAY;

describe('card keys', () => {
	it('round-trip point × skill', () => {
		expect(cardKey('dative-articles', 'form')).toBe('dative-articles:form');
		expect(parseCardKey('dative-articles:form')).toEqual({
			pointId: 'dative-articles',
			skill: 'form'
		});
	});
	it('reject unknown skills and malformed keys', () => {
		expect(parseCardKey('dative-articles:spelling')).toBeUndefined();
		expect(parseCardKey(':form')).toBeUndefined();
		expect(parseCardKey('no-skill')).toBeUndefined();
	});
});

describe('gradeFromAnswer', () => {
	const timings = [10_000, 12_000, 8_000];
	it.each([
		[{ verdict: 'wrong', ms: 1000, previousMs: timings }, Grade.Again],
		[{ verdict: 'wrong', ms: 1000, guessed: true }, Grade.Again],
		[{ verdict: 'near-miss', ms: 1000, previousMs: timings }, Grade.Hard],
		[{ verdict: 'correct', ms: 9000, guessed: true }, Grade.Hard],
		[{ verdict: 'correct', ms: 9000, previousMs: timings }, Grade.Good],
		// median 10 s → Easy below 4 s
		[{ verdict: 'correct', ms: 3999, previousMs: timings }, Grade.Easy],
		[{ verdict: 'correct', ms: 4000, previousMs: timings }, Grade.Good],
		// not enough history for a trusted median
		[{ verdict: 'correct', ms: 100, previousMs: [10_000, 10_000] }, Grade.Good],
		[{ verdict: 'correct', ms: 100 }, Grade.Good]
	] as const)('%o → %i', (input, grade) => {
		expect(gradeFromAnswer(input)).toBe(grade);
	});
	it('median handles odd, even and empty lists', () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
		expect(median([])).toBeUndefined();
	});
});

describe('scheduler (fixed clock)', () => {
	const s = createScheduler();

	it('creates a new card keyed by the card key, due now', () => {
		const card = s.newCard('dative-articles:form', T0);
		expect(card.cardId).toBe('dative-articles:form');
		expect(card.reps).toBe(0);
		expect(isDue(card, T0)).toBe(true);
		expect(masteryOf(card)).toBe('new');
		expect(s.retrievability(card, T0)).toBe(0);
	});

	it('is deterministic: same history, same schedule (no fuzz)', () => {
		const run = () => {
			let card = s.newCard('k:form', T0);
			let now = T0;
			for (const g of [Grade.Good, Grade.Good, Grade.Hard, Grade.Good]) {
				card = s.review(card, g, now).card;
				now = card.dueAt;
			}
			return card.dueAt.toISOString();
		};
		expect(run()).toBe(run());
	});

	it('orders first intervals Again < Hard < Good < Easy and never mutates the input', () => {
		const card = s.newCard('k:form', T0);
		const before = JSON.stringify(card);
		const due = [Grade.Again, Grade.Hard, Grade.Good, Grade.Easy].map((g) =>
			days(s.review(card, g, T0).card, T0)
		);
		expect(JSON.stringify(card)).toBe(before);
		for (let i = 1; i < due.length; i++) expect(due[i]).toBeGreaterThan(due[i - 1]!);
		expect(due[0]).toBeLessThan(1); // Again comes back the same day
	});

	it('grows intervals with successful reviews and reaches mastery', () => {
		let card = s.newCard('k:form', T0);
		let now = T0;
		const intervals: number[] = [];
		for (let i = 0; i < 8; i++) {
			card = s.review(card, Grade.Good, now).card;
			intervals.push(days(card, now));
			now = card.dueAt;
		}
		const reviewIntervals = intervals.filter((d) => d >= 1);
		for (let i = 1; i < reviewIntervals.length; i++) {
			expect(reviewIntervals[i]).toBeGreaterThan(reviewIntervals[i - 1]!);
		}
		expect(masteryOf(card)).toBe('mastered');
		expect(isDue(card, new Date(card.dueAt.getTime() - 1))).toBe(false);
		expect(isDue(card, card.dueAt)).toBe(true);
	});

	it('a lapse counts, shortens the interval and lowers stability', () => {
		let card = s.newCard('k:form', T0);
		let now = T0;
		for (let i = 0; i < 4; i++) {
			card = s.review(card, Grade.Good, now).card;
			now = card.dueAt;
		}
		const lapsed = s.review(card, Grade.Again, now).card;
		expect(lapsed.lapses).toBe(1);
		expect(lapsed.stability).toBeLessThan(card.stability);
		expect(days(lapsed, now)).toBeLessThanOrEqual(1);
		expect(days(lapsed, now)).toBeLessThan(days(card, card.lastReviewAt!));
	});

	it('retrievability is ≈ target retention when the card falls due', () => {
		let card = s.newCard('k:form', T0);
		let now = T0;
		for (let i = 0; i < 4; i++) {
			card = s.review(card, Grade.Good, now).card;
			now = card.dueAt;
		}
		expect(s.retrievability(card, card.lastReviewAt!)).toBeCloseTo(1, 2);
		expect(s.retrievability(card, card.dueAt)).toBeCloseTo(0.9, 1);
	});

	it('higher target retention schedules sooner', () => {
		const at = (r: number) => {
			const sch = createScheduler(r);
			let card = sch.newCard('k:form', T0);
			let now = T0;
			for (let i = 0; i < 4; i++) {
				card = sch.review(card, Grade.Good, now).card;
				now = card.dueAt;
			}
			return days(card, card.lastReviewAt!);
		};
		expect(at(0.95)).toBeLessThan(at(0.9));
		expect(at(0.9)).toBeLessThan(at(0.8));
	});

	it('clamps the retention setting', () => {
		expect(clampRetention(0.5)).toBe(0.7);
		expect(clampRetention(0.99)).toBe(0.97);
		expect(clampRetention(Number.NaN)).toBe(0.9);
		expect(createScheduler(2).retention).toBe(0.97);
	});
});

describe('mastery', () => {
	it.each([
		[{ reps: 0, stability: 0 }, 'new'],
		[{ reps: 1, stability: 2.9 }, 'learning'],
		[{ reps: 2, stability: 3 }, 'familiar'],
		[{ reps: 3, stability: 20.9 }, 'familiar'],
		[{ reps: 4, stability: 21 }, 'strong'],
		[{ reps: 5, stability: 90 }, 'mastered']
	] as const)('%o → %s', (card, level) => expect(masteryOf(card)).toBe(level));
	it('a point is as strong as its weakest skill', () => {
		expect(weakestMastery(['mastered', 'learning', 'strong'])).toBe('learning');
		expect(weakestMastery([])).toBe('new');
	});
});
