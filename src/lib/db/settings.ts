/** Typed access to the key/value `settings` table. Defaults live here. */
import type { ChaosLevel } from '#lib/engine/fun/pick.js';
import { CHAOS_LEVELS } from '#lib/engine/fun/pick.js';
import type { GymDB } from './schema.js';

export interface Settings {
	/** Fun frequency (THEME_AND_FUN.md §2). */
	catChaos: ChaosLevel;
}

export const DEFAULT_SETTINGS: Settings = { catChaos: 'some' };

export async function loadSettings(db: GymDB): Promise<Settings> {
	const rows = await db.settings.toArray();
	const map = new Map(rows.map((r) => [r.key, r.value]));
	const chaos = map.get('catChaos');
	return {
		catChaos: CHAOS_LEVELS.includes(chaos as ChaosLevel)
			? (chaos as ChaosLevel)
			: DEFAULT_SETTINGS.catChaos
	};
}

export async function saveSetting<K extends keyof Settings>(
	db: GymDB,
	key: K,
	value: Settings[K]
): Promise<void> {
	await db.settings.put({ key, value });
}
