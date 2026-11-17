import { describe, expect, it } from 'vitest';
import {
	createScheduler,
	Grade,
	isOpenMistake,
	mistakeKey,
	needsScaffold,
	newPointCard,
	parseMistakeKey,
	recordMistake,
	reviewMistakeCard,
	reviewPointCard,
	type MistakeCard,
	type PointCard
} from './index';

const s = createScheduler();
const T0 = new Date('2026-11-17T08:00:00.000Z');

describe('mistake keys', () => {
	it('round-trip point × error tag', () => {
		const key = mistakeKey('dative-articles', 'case');
		expect(key).toBe('mistake:dative-articles:case');
		expect(parseMistakeKey(key)).toEqual({ pointId: 'dative-articles', errorTag: 'case' });
	});
	it('reject unknown tags and other keys', () => {
		expect(parseMistakeKey('mistake:dative-articles:banana')).toBeUndefined();
		expect(parseMistakeKey('dative-articles:form')).toBeUndefined();
	});
});

describe('mistake cards', () => {
	it('the first wrong answer creates an open card that is due again soon', () => {
		const { card } = recordMistake(s, undefined, 'dative-articles', 'case', T0);
		expect(card.key).toBe('mistake:dative-articles:case');
		expect(card.createdAt).toEqual(T0);
		expect(card.fsrs.reps).toBe(1);
		expect(card.fsrs.dueAt.getTime() - T0.getTime()).toBeLessThan(86_400_000);
		expect(isOpenMistake(card)).toBe(true);
	});

	/** Reviews Good at each due date until resolved (or `max` reviews). */
	function reviewUntilResolved(start: MistakeCard, max = 20) {
		let card = start;
		const streaks: number[] = [];
		for (let i = 0; i < max && !card.resolvedAt; i++) {
			const result = reviewMistakeCard(s, card, Grade.Good, card.fsrs.dueAt);
			card = result.card;
			streaks.push(card.correctStreak);
			if (result.events.resolved) expect(card.resolvedAt).toEqual(card.fsrs.lastReviewAt);
		}
		return { card, streaks };
	}

	it('resolves only after ≥ 3 consecutive correct reviews and stability ≥ 21 days', () => {
		const { card: start } = recordMistake(s, undefined, 'p', 'case', T0);
		const { card, streaks } = reviewUntilResolved(start);
		expect(card.resolvedAt).toBeDefined();
		expect(card.correctStreak).toBeGreaterThanOrEqual(3);
		expect(card.fsrs.stability).toBeGreaterThanOrEqual(21);
		expect(streaks).toEqual(streaks.map((_, i) => i + 1));
		expect(isOpenMistake(card)).toBe(false);
	});

	it('a wrong review resets the streak', () => {
		let { card } = recordMistake(s, undefined, 'p', 'case', T0);
		card = reviewMistakeCard(s, card, Grade.Good, card.fsrs.dueAt).card;
		card = reviewMistakeCard(s, card, Grade.Hard, card.fsrs.dueAt).card; // near-miss counts
		expect(card.correctStreak).toBe(2);
		card = reviewMistakeCard(s, card, Grade.Again, card.fsrs.dueAt).card;
		expect(card.correctStreak).toBe(0);
	});

	it('a new wrong answer re-opens a resolved card and keeps its history', () => {
		const { card: start } = recordMistake(s, undefined, 'p', 'case', T0);
		const { card: resolved } = reviewUntilResolved(start);
		const later = new Date(resolved.fsrs.dueAt.getTime() + 86_400_000);
		const { card } = recordMistake(s, resolved, 'p', 'case', later);
		expect(isOpenMistake(card)).toBe(true);
		expect(card.correctStreak).toBe(0);
		expect(card.createdAt).toEqual(T0);
		expect(card.fsrs.reps).toBe(resolved.fsrs.reps + 1);
		expect(card.fsrs.lapses).toBe(resolved.fsrs.lapses + 1);
	});
});

describe('leeches', () => {
	/** Alternates Good (to graduate) and Again (a lapse) until `lapses` lapses. */
	function lapse(card: PointCard, lapses: number) {
		const flags: number[] = [];
		let now = T0;
		while (card.fsrs.lapses < lapses) {
			for (const grade of [Grade.Good, Grade.Good, Grade.Again]) {
				const r = reviewPointCard(s, card, grade, now);
				card = r.card;
				if (r.events.becameLeech) flags.push(card.fsrs.lapses);
				now = card.fsrs.dueAt;
			}
		}
		return { card, flags, now };
	}

	it('flags a point card at 6 lapses, then again every 3', () => {
		const { card, flags } = lapse(newPointCard(s, 'p', 'form', T0), 9);
		expect(flags).toEqual([6, 9]);
		expect(card.leech?.lapsesAtFlag).toBe(9);
	});

	it('is not a leech below 6 lapses', () => {
		const { card, flags } = lapse(newPointCard(s, 'p', 'form', T0), 5);
		expect(flags).toEqual([]);
		expect(card.leech).toBeUndefined();
		expect(needsScaffold(card)).toBe(false);
	});

	it('scaffolds exactly the next 3 reviews after the flag', () => {
		let { card, now } = lapse(newPointCard(s, 'p', 'form', T0), 6);
		const scaffolded: boolean[] = [];
		for (let i = 0; i < 4; i++) {
			scaffolded.push(needsScaffold(card));
			card = reviewPointCard(s, card, Grade.Good, now).card;
			now = card.fsrs.dueAt;
		}
		expect(scaffolded).toEqual([true, true, true, false]);
		expect(card.leech).toBeDefined(); // the flag stays as history
	});

	it('mistake cards become leeches too', () => {
		let card: MistakeCard | undefined;
		let flagged = false;
		let now = T0;
		for (let i = 0; i < 8 && !flagged; i++) {
			const r = recordMistake(s, card, 'p', 'case', now);
			card = r.card;
			flagged = r.events.becameLeech;
			card = reviewMistakeCard(s, card, Grade.Good, card.fsrs.dueAt).card;
			card = reviewMistakeCard(s, card, Grade.Good, card.fsrs.dueAt).card;
			now = card.fsrs.dueAt;
		}
		expect(flagged).toBe(true);
		expect(card!.fsrs.lapses).toBeGreaterThanOrEqual(6);
	});

	it('never mutates its inputs', () => {
		const card = newPointCard(s, 'p', 'form', T0);
		const before = JSON.stringify(card);
		reviewPointCard(s, card, Grade.Again, T0);
		expect(JSON.stringify(card)).toBe(before);
	});
});
