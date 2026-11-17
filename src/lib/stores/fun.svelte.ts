/**
 * Glue between app events and the pure pickFun (THEME_AND_FUN.md §2): loads fun content and
 * the seen-history, applies the chaos level, records what was shown.
 */
import { loadFun } from '#lib/content/load.js';
import { getDb, recentFunIds, recordFunSeen } from '#lib/db/index.js';
import { isMilestone, pickFun, type FunPick } from '#lib/engine/fun/pick.js';
import type { FunTrigger } from '#lib/engine/fun/schema.js';
import { mulberry32 } from '#lib/engine/util/rng.js';
import { settings } from './settings.svelte.js';

/** One per practice session: counts the extras shown so far. */
export class FunSession {
	#extras = 0;
	#rng = mulberry32(Date.now() >>> 0);

	/** Picks fun for the first event (in order) that has any; records it as seen. */
	async pick(events: readonly FunTrigger[]): Promise<FunPick | undefined> {
		try {
			await settings.load();
			const [content, seen] = await Promise.all([loadFun(), recentFunIds(getDb())]);
			for (const event of events) {
				const pick = pickFun(event, content, {
					chaos: settings.value.catChaos,
					seen,
					extrasShown: this.#extras,
					rng: this.#rng
				});
				if (!pick) continue;
				if (!isMilestone(event)) this.#extras += 1;
				void recordFunSeen(getDb(), pick.id, event).catch(() => undefined);
				return pick;
			}
		} catch (error) {
			console.warn('Fun failed (ignored)', error);
		}
		return undefined;
	}
}
