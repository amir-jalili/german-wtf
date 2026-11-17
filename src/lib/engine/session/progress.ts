/**
 * What changed in a daily session (P2.5 end screen + fun triggers): which points "came
 * back" (due reviews answered correctly), mastery level-ups, resolved mistakes, new leeches.
 * Pure: compares card snapshots from before and after the session.
 */
import type { FunTrigger } from '../fun/schema';
import { type MistakeCard, type PointCard } from '../scheduler/cards';
import { masteryOf, weakestMastery, MASTERY_LEVELS, type Mastery } from '../scheduler/mastery';
import type { SessionStep } from './daily';

type Verdict = 'correct' | 'near-miss' | 'wrong';

export interface MasteryChange {
	pointId: string;
	from: Mastery;
	to: Mastery;
}

export interface SessionProgress {
	/** Points reviewed because they were due and answered right (near-misses count). */
	cameBack: string[];
	/** Points whose mastery (weakest skill) went up. */
	levelUps: MasteryChange[];
	resolvedMistakes: string[];
	newLeeches: string[];
}

/** A point's mastery = its weakest skill card's; no cards = new. */
export function pointMastery(cards: readonly PointCard[]): Map<string, Mastery> {
	const byPoint = new Map<string, Mastery[]>();
	for (const c of cards)
		byPoint.set(c.pointId, [...(byPoint.get(c.pointId) ?? []), masteryOf(c.fsrs)]);
	return new Map([...byPoint].map(([p, levels]) => [p, weakestMastery(levels)]));
}

export function sessionProgress(
	answered: readonly { step: SessionStep; verdict: Verdict }[],
	before: { cards: readonly PointCard[]; mistakeCards: readonly MistakeCard[] },
	after: { cards: readonly PointCard[]; mistakeCards: readonly MistakeCard[] }
): SessionProgress {
	const cameBack = [
		...new Set(
			answered
				.filter((a) => a.step.source === 'due' && a.verdict !== 'wrong')
				.map((a) => a.step.pointId)
		)
	];
	const was = pointMastery(before.cards);
	const now = pointMastery(after.cards);
	const levelUps: MasteryChange[] = [];
	for (const [pointId, to] of now) {
		const from = was.get(pointId) ?? 'new';
		if (MASTERY_LEVELS.indexOf(to) > MASTERY_LEVELS.indexOf(from))
			levelUps.push({ pointId, from, to });
	}
	const beforeMistakes = new Map(before.mistakeCards.map((m) => [m.key, m]));
	const resolvedMistakes = after.mistakeCards
		.filter((m) => m.resolvedAt && !beforeMistakes.get(m.key)?.resolvedAt)
		.map((m) => m.key);
	const leechKey = (c: { leech?: { lapsesAtFlag: number } }) => c.leech?.lapsesAtFlag;
	const beforeLeech = new Map<string, number | undefined>([
		...before.cards.map((c) => [c.key, leechKey(c)] as const),
		...before.mistakeCards.map((c) => [c.key, leechKey(c)] as const)
	]);
	const newLeeches = [...after.cards, ...after.mistakeCards]
		.filter((c) => c.leech && leechKey(c) !== beforeLeech.get(c.key))
		.map((c) => c.key);
	return { cameBack, levelUps, resolvedMistakes, newLeeches };
}

/** Fun triggers for the progress, most special first (THEME_AND_FUN.md §2). */
export function progressEvents(p: SessionProgress): FunTrigger[] {
	const events: FunTrigger[] = [];
	if (p.levelUps.some((c) => c.to === 'mastered')) events.push('point-mastered');
	if (p.resolvedMistakes.length) events.push('mistake-resolved');
	if (p.levelUps.some((c) => c.from === 'new')) events.push('point-learned');
	if (p.newLeeches.length) events.push('leech');
	return events;
}
