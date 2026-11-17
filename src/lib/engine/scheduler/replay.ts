/**
 * Turning answers into card reviews (P2.3).
 *
 * Several answers to the same card in one sitting (practice mode serves 10 items of one
 * point) count as ONE FSRS review, graded by `gradeForSitting`; otherwise ten same-day
 * reviews would distort stability. `replayAnswers` rebuilds all cards from the append-only
 * review log. The Dexie v3 upgrade and old-backup import use it, so answers given before
 * the scheduler existed still count.
 */
import type { CheckResult } from '../checker/check';
import type { ErrorTag } from '../content/schema';
import { parseCardKey } from './card-key';
import {
	newPointCard,
	recordMistake,
	reviewPointCard,
	type MistakeCard,
	type PointCard
} from './cards';
import type { Scheduler } from './fsrs';
import { Grade, gradeFromAnswer } from './rating';

/** Answers further apart than this start a new sitting. */
export const SITTING_GAP_MS = 30 * 60_000;
/** More than this share of wrong answers in a sitting → Again. */
export const AGAIN_SHARE = 0.3;

/** The fields of a review-log entry the scheduler needs (structural; no db import). */
export interface AnswerRecord {
	itemId: string;
	pointId: string;
	cardKey: string;
	verdict: CheckResult['verdict'];
	ms: number;
	/** Unix ms. */
	timestamp: number;
	errorTags?: readonly ErrorTag[];
	guessed?: boolean;
}

/**
 * One grade for several answers to the same card: Again if more than 30 % were wrong;
 * Hard if anything was wrong, a near-miss or guessed; Easy if every answer was Easy; else Good.
 */
export function gradeForSitting(grades: readonly Grade[]): Grade | undefined {
	if (!grades.length) return undefined;
	const again = grades.filter((g) => g === Grade.Again).length;
	if (again / grades.length > AGAIN_SHARE) return Grade.Again;
	if (grades.some((g) => g === Grade.Again || g === Grade.Hard)) return Grade.Hard;
	if (grades.every((g) => g === Grade.Easy)) return Grade.Easy;
	return Grade.Good;
}

export interface Sitting {
	cardKey: string;
	/** Time of the last answer; the review happens then. */
	at: number;
	grades: Grade[];
}

/** Grades every answer and groups them into sittings per card, in time order. */
export function groupIntoSittings(answers: readonly AnswerRecord[]): Sitting[] {
	const sorted = [...answers].sort((a, b) => a.timestamp - b.timestamp);
	const timings = new Map<string, number[]>();
	const open = new Map<string, Sitting>();
	const sittings: Sitting[] = [];
	for (const a of sorted) {
		const previousMs = timings.get(a.itemId) ?? [];
		const grade = gradeFromAnswer({
			verdict: a.verdict,
			ms: a.ms,
			previousMs,
			guessed: a.guessed
		});
		timings.set(a.itemId, [...previousMs, a.ms]);
		const current = open.get(a.cardKey);
		if (current && a.timestamp - current.at <= SITTING_GAP_MS) {
			current.grades.push(grade);
			current.at = a.timestamp;
		} else {
			const sitting: Sitting = { cardKey: a.cardKey, at: a.timestamp, grades: [grade] };
			open.set(a.cardKey, sitting);
			sittings.push(sitting);
		}
	}
	return sittings.sort((a, b) => a.at - b.at);
}

export interface ReplayResult {
	cards: PointCard[];
	mistakeCards: MistakeCard[];
}

/** Rebuilds point and mistake cards from answers (any order). Unknown card keys are skipped. */
export function replayAnswers(s: Scheduler, answers: readonly AnswerRecord[]): ReplayResult {
	const cards = new Map<string, PointCard>();
	for (const sitting of groupIntoSittings(answers)) {
		const parsed = parseCardKey(sitting.cardKey);
		const grade = gradeForSitting(sitting.grades);
		if (!parsed || grade === undefined) continue;
		const at = new Date(sitting.at);
		const card = cards.get(sitting.cardKey) ?? newPointCard(s, parsed.pointId, parsed.skill, at);
		cards.set(sitting.cardKey, reviewPointCard(s, card, grade, at).card);
	}
	const mistakes = new Map<string, MistakeCard>();
	for (const a of [...answers].sort((x, y) => x.timestamp - y.timestamp)) {
		if (a.verdict !== 'wrong') continue;
		for (const tag of new Set(a.errorTags ?? [])) {
			const key = `${a.pointId}\u0000${tag}`;
			const result = recordMistake(s, mistakes.get(key), a.pointId, tag, new Date(a.timestamp));
			mistakes.set(key, result.card);
		}
	}
	return { cards: [...cards.values()], mistakeCards: [...mistakes.values()] };
}
