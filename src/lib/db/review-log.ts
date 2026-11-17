/** Writing and reading the append-only review log. */
import type { ItemCheck, ItemAnswer } from '#lib/engine/checker/index.js';
import type { Item } from '#lib/engine/content/schema.js';
import type { GymDB, ReviewLogEntry } from './schema.js';

export interface AnswerToLog {
	item: Item;
	pointId: string;
	answer: ItemAnswer;
	check: ItemCheck;
	ms: number;
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
		mode: 'practice'
	};
}

export async function logAnswer(db: GymDB, a: AnswerToLog, now = Date.now()): Promise<number> {
	return (await db.reviewLog.add(toLogEntry(a, now))) as number;
}

export async function countAnswers(db: GymDB): Promise<number> {
	return db.reviewLog.count();
}
