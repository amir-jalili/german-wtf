/**
 * FSRS rating from an answer (ARCHITECTURE §5.2): wrong → Again; near-miss or "I guessed" →
 * Hard; correct → Good; correct and fast → Easy.
 */
import type { CheckResult } from '../checker/check';

type Verdict = CheckResult['verdict'];

/** Same numbers as ts-fsrs `Rating` (Again 1 … Easy 4), kept local so callers need no FSRS import. */
export const Grade = { Again: 1, Hard: 2, Good: 3, Easy: 4 } as const;
export type Grade = (typeof Grade)[keyof typeof Grade];

/** "Fast" = under this share of the item's median answer time. */
export const EASY_TIME_SHARE = 0.4;
/** A median needs at least this many earlier timings to be trusted. */
export const MIN_TIMINGS_FOR_EASY = 3;

export interface RatingInput {
	verdict: Verdict;
	/** Time to answer this time, in ms. */
	ms: number;
	/** Earlier answer times for the same item (ms), any order. */
	previousMs?: readonly number[];
	/** The learner tapped "I guessed" (P3.5). */
	guessed?: boolean;
}

export function median(values: readonly number[]): number | undefined {
	if (!values.length) return undefined;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function gradeFromAnswer({ verdict, ms, previousMs = [], guessed }: RatingInput): Grade {
	if (verdict === 'wrong') return Grade.Again;
	if (verdict === 'near-miss' || guessed) return Grade.Hard;
	const typical = previousMs.length >= MIN_TIMINGS_FOR_EASY ? median(previousMs) : undefined;
	if (typical !== undefined && ms > 0 && ms < typical * EASY_TIME_SHARE) return Grade.Easy;
	return Grade.Good;
}
