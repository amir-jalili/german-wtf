/**
 * App-side glue for the daily session (P2.5): loads content, storage and settings, calls the
 * pure engine, and records answers. Cards are rebuilt from the review log after every answer
 * (ADR 0007), so this module never edits FSRS state by hand.
 */
import { loadCatalogue, loadLevel } from '#lib/content/load.js';
import type { CompiledCatalogueEntry } from '#lib/content/types.js';
import {
	getDb,
	loadSettings,
	loadSrsState,
	logAnswer,
	refreshCardsForPoint,
	type AnswerToLog,
	type Settings,
	type SrsState
} from '#lib/db/index.js';
import type { Item } from '#lib/engine/content/schema.js';
import {
	buildDailySession,
	type SessionPlan,
	type SessionStep
} from '#lib/engine/session/index.js';
import { mulberry32 } from '#lib/engine/util/rng.js';

export interface TodayData {
	plan: SessionPlan;
	state: SrsState;
	settings: Settings;
	/** Point id → catalogue entry (for titles). */
	points: Map<string, CompiledCatalogueEntry>;
	createdAt: number;
}

/** Every servable item by point (the compiled bundles only contain verified, unretired items). */
export async function loadServableItems(): Promise<{
	catalogue: CompiledCatalogueEntry[];
	itemsByPoint: Map<string, Item[]>;
}> {
	const catalogue = (await loadCatalogue()).points;
	const levels = [...new Set(catalogue.filter((p) => p.itemCount > 0).map((p) => p.level))];
	const bundles = await Promise.all(levels.map((l) => loadLevel(l)));
	const itemsByPoint = new Map<string, Item[]>();
	for (const bundle of bundles) {
		for (const point of bundle.points) {
			const items = point.items.filter((i) => !i.retired && i.review.status === 'verified');
			if (items.length) itemsByPoint.set(point.id, items);
		}
	}
	return { catalogue, itemsByPoint };
}

export async function prepareToday(now = new Date()): Promise<TodayData> {
	const db = getDb();
	const [{ catalogue, itemsByPoint }, state, settings] = await Promise.all([
		loadServableItems(),
		loadSrsState(db, now),
		loadSettings(db)
	]);
	const plan = buildDailySession({
		now,
		catalogue,
		itemsByPoint,
		cards: state.cards,
		mistakeCards: state.mistakeCards,
		lastSeen: state.lastSeen,
		recentItemIds: state.recentItemIds,
		minutes: settings.dailyMinutes,
		newPerDay: settings.newPerDay,
		newToday: state.newToday,
		rng: mulberry32(now.getTime() >>> 0)
	});
	return {
		plan,
		state,
		settings,
		points: new Map(catalogue.map((p) => [p.id, p])),
		createdAt: now.getTime()
	};
}

/** Logs one answer of a session step and rebuilds that point's cards. */
export async function recordStepAnswer(
	step: SessionStep,
	outcome: Omit<AnswerToLog, 'pointId' | 'mode' | 'mistakeKey'>,
	retention: number
): Promise<void> {
	const db = getDb();
	await logAnswer(db, {
		...outcome,
		pointId: step.pointId,
		mode: step.source,
		...(step.mistakeKey ? { mistakeKey: step.mistakeKey } : {})
	});
	await refreshCardsForPoint(db, step.pointId, retention);
}

/** Today's plan, handed from the Today screen to /session (rebuilt if stale or missing). */
let handoff: TodayData | undefined;
export const HANDOFF_MAX_AGE_MS = 10 * 60_000;

export function handOffPlan(data: TodayData): void {
	handoff = data;
}

export function takePlan(now = Date.now()): TodayData | undefined {
	const data = handoff;
	handoff = undefined;
	return data && now - data.createdAt < HANDOFF_MAX_AGE_MS ? data : undefined;
}
