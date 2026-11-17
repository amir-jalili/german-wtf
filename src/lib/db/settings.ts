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
}

export const DEFAULT_SETTINGS: Settings = {
	catChaos: 'some',
	targetRetention: DEFAULT_RETENTION
};

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
				: DEFAULT_SETTINGS.targetRetention
	};
}

export async function saveSetting<K extends keyof Settings>(
	db: GymDB,
	key: K,
	value: Settings[K]
): Promise<void> {
	await db.settings.put({ key, value });
}
