import { describe, expect, it } from 'vitest';
import type { PackedBook } from '../content/books';
import { ItemSchema, type Item } from '../content/schema';
import { createScheduler } from '../scheduler/fsrs';
import { Grade } from '../scheduler/rating';
import { newPointCard, reviewPointCard, type PointCard } from '../scheduler/cards';
import { mulberry32 } from '../util/rng';
import { buildChapterSession, chapterCardKeys, chapterProgress, nextChapter } from './books';

const item = (id: string, skill = 'form'): Item =>
	ItemSchema.parse({
		id,
		type: 'cloze',
		level: 'A2',
		skill,
		text: 'mit {{dem}} Bus',
		accepted: ['dem'],
		explanation: 'x',
		errorTags: ['case'],
		review: { status: 'verified', by: 'c', date: '2026-11-18' },
		source: 'book-variant',
		origin: { book: 'B', chapter: '1', mode: 'variant' }
	});

const books: PackedBook[] = [
	{
		slug: 'b',
		title: 'B',
		chapters: [
			{ id: '1', title: 'Eins', items: [item('p/b.001'), item('p/b.002'), item('q/b.001')] },
			{ id: '2', title: 'Zwei', items: [item('r/b.001', 'syntax')] }
		]
	}
];

const scheduler = createScheduler(0.9);
const now = new Date('2026-11-18T10:00:00Z');
/** A card reviewed Good `n` times, each when due. */
function card(pointId: string, skill: 'form' | 'syntax', goods: number): PointCard {
	let c = newPointCard(scheduler, pointId, skill, now);
	let at = now;
	for (let i = 0; i < goods; i++) {
		c = reviewPointCard(scheduler, c, Grade.Good, at).card;
		at = c.fsrs.dueAt;
	}
	return c;
}

describe('book chapters', () => {
	it('a chapter reviews the cards of its items’ points and skills', () => {
		expect(chapterCardKeys(books[0]!.chapters[0]!)).toEqual(['p:form', 'q:form']);
	});

	it('progress: answered items and the weakest card; missing cards count as new', () => {
		const strong = card('p', 'form', 6);
		const progress = chapterProgress(books, [strong], new Set(['p/b.001', 'p/b.002', 'x/1']));
		expect(progress.map((c) => [c.id, c.items, c.answered, c.mastery])).toEqual([
			['1', 3, 2, 'new'],
			['2', 1, 0, 'new']
		]);
		const both = chapterProgress(books, [strong, card('q', 'form', 6)], new Set());
		expect(both[0]!.mastery).toBe(strong.fsrs.stability >= 90 ? 'mastered' : 'strong');
	});

	it('Today offers the first chapter that is unanswered or below strong', () => {
		const strongP = card('p', 'form', 6);
		const strongQ = card('q', 'form', 6);
		const all = new Set(['p/b.001', 'p/b.002', 'q/b.001', 'r/b.001']);
		expect(nextChapter(chapterProgress(books, [], new Set()))?.id).toBe('1');
		expect(nextChapter(chapterProgress(books, [strongP, strongQ], all))?.id).toBe('2');
		const done = chapterProgress(books, [strongP, strongQ, card('r', 'syntax', 6)], all);
		expect(nextChapter(done)).toBeUndefined();
	});

	it('chapter session: every item once (up to 10), with the right point and card key', () => {
		const steps = buildChapterSession(books[0]!.chapters[0]!, { rng: mulberry32(1) });
		expect(steps.map((s) => s.item.id).sort()).toEqual(['p/b.001', 'p/b.002', 'q/b.001']);
		for (const s of steps) {
			expect(s.source).toBe('chapter');
			expect(s.cardKey).toBe(`${s.pointId}:form`);
			expect(s.item.id.startsWith(`${s.pointId}/`)).toBe(true);
		}
		expect(
			buildChapterSession(books[0]!.chapters[0]!, { rng: mulberry32(1), count: 2 })
		).toHaveLength(2);
	});
});
