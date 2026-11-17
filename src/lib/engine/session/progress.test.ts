import { describe, expect, it } from 'vitest';
import { ItemSchema } from '../content/schema';
import {
	createScheduler,
	Grade,
	newPointCard,
	recordMistake,
	reviewPointCard,
	type PointCard
} from '../scheduler/index';
import type { SessionStep } from './daily';
import { pointMastery, progressEvents, sessionProgress } from './progress';

const s = createScheduler();
const T0 = new Date('2026-11-17T08:00:00.000Z');
const item = ItemSchema.parse({
	id: 'a/001',
	type: 'cloze',
	level: 'A2',
	skill: 'form',
	text: '{{den}}',
	accepted: ['den'],
	explanation: 'x',
	errorTags: ['case'],
	review: { status: 'verified', by: 'c', date: '2026-11-17' },
	source: 'original'
});
const step = (pointId: string, source: SessionStep['source']): SessionStep => ({
	item,
	pointId,
	source,
	cardKey: `${pointId}:form`
});
const goodTimes = (card: PointCard, n: number) => {
	for (let i = 0; i < n; i++) card = reviewPointCard(s, card, Grade.Good, card.fsrs.dueAt).card;
	return card;
};

describe('sessionProgress', () => {
	it('lists points that came back (due, not wrong) once', () => {
		const p = sessionProgress(
			[
				{ step: step('a', 'due'), verdict: 'correct' },
				{ step: step('a', 'due'), verdict: 'near-miss' },
				{ step: step('b', 'due'), verdict: 'wrong' },
				{ step: step('c', 'new'), verdict: 'correct' }
			],
			{ cards: [], mistakeCards: [] },
			{ cards: [], mistakeCards: [] }
		);
		expect(p.cameBack).toEqual(['a']);
	});

	it('finds level-ups, new points learned and mastered points', () => {
		const a0 = goodTimes(newPointCard(s, 'a', 'form', T0), 2);
		let a1 = a0;
		while (pointMastery([a1]).get('a') !== 'mastered') a1 = goodTimes(a1, 1);
		const b1 = goodTimes(newPointCard(s, 'b', 'form', T0), 1);
		const p = sessionProgress(
			[],
			{ cards: [a0], mistakeCards: [] },
			{ cards: [a1, b1], mistakeCards: [] }
		);
		const was = pointMastery([a0]).get('a');
		expect(p.levelUps).toEqual([
			{ pointId: 'a', from: was, to: 'mastered' },
			{ pointId: 'b', from: 'new', to: pointMastery([b1]).get('b') }
		]);
		expect(progressEvents(p)).toEqual(['point-mastered', 'point-learned']);
	});

	it('a point is as strong as its weakest skill', () => {
		const strong = goodTimes(newPointCard(s, 'a', 'form', T0), 8);
		const weak = reviewPointCard(s, newPointCard(s, 'a', 'syntax', T0), Grade.Again, T0).card;
		expect(pointMastery([strong, weak]).get('a')).toBe('learning');
	});

	it('reports newly resolved mistakes and new leeches', () => {
		const open = recordMistake(s, undefined, 'a', 'case', T0).card;
		const resolved = { ...open, resolvedAt: T0 };
		const card = newPointCard(s, 'a', 'form', T0);
		const leech = { ...card, leech: { flaggedAt: T0, lapsesAtFlag: 6, scaffoldLeft: 3 } };
		const p = sessionProgress(
			[],
			{ cards: [card], mistakeCards: [open] },
			{ cards: [leech], mistakeCards: [resolved] }
		);
		expect(p.resolvedMistakes).toEqual(['mistake:a:case']);
		expect(p.newLeeches).toEqual(['a:form']);
		expect(progressEvents(p)).toEqual(['mistake-resolved', 'leech']);
		// unchanged leech state is not "new"
		expect(
			sessionProgress(
				[],
				{ cards: [leech], mistakeCards: [] },
				{ cards: [leech], mistakeCards: [] }
			).newLeeches
		).toEqual([]);
	});
});
