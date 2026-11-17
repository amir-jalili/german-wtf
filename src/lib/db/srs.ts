/**
 * SRS state in IndexedDB (P2.5). Cards are a cache derived from the review log (ADR 0007):
 * after an answer, the point's cards are rebuilt by replaying that point's answers, so a
 * live session, the v3 upgrade and a backup import always agree.
 */
import {
	createScheduler,
	replayAnswers,
	type MistakeCard,
	type PointCard
} from '#lib/engine/scheduler/index.js';
import type { GymDB, ReviewLogEntry } from './schema.js';

/** Rebuilds all cards and mistake cards of one point from its answers. */
export async function refreshCardsForPoint(
	db: GymDB,
	pointId: string,
	retention: number
): Promise<void> {
	await db.transaction('rw', [db.reviewLog, db.cards, db.mistakeCards], async () => {
		const answers = await db.reviewLog.where('pointId').equals(pointId).toArray();
		const { cards, mistakeCards } = replayAnswers(createScheduler(retention), answers);
		await db.cards.where('pointId').equals(pointId).delete();
		await db.mistakeCards.where('pointId').equals(pointId).delete();
		await db.cards.bulkPut(cards);
		await db.mistakeCards.bulkPut(mistakeCards);
	});
}

export interface SrsState {
	cards: PointCard[];
	mistakeCards: MistakeCard[];
	/** Item id → last answer time (Unix ms). */
	lastSeen: Map<string, number>;
	/** Item ids of the last answers, oldest first. */
	recentItemIds: string[];
	/** Points whose first-ever answer was today (local day). */
	newToday: number;
	/** Unix ms of the newest answer, if any. */
	lastAnswerAt?: number;
}

export function startOfLocalDay(now: Date): number {
	const d = new Date(now);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export async function loadSrsState(db: GymDB, now: Date, recent = 20): Promise<SrsState> {
	return db.transaction('r', [db.reviewLog, db.cards, db.mistakeCards], async () => {
		const [cards, mistakeCards] = await Promise.all([
			db.cards.toArray(),
			db.mistakeCards.toArray()
		]);
		const lastSeen = new Map<string, number>();
		const firstAnswer = new Map<string, number>();
		let lastAnswerAt: number | undefined;
		await db.reviewLog.orderBy('timestamp').each((e) => {
			lastSeen.set(e.itemId, e.timestamp);
			if (!firstAnswer.has(e.pointId)) firstAnswer.set(e.pointId, e.timestamp);
			lastAnswerAt = e.timestamp;
		});
		const recentItemIds = (
			await db.reviewLog.orderBy('timestamp').reverse().limit(recent).toArray()
		)
			.reverse()
			.map((e) => e.itemId);
		const today = startOfLocalDay(now);
		const newToday = [...firstAnswer.values()].filter((t) => t >= today).length;
		return { cards, mistakeCards, lastSeen, recentItemIds, newToday, lastAnswerAt };
	});
}

/** Every answer, oldest first, reduced to what Stats needs. */
export async function loadAnswers(
	db: GymDB
): Promise<{ pointId: string; verdict: ReviewLogEntry['verdict']; timestamp: number }[]> {
	const rows = await db.reviewLog.orderBy('timestamp').toArray();
	return rows.map(({ pointId, verdict, timestamp }) => ({ pointId, verdict, timestamp }));
}
