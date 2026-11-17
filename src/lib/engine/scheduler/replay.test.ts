import { describe, expect, it } from 'vitest';
import {
	createScheduler,
	Grade,
	gradeForSitting,
	groupIntoSittings,
	replayAnswers,
	type AnswerRecord
} from './index';

const s = createScheduler();
const T0 = Date.parse('2026-11-17T08:00:00.000Z');
const MIN = 60_000;
const DAY = 86_400_000;

const answer = (over: Partial<AnswerRecord> & { timestamp: number }): AnswerRecord => ({
	itemId: 'dative-articles/001',
	pointId: 'dative-articles',
	cardKey: 'dative-articles:form',
	verdict: 'correct',
	ms: 5000,
	...over
});

describe('gradeForSitting', () => {
	const { Again: A, Hard: H, Good: G, Easy: E } = Grade;
	it.each([
		[[], undefined],
		[[G, G, G], G],
		[[E, E], E],
		[[E, G], G],
		[[G, H, G], H],
		[[G, G, G, A], H], // 25 % wrong
		[[G, G, A, A], A], // 50 % wrong
		[[A], A]
	])('%o → %s', (grades, expected) => expect(gradeForSitting(grades)).toBe(expected));
});

describe('groupIntoSittings', () => {
	it('groups answers to one card within 30 minutes; a longer gap starts a new sitting', () => {
		const sittings = groupIntoSittings([
			answer({ timestamp: T0 }),
			answer({ timestamp: T0 + 10 * MIN }),
			answer({ timestamp: T0 + 35 * MIN }), // 25 min after the previous → same sitting
			answer({ timestamp: T0 + 70 * MIN }) // 35 min gap → new
		]);
		expect(sittings.map((x) => x.grades.length)).toEqual([3, 1]);
		expect(sittings[0]!.at).toBe(T0 + 35 * MIN);
	});
	it('keeps different cards apart and sorts unsorted input', () => {
		const sittings = groupIntoSittings([
			answer({ timestamp: T0 + MIN, cardKey: 'weil:syntax', pointId: 'weil' }),
			answer({ timestamp: T0 })
		]);
		expect(sittings.map((x) => x.cardKey)).toEqual(['dative-articles:form', 'weil:syntax']);
	});
	it('rates a fast answer Easy using the same item’s earlier timings', () => {
		const slow = [0, 1, 2].map((d) => answer({ timestamp: T0 + d * DAY, ms: 10_000 }));
		const sittings = groupIntoSittings([...slow, answer({ timestamp: T0 + 3 * DAY, ms: 1000 })]);
		expect(sittings.at(-1)!.grades).toEqual([Grade.Easy]);
	});
});

describe('replayAnswers', () => {
	it('one practice session of 10 answers is one review per card', () => {
		const answers = Array.from({ length: 10 }, (_, i) =>
			answer({ timestamp: T0 + i * MIN, itemId: `dative-articles/${i}` })
		);
		const { cards, mistakeCards } = replayAnswers(s, answers);
		expect(cards).toHaveLength(1);
		expect(cards[0]!.key).toBe('dative-articles:form');
		expect(cards[0]!.fsrs.reps).toBe(1);
		expect(cards[0]!.fsrs.lastReviewAt).toEqual(new Date(T0 + 9 * MIN));
		expect(mistakeCards).toEqual([]);
	});

	it('sessions on different days build up stability', () => {
		const one = replayAnswers(s, [answer({ timestamp: T0 })]).cards[0]!;
		const three = replayAnswers(
			s,
			[0, 2, 7].map((d) => answer({ timestamp: T0 + d * DAY }))
		).cards[0]!;
		expect(three.fsrs.reps).toBe(3);
		expect(three.fsrs.stability).toBeGreaterThan(one.fsrs.stability);
	});

	it('wrong answers with error tags create mistake cards, one per point × tag', () => {
		const { mistakeCards } = replayAnswers(s, [
			answer({ timestamp: T0, verdict: 'wrong', errorTags: ['case', 'article-form'] }),
			answer({ timestamp: T0 + MIN, verdict: 'wrong', errorTags: ['case'] }),
			answer({ timestamp: T0 + 2 * MIN, verdict: 'wrong' }) // old entry without tags
		]);
		expect(mistakeCards.map((c) => [c.key, c.fsrs.reps]).sort()).toEqual([
			['mistake:dative-articles:article-form', 1],
			['mistake:dative-articles:case', 2]
		]);
	});

	it('skips entries with unknown card keys', () => {
		expect(replayAnswers(s, [answer({ timestamp: T0, cardKey: 'broken' })]).cards).toEqual([]);
	});

	it('is deterministic', () => {
		const answers = [0, 1, 3].map((d) => answer({ timestamp: T0 + d * DAY }));
		expect(JSON.stringify(replayAnswers(s, answers))).toBe(
			JSON.stringify(replayAnswers(s, answers))
		);
	});
});
