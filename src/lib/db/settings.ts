/** Typed access to the key/value `settings` table. Defaults live here. */
import type { ChaosLevel } from '#lib/engine/fun/pick.js';
import { CHAOS_LEVELS } from '#lib/engine/fun/pick.js';
import { clampRetention, DEFAULT_RETENTION } from '#lib/engine/scheduler/retention.js';
import type { GymDB } from './schema.js';

export interface Settings {
	/** Fun frequency (THEME_AND_FUN.md §2). */
	catChaos: ChaosLevel;
	/** FSRS target retention, 0.70–0.97 (ADR 0007; UI in P2.8). */
	targetRetention: number;
	/** Daily session length in minutes (PRODUCT_SPEC: 10/15/25; UI in P2.8). */
	dailyMinutes: number;
	/** New grammar points per day, 0–3. */
	newPerDay: number;
}

export const DAILY_MINUTES = [5, 10, 15, 25] as const;
export const MAX_NEW_PER_DAY = 3;

export const DEFAULT_SETTINGS: Settings = {
	catChaos: 'some',
	targetRetention: DEFAULT_RETENTION,
	dailyMinutes: 15,
	newPerDay: 1
};

function intIn(value: unknown, min: number, max: number, fallback: number): number {
	return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
		? value
		: fallback;
}

export async function loadSettings(db: GymDB): Promise<Settings> {
	const rows = await db.settings.toArray();
	const map = new Map(rows.map((r) => [r.key, r.value]));
	const chaos = map.get('catChaos');
	return {
		catChaos: CHAOS_LEVELS.includes(chaos as ChaosLevel)
			? (chaos as ChaosLevel)
			: DEFAULT_SETTINGS.catChaos,
		targetRetention:
			typeof map.get('targetRetention') === 'number'
				? clampRetention(map.get('targetRetention') as number)
				: DEFAULT_SETTINGS.targetRetention,
		dailyMinutes: intIn(map.get('dailyMinutes'), 1, 120, DEFAULT_SETTINGS.dailyMinutes),
		newPerDay: intIn(map.get('newPerDay'), 0, MAX_NEW_PER_DAY, DEFAULT_SETTINGS.newPerDay)
	};
}

export async function saveSetting<K extends keyof Settings>(
	db: GymDB,
	key: K,
	value: Settings[K]
): Promise<void> {
	await db.settings.put({ key, value });
}
