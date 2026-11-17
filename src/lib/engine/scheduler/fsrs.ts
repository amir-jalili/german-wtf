/**
 * Thin, synchronous wrapper around ts-fsrs 6 with the FSRS-7 model (ADR 0007).
 * Pure: time always comes in as `now`, nothing reads the clock.
 */
import {
	dateChrono,
	defaultLearningSteps,
	defaultRelearningSteps,
	defineScheduler,
	DEFAULT_MAXIMUM_INTERVAL,
	schedulerDesiredRetentionMiddleware,
	schedulerFuzzingMiddleware,
	schedulerLearningStepsMiddleware,
	schedulerMaximumIntervalMiddleware,
	schedulerMonotonicIntervalMiddleware,
	schedulerScheduledDaysMiddleware,
	schedulerStatsMiddleware
} from 'ts-fsrs';
import { FSRS7Model, migrateFSRS7Parameters } from 'ts-fsrs/models/fsrs-7';
import type { Grade } from './rating';
import { clampRetention, DEFAULT_RETENTION } from './retention';

const definition = defineScheduler({ model: FSRS7Model, chrono: dateChrono }).use(
	schedulerDesiredRetentionMiddleware,
	schedulerFuzzingMiddleware,
	schedulerStatsMiddleware,
	schedulerScheduledDaysMiddleware,
	schedulerLearningStepsMiddleware,
	schedulerMaximumIntervalMiddleware,
	schedulerMonotonicIntervalMiddleware
);

function build(retention: number) {
	return definition.create({
		config: {
			fractionalDays: true,
			weights: migrateFSRS7Parameters(undefined),
			enableShortTerm: true,
			desiredRetention: clampRetention(retention),
			learningSteps: Array.from(defaultLearningSteps),
			relearningSteps: Array.from(defaultRelearningSteps),
			allowModelOverride: true,
			enableFuzz: false,
			maximumInterval: DEFAULT_MAXIMUM_INTERVAL
		}
	});
}

type FsrsScheduler = ReturnType<typeof build>;
/** FSRS memory state as ts-fsrs returns it (numbers and `Date`s); stored as-is in Dexie. */
export type FsrsCard = ReturnType<FsrsScheduler['newCard']>;
export type FsrsRevlog = ReturnType<FsrsScheduler['review']>['revlog'];

export interface Scheduler {
	readonly retention: number;
	newCard(key: string, now: Date): FsrsCard;
	review(card: FsrsCard, grade: Grade, now: Date): { card: FsrsCard; revlog: FsrsRevlog };
	/** Estimated recall probability (0–1) at `now`; 0 for a card never reviewed. */
	retrievability(card: FsrsCard, now: Date): number;
}

export function createScheduler(retention = DEFAULT_RETENTION): Scheduler {
	const fsrs = build(retention);
	return {
		retention: clampRetention(retention),
		newCard: (key, now) => fsrs.newCard({ now, cardId: key }),
		review: (card, grade, now) => {
			const { card: next, revlog } = fsrs.review({ card, grade, now });
			return { card: next, revlog };
		},
		retrievability: (card, now) => {
			if (!card.lastReviewAt || card.reps === 0) return 0;
			const elapsed = Math.max(0, fsrs.chrono.difference(card.lastReviewAt, now));
			return fsrs.model.forgettingCurve(card, elapsed);
		}
	};
}

export function isDue(card: Pick<FsrsCard, 'dueAt'>, now: Date): boolean {
	return card.dueAt.getTime() <= now.getTime();
}
