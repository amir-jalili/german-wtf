/**
 * App-side glue for the daily session (P2.5): loads content, storage and settings, calls the
 * pure engine, and records answers. Cards are rebuilt from the review log after every answer
 * (ADR 0007), so this module never edits FSRS state by hand.
 */
import { loadAllBooks } from '#lib/content/books.js';
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
	type SrsState,
	type StoredBook
} from '#lib/db/index.js';
import { bookItemsByPoint, mergeItemsByPoint } from '#lib/engine/content/books.js';
import type { Item } from '#lib/engine/content/schema.js';
import {
	buildChapterSession,
	buildDailySession,
	chapterProgress,
	DEFAULT_SECONDS_PER_ITEM,
	type ChapterProgress,
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
	/** Imported books and progress per chapter, in book order (P2.9c). */
	books: StoredBook[];
	chapters: ChapterProgress[];
	createdAt: number;
}

/**
 * Every servable item by point: the compiled public bundles (verified, unretired items only)
 * plus the items of imported book packs (P2.9b).
 */
export async function loadServableItems(books?: readonly StoredBook[]): Promise<{
	catalogue: CompiledCatalogueEntry[];
	itemsByPoint: Map<string, Item[]>;
}> {
	const [catalogue, allBooks] = await Promise.all([
		loadCatalogue().then((c) => c.points),
		books ?? loadAllBooks()
	]);
	const bookItems = bookItemsByPoint(allBooks);
	for (const [id, items] of bookItems)
		bookItems.set(
			id,
			items.filter((i) => !i.retired)
		);
	const levels = [...new Set(catalogue.filter((p) => p.itemCount > 0).map((p) => p.level))];
	const bundles = await Promise.all(levels.map((l) => loadLevel(l)));
	const itemsByPoint = new Map<string, Item[]>();
	for (const bundle of bundles) {
		for (const point of bundle.points) {
			const items = point.items.filter((i) => !i.retired && i.review.status === 'verified');
			if (items.length) itemsByPoint.set(point.id, items);
		}
	}
	return { catalogue, itemsByPoint: mergeItemsByPoint(itemsByPoint, bookItems) };
}

export async function prepareToday(now = new Date()): Promise<TodayData> {
	const db = getDb();
	const books = await loadAllBooks();
	const [{ catalogue, itemsByPoint }, state, settings] = await Promise.all([
		loadServableItems(books),
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
		books,
		chapters: chapterProgress(books, state.cards, new Set(state.lastSeen.keys())),
		createdAt: now.getTime()
	};
}

/** Today's data with the plan replaced by "Practise chapter X" (P2.9c), or undefined. */
export function chapterPlan(
	today: TodayData,
	bookSlug: string,
	chapterId: string,
	now = new Date()
): TodayData | undefined {
	const chapter = today.books
		.find((b) => b.slug === bookSlug)
		?.chapters.find((c) => c.id === chapterId);
	if (!chapter) return undefined;
	const steps = buildChapterSession(chapter, { rng: mulberry32(now.getTime() >>> 0) });
	return {
		...today,
		plan: {
			steps,
			overflow: { due: 0, mistakes: 0 },
			counts: { due: 0, mistakes: 0, newPoints: 0 },
			minutes: Math.max(1, Math.round((steps.length * DEFAULT_SECONDS_PER_ITEM) / 60))
		},
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

/** "Practise chapter X" from anywhere: today's data with that chapter's steps, handed to /session. */
export async function handOffChapter(bookSlug: string, chapterId: string): Promise<boolean> {
	const data = chapterPlan(await prepareToday(), bookSlug, chapterId);
	if (data) handOffPlan(data);
	return Boolean(data);
}
