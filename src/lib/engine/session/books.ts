/**
 * Book chapters (P2.9c): progress per chapter for the Map's "My books", which chapter Today
 * offers, and the steps of "Practise chapter X". Book items share their point's cards
 * (`pointId:skill`, ADR 0007), so a chapter's mastery is the weakest card its items review.
 */
import { itemPointId, type PackedBook, type PackedChapter } from '../content/books';
import { cardKey, type CardKey } from '../scheduler/card-key';
import type { PointCard } from '../scheduler/cards';
import { masteryOf, weakestMastery, type Mastery } from '../scheduler/mastery';
import type { Rng } from '../util/rng';
import type { SessionStep } from './daily';
import { pickPracticeItems } from './practice';

export interface ChapterProgress {
	bookSlug: string;
	bookTitle: string;
	id: string;
	title: string;
	items: number;
	/** Distinct items of this chapter answered at least once. */
	answered: number;
	mastery: Mastery;
}

/** The card keys a chapter's items review. */
export function chapterCardKeys(chapter: PackedChapter): CardKey[] {
	return [...new Set(chapter.items.map((i) => cardKey(itemPointId(i.id), i.skill)))];
}

export function chapterProgress(
	books: readonly PackedBook[],
	cards: readonly PointCard[],
	answeredItemIds: ReadonlySet<string>
): ChapterProgress[] {
	const byKey = new Map(cards.map((c) => [c.key, c]));
	return books.flatMap((book) =>
		book.chapters.map((chapter) => {
			const levels = chapterCardKeys(chapter).map((key) => {
				const card = byKey.get(key);
				return card ? masteryOf(card.fsrs) : 'new';
			});
			return {
				bookSlug: book.slug,
				bookTitle: book.title,
				id: chapter.id,
				title: chapter.title,
				items: chapter.items.length,
				answered: chapter.items.filter((i) => answeredItemIds.has(i.id)).length,
				mastery: weakestMastery(levels)
			};
		})
	);
}

/**
 * The chapter Today offers: the first one (books in the given order, chapters in book order)
 * with unanswered items or below "strong". Undefined when every chapter is strong.
 */
export function nextChapter(progress: readonly ChapterProgress[]): ChapterProgress | undefined {
	return progress.find(
		(c) => c.answered < c.items || (c.mastery !== 'strong' && c.mastery !== 'mastered')
	);
}

/** Up to `count` of the chapter's items, interleaved by type, as session steps. */
export function buildChapterSession(
	chapter: PackedChapter,
	options: { rng: Rng; count?: number }
): SessionStep[] {
	return pickPracticeItems(chapter.items, { rng: options.rng, count: options.count ?? 10 }).map(
		(item) => {
			const pointId = itemPointId(item.id);
			return { item, pointId, source: 'chapter', cardKey: cardKey(pointId, item.skill) };
		}
	);
}
