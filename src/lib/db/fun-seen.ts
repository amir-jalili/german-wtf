/** Fun-system seen-history (THEME_AND_FUN.md §2). */
import type { GymDB } from './schema.js';

export async function recordFunSeen(
	db: GymDB,
	funId: string,
	event: string,
	now = Date.now()
): Promise<void> {
	await db.funSeen.add({ funId, event, timestamp: now });
}

/** Fun ids shown most recently, oldest first (input for pickFun's `seen`). */
export async function recentFunIds(db: GymDB, limit = 50): Promise<string[]> {
	const rows = await db.funSeen.orderBy('timestamp').reverse().limit(limit).toArray();
	return rows.reverse().map((r) => r.funId);
}
