/**
 * The two kinds of SRS cards and how one review changes them (ARCHITECTURE §5.2, P2.2).
 *
 * - **Point card** = point × skill. Every answer to an item of that point/skill reviews it.
 * - **Mistake card** = point × error tag. Created by the first wrong answer with that tag,
 *   reviewed when a session serves it, resolved after 3 consecutive correct reviews once
 *   stability ≥ 21 days. A new wrong answer with the same tag re-opens it.
 * - **Leech**: a card with ≥ 6 lapses is flagged; the next 3 reviews use the scaffolded
 *   version and the lesson is suggested. It flags again every 3 further lapses.
 *
 * All functions are pure and return new objects.
 */
import { ErrorTagSchema, type ErrorTag, type Skill } from '../content/schema';
import { cardKey, type CardKey } from './card-key';
import type { FsrsCard, Scheduler } from './fsrs';
import { Grade } from './rating';

export const LEECH_LAPSES = 6;
export const LEECH_REFLAG_EVERY = 3;
export const LEECH_SCAFFOLD_REVIEWS = 3;
export const RESOLVE_STREAK = 3;
export const RESOLVE_STABILITY_DAYS = 21;

export interface LeechState {
	flaggedAt: Date;
	/** Lapse count when last flagged; the next flag comes at +LEECH_REFLAG_EVERY. */
	lapsesAtFlag: number;
	/** Reviews left that should show the scaffolded version. */
	scaffoldLeft: number;
}

export interface PointCard {
	key: CardKey;
	pointId: string;
	skill: Skill;
	fsrs: FsrsCard;
	leech?: LeechState;
}

export type MistakeKey = `mistake:${string}:${ErrorTag}`;

export interface MistakeCard {
	key: MistakeKey;
	pointId: string;
	errorTag: ErrorTag;
	fsrs: FsrsCard;
	createdAt: Date;
	/** Consecutive reviews that were not Again (near-misses count as correct, PRODUCT_SPEC §5). */
	correctStreak: number;
	resolvedAt?: Date;
	leech?: LeechState;
}

/** What a review changed, for the UI and the fun system (`leech`, `mistake-resolved`). */
export interface ReviewEvents {
	becameLeech: boolean;
	resolved?: boolean;
}

export function mistakeKey(pointId: string, errorTag: ErrorTag): MistakeKey {
	return `mistake:${pointId}:${errorTag}`;
}

export function parseMistakeKey(key: string): { pointId: string; errorTag: ErrorTag } | undefined {
	const match = /^mistake:(.+):([^:]+)$/.exec(key);
	if (!match) return undefined;
	const tag = ErrorTagSchema.safeParse(match[2]);
	return tag.success && match[1] ? { pointId: match[1], errorTag: tag.data } : undefined;
}

function nextLeech(
	current: LeechState | undefined,
	lapses: number,
	now: Date
): { leech: LeechState | undefined; becameLeech: boolean } {
	const threshold = current ? current.lapsesAtFlag + LEECH_REFLAG_EVERY : LEECH_LAPSES;
	if (lapses >= threshold) {
		return {
			leech: { flaggedAt: now, lapsesAtFlag: lapses, scaffoldLeft: LEECH_SCAFFOLD_REVIEWS },
			becameLeech: true
		};
	}
	if (!current) return { leech: undefined, becameLeech: false };
	return {
		leech: { ...current, scaffoldLeft: Math.max(0, current.scaffoldLeft - 1) },
		becameLeech: false
	};
}

/** True while the next review should use the scaffolded version and suggest the lesson. */
export function needsScaffold(card: { leech?: LeechState }): boolean {
	return (card.leech?.scaffoldLeft ?? 0) > 0;
}

export function newPointCard(s: Scheduler, pointId: string, skill: Skill, now: Date): PointCard {
	const key = cardKey(pointId, skill);
	return { key, pointId, skill, fsrs: s.newCard(key, now) };
}

export function reviewPointCard(
	s: Scheduler,
	card: PointCard,
	grade: Grade,
	now: Date
): { card: PointCard; events: ReviewEvents } {
	const fsrs = s.review(card.fsrs, grade, now).card;
	const { leech, becameLeech } = nextLeech(card.leech, fsrs.lapses, now);
	const next: PointCard = { ...card, fsrs };
	if (leech) next.leech = leech;
	else delete next.leech;
	return { card: next, events: { becameLeech } };
}

/**
 * A wrong answer with `errorTag`: creates the mistake card (first review = Again), or
 * re-opens a resolved one, or reviews an open one as Again.
 */
export function recordMistake(
	s: Scheduler,
	existing: MistakeCard | undefined,
	pointId: string,
	errorTag: ErrorTag,
	now: Date
): { card: MistakeCard; events: ReviewEvents } {
	const base: MistakeCard = existing
		? { ...existing, correctStreak: 0 }
		: {
				key: mistakeKey(pointId, errorTag),
				pointId,
				errorTag,
				fsrs: s.newCard(mistakeKey(pointId, errorTag), now),
				createdAt: now,
				correctStreak: 0
			};
	delete base.resolvedAt;
	const fsrs = s.review(base.fsrs, Grade.Again, now).card;
	const { leech, becameLeech } = nextLeech(base.leech, fsrs.lapses, now);
	const card: MistakeCard = { ...base, fsrs };
	if (leech) card.leech = leech;
	else delete card.leech;
	return { card, events: { becameLeech } };
}

/** A session served this mistake card and the learner answered it. */
export function reviewMistakeCard(
	s: Scheduler,
	card: MistakeCard,
	grade: Grade,
	now: Date
): { card: MistakeCard; events: ReviewEvents } {
	if (grade === Grade.Again) return recordMistake(s, card, card.pointId, card.errorTag, now);
	const fsrs = s.review(card.fsrs, grade, now).card;
	const { leech, becameLeech } = nextLeech(card.leech, fsrs.lapses, now);
	const correctStreak = card.correctStreak + 1;
	const resolved =
		!card.resolvedAt && correctStreak >= RESOLVE_STREAK && fsrs.stability >= RESOLVE_STABILITY_DAYS;
	const next: MistakeCard = { ...card, fsrs, correctStreak };
	if (leech) next.leech = leech;
	else delete next.leech;
	if (resolved) next.resolvedAt = now;
	return { card: next, events: { becameLeech, resolved } };
}

export function isOpenMistake(card: MistakeCard): boolean {
	return !card.resolvedAt;
}
