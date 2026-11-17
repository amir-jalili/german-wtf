/**
 * Grammar map model (P2.6): per catalogue point its mastery, what is due, whether content
 * exists, and which prerequisites are still unlearned; plus a forgiving search.
 * Pure: the page passes catalogue and cards in.
 */
import { asciiFold, foldCase } from '../checker/normalise';
import type { CatalogueEntry } from '../content/schema';
import type { MistakeCard, PointCard } from '../scheduler/cards';
import { isDue } from '../scheduler/fsrs';
import type { Mastery } from '../scheduler/mastery';
import { pointMastery } from './progress';

export interface MapEntry<E extends CatalogueEntry = CatalogueEntry> {
	entry: E;
	/** Has servable exercises; otherwise "coming soon". */
	ready: boolean;
	mastery: Mastery;
	/** Due point cards + due open mistake cards. */
	due: number;
	/** Prerequisites that have content but haven't been started. */
	missingPrerequisites: string[];
}

export function buildMap<E extends CatalogueEntry & { itemCount: number }>(
	catalogue: readonly E[],
	cards: readonly PointCard[],
	mistakeCards: readonly MistakeCard[],
	now: Date
): MapEntry<E>[] {
	const mastery = pointMastery(cards);
	const ready = new Set(catalogue.filter((e) => e.itemCount > 0).map((e) => e.id));
	const started = new Set(cards.filter((c) => c.fsrs.reps > 0).map((c) => c.pointId));
	const due = new Map<string, number>();
	const bump = (pointId: string) => due.set(pointId, (due.get(pointId) ?? 0) + 1);
	for (const c of cards) if (isDue(c.fsrs, now)) bump(c.pointId);
	for (const m of mistakeCards) if (!m.resolvedAt && isDue(m.fsrs, now)) bump(m.pointId);
	return catalogue.map((entry) => ({
		entry,
		ready: ready.has(entry.id),
		mastery: mastery.get(entry.id) ?? 'new',
		due: ready.has(entry.id) ? (due.get(entry.id) ?? 0) : 0,
		missingPrerequisites: entry.prerequisites.filter((p) => ready.has(p) && !started.has(p))
	}));
}

/** Lower-case, umlauts and ß folded, so "uber" finds "über" and "strasse" finds "Straße". */
export function searchKey(text: string): string {
	return asciiFold(foldCase(text)).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}

/** Every word of the query must appear in the German or English title, the id or the family. */
export function matchesSearch(entry: CatalogueEntry, query: string): boolean {
	const words = searchKey(query).split(/\s+/).filter(Boolean);
	if (!words.length) return true;
	const haystack = searchKey(
		[entry.title.de, entry.title.en, entry.id.replace(/-/g, ' '), entry.family].join(' ')
	);
	return words.every((w) => haystack.includes(w));
}
