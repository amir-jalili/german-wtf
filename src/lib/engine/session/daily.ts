/**
 * Daily session builder (ARCHITECTURE §5.3, P2.4). Pure: everything comes in as data.
 *
 * Priority: due point cards (most overdue first) → due open mistake cards → new points
 * (catalogue order, prerequisites met, daily quota). The time budget caps the number of
 * items; whatever does not fit stays due for next time. Then the list is interleaved so no
 * two consecutive items share a point, except inside a new point's introduction block.
 * Each card gets a FRESH item: never one of the recently answered items when another exists,
 * otherwise the least recently seen.
 */
import type { CatalogueEntry, Item, Skill } from '../content/schema';
import { cardKey } from '../scheduler/card-key';
import { needsScaffold, type MistakeCard, type PointCard } from '../scheduler/cards';
import { isDue } from '../scheduler/fsrs';
import { shuffle, type Rng } from '../util/rng';

export const DEFAULT_SECONDS_PER_ITEM = 30;
/** Items that introduce one new point (shown as a block). */
export const NEW_POINT_ITEMS = 3;
/** Items answered this recently are avoided when another item exists. */
export const RECENT_ITEMS = 20;

/** `chapter`: "Practise chapter X" from a book pack (P2.9c), outside the daily plan. */
export type StepSource = 'due' | 'mistake' | 'new' | 'chapter';

export interface SessionStep {
	item: Item;
	pointId: string;
	source: StepSource;
	/** The point card this answer reviews (`pointId:skill`). */
	cardKey: string;
	/** Set when this step reviews a mistake card. */
	mistakeKey?: string;
	/** Leech: use the scaffolded version and suggest the lesson (P2.2). */
	scaffold?: boolean;
}

export interface SessionInput {
	now: Date;
	/** Catalogue entries in catalogue order (all levels). */
	catalogue: readonly CatalogueEntry[];
	/** Servable items per point id (verified, not retired). Points without items are "coming soon". */
	itemsByPoint: ReadonlyMap<string, readonly Item[]>;
	cards: readonly PointCard[];
	mistakeCards: readonly MistakeCard[];
	/** Item id → last time it was answered (Unix ms). */
	lastSeen: ReadonlyMap<string, number>;
	/** Item ids of the most recent answers, newest last (only the last RECENT_ITEMS matter). */
	recentItemIds: readonly string[];
	minutes: number;
	newPerDay: number;
	/** New points already introduced today (they count against the quota). */
	newToday: number;
	secondsPerItem?: number;
	rng: Rng;
}

export interface SessionPlan {
	steps: SessionStep[];
	/** How many due cards and mistakes did not fit and stay due. */
	overflow: { due: number; mistakes: number };
	counts: { due: number; mistakes: number; newPoints: number };
	/** Estimated minutes for the planned steps. */
	minutes: number;
}

export function capacityFor(minutes: number, secondsPerItem = DEFAULT_SECONDS_PER_ITEM): number {
	return Math.max(0, Math.floor((minutes * 60) / Math.max(1, secondsPerItem)));
}

/** Picks one item, avoiding recent and already-planned items, least recently seen first. */
export function pickFreshItem(
	candidates: readonly Item[],
	used: ReadonlySet<string>,
	recent: ReadonlySet<string>,
	lastSeen: ReadonlyMap<string, number>,
	rng: Rng
): Item | undefined {
	const unused = candidates.filter((i) => !used.has(i.id));
	if (!unused.length) return undefined;
	const fresh = unused.filter((i) => !recent.has(i.id));
	const pool = fresh.length ? fresh : unused;
	// Never seen first (random among them), then oldest seen.
	const shuffled = shuffle(pool, rng);
	return shuffled.reduce((best, i) =>
		(lastSeen.get(i.id) ?? -Infinity) < (lastSeen.get(best.id) ?? -Infinity) ? i : best
	);
}

function prerequisitesMet(
	entry: CatalogueEntry,
	itemsByPoint: ReadonlyMap<string, readonly Item[]>,
	started: ReadonlySet<string>
): boolean {
	// A prerequisite without content can't be practised, so it doesn't block.
	return entry.prerequisites.every((p) => !itemsByPoint.get(p)?.length || started.has(p));
}

export function buildDailySession(input: SessionInput): SessionPlan {
	const { now, itemsByPoint, rng } = input;
	const capacity = capacityFor(input.minutes, input.secondsPerItem);
	const recent = new Set(input.recentItemIds.slice(-RECENT_ITEMS));
	const used = new Set<string>();
	const picked: SessionStep[] = [];
	const itemsFor = (pointId: string, skill?: Skill) =>
		(itemsByPoint.get(pointId) ?? []).filter((i) => !skill || i.skill === skill);
	const take = (step: Omit<SessionStep, 'item'>, candidates: readonly Item[]): boolean => {
		const item = pickFreshItem(candidates, used, recent, input.lastSeen, rng);
		if (!item) return false;
		used.add(item.id);
		picked.push({ ...step, item, cardKey: cardKey(step.pointId, item.skill) });
		return true;
	};

	// 1. Due point cards, most overdue first.
	const due = input.cards
		.filter((c) => isDue(c.fsrs, now) && itemsFor(c.pointId, c.skill).length)
		.sort((a, b) => a.fsrs.dueAt.getTime() - b.fsrs.dueAt.getTime());
	let dueTaken = 0;
	for (const card of due) {
		if (picked.length >= capacity) break;
		const step: Omit<SessionStep, 'item'> = {
			pointId: card.pointId,
			source: 'due',
			cardKey: card.key
		};
		if (needsScaffold(card)) step.scaffold = true;
		if (take(step, itemsFor(card.pointId, card.skill))) dueTaken++;
	}

	// 2. Open, due mistake cards: an item of that point that trains that error tag.
	const mistakes = input.mistakeCards
		.filter((m) => !m.resolvedAt && isDue(m.fsrs, now))
		.sort((a, b) => a.fsrs.dueAt.getTime() - b.fsrs.dueAt.getTime());
	let mistakesTaken = 0;
	let mistakesPossible = 0;
	for (const m of mistakes) {
		const candidates = itemsFor(m.pointId).filter((i) => i.errorTags.includes(m.errorTag));
		if (!candidates.length) continue;
		mistakesPossible++;
		if (picked.length >= capacity) continue;
		const step: Omit<SessionStep, 'item'> = {
			pointId: m.pointId,
			source: 'mistake',
			cardKey: '',
			mistakeKey: m.key
		};
		if (needsScaffold(m)) step.scaffold = true;
		if (take(step, candidates)) mistakesTaken++;
	}

	// 3. New points: catalogue order, prerequisites met, within the daily quota.
	const started = new Set(input.cards.filter((c) => c.fsrs.reps > 0).map((c) => c.pointId));
	const known = new Set(input.cards.map((c) => c.pointId));
	let newPoints = 0;
	const quota = Math.max(0, input.newPerDay - input.newToday);
	for (const entry of input.catalogue) {
		if (newPoints >= quota || picked.length >= capacity) break;
		if (known.has(entry.id) || !itemsFor(entry.id).length) continue;
		if (!prerequisitesMet(entry, itemsByPoint, started)) continue;
		let added = 0;
		for (let k = 0; k < NEW_POINT_ITEMS && picked.length < capacity; k++) {
			if (take({ pointId: entry.id, source: 'new', cardKey: '' }, itemsFor(entry.id))) added++;
		}
		if (added) newPoints++;
	}

	const steps = interleave(picked);
	return {
		steps,
		overflow: { due: due.length - dueTaken, mistakes: mistakesPossible - mistakesTaken },
		counts: { due: dueTaken, mistakes: mistakesTaken, newPoints },
		minutes: Math.ceil((steps.length * (input.secondsPerItem ?? DEFAULT_SECONDS_PER_ITEM)) / 60)
	};
}

/** Two consecutive steps may share a point only inside one new point's block. */
export function allowedNeighbours(a: SessionStep, b: SessionStep): boolean {
	return a.pointId !== b.pointId || (a.source === 'new' && b.source === 'new');
}

/**
 * Reorders steps so neighbours are allowed whenever possible. Reviews (due, mistakes) are
 * spread greedily, always taking the point with the most steps left; each new point's
 * block stays together at the end.
 */
export function interleave(steps: readonly SessionStep[]): SessionStep[] {
	const reviews = steps.filter((s) => s.source !== 'new');
	const blocks = new Map<string, SessionStep[]>();
	for (const s of steps.filter((x) => x.source === 'new')) {
		blocks.set(s.pointId, [...(blocks.get(s.pointId) ?? []), s]);
	}
	// Greedy spread of reviews (same idea as pickPracticeItems).
	const queues = new Map<string, SessionStep[]>();
	for (const s of reviews) queues.set(s.pointId, [...(queues.get(s.pointId) ?? []), s]);
	const order = [...queues.keys()];
	const out: SessionStep[] = [];
	let last: string | undefined;
	while (out.length < reviews.length) {
		const available = order.filter((p) => queues.get(p)!.length);
		const others = available.filter((p) => p !== last);
		const choices = others.length ? others : available;
		const point = choices.reduce((best, p) =>
			queues.get(p)!.length > queues.get(best)!.length ? p : best
		);
		out.push(queues.get(point)!.shift()!);
		last = point;
	}
	// A new point has no card yet, so it never collides with a review. Its block goes after
	// the reviews (warm up with what you know, then learn something new).
	for (const block of blocks.values()) out.push(...block);
	return out;
}
