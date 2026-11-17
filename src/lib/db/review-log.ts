/** Writing and reading the append-only review log. */
import type { ItemCheck, ItemAnswer } from '#lib/engine/checker/index.js';
import type { Item } from '#lib/engine/content/schema.js';
import type { AnswerMode, GymDB, ReviewLogEntry } from './schema.js';

export interface AnswerToLog {
	item: Item;
	pointId: string;
	answer: ItemAnswer;
	check: ItemCheck;
	ms: number;
	/** Default `practice`; daily-session steps pass their source (P2.5). */
	mode?: AnswerMode;
	mistakeKey?: string;
}

export function toLogEntry(a: AnswerToLog, now = Date.now()): ReviewLogEntry {
	return {
		itemId: a.item.id,
		pointId: a.pointId,
		cardKey: `${a.pointId}:${a.item.skill}`,
		verdict: a.check.result.verdict,
		// Plain copy: answers may come from Svelte state proxies, which IndexedDB cannot clone.
		answer: JSON.parse(JSON.stringify(a.answer)) as ItemAnswer,
		ms: Math.round(a.ms),
		timestamp: now,
		mode: a.mode ?? 'practice',
		...(a.mistakeKey ? { mistakeKey: a.mistakeKey } : {}),
		...(a.check.result.verdict === 'wrong' && a.check.result.tags.length
			? { errorTags: [...a.check.result.tags] }
			: {})
	};
}

export async function logAnswer(db: GymDB, a: AnswerToLog, now = Date.now()): Promise<number> {
	return (await db.reviewLog.add(toLogEntry(a, now))) as number;
}

export async function countAnswers(db: GymDB): Promise<number> {
	return db.reviewLog.count();
}
