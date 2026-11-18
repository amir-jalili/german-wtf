/**
 * Book packs (ADR 0003, ARCHITECTURE §8): items made from AJ's grammar books. They live in
 * the private repo cloned into `content/books/` and reach the phone as an imported JSON pack,
 * never through the public build. Pure schemas and helpers; file I/O is in scripts/lib/books.ts
 * and storage in src/lib/db/books.ts.
 *
 * Source layout (private repo):
 *   books/<slug>/book.yaml        { slug, title, chapters: [{ id, title }] }
 *   books/<slug>/<chapter>.yaml   { book: <slug>, chapter: <id>, items: [...] }
 */
import { z } from 'zod';
import { CONTENT_SCHEMA_VERSION, ItemSchema, type Item } from './schema';

const Kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Short, stable, kebab-case, e.g. `grammatik-aktiv-b2c1`. Part of every item id. */
export const BookSlugSchema = z.string().regex(Kebab, 'book slug must be kebab-case');
/** As in the book, lower-case, e.g. `12` or `3a`. Also the chapter file name. */
export const ChapterIdSchema = z.string().regex(Kebab, 'chapter id must be kebab-case, e.g. 12');

export const BookSchema = z.object({
	slug: BookSlugSchema,
	title: z.string().min(1),
	chapters: z
		.array(z.object({ id: ChapterIdSchema, title: z.string().min(1) }))
		.min(1, 'a book needs at least one chapter')
});

export const ChapterFileSchema = z.object({
	book: BookSlugSchema,
	chapter: ChapterIdSchema,
	items: z.array(ItemSchema).default([])
});

export const BOOK_PACK_FORMAT = 'german-wtf-book-pack';
export const BOOK_PACK_VERSION = 1;

export const PackedChapterSchema = z.object({
	id: ChapterIdSchema,
	title: z.string().min(1),
	items: z.array(ItemSchema)
});

export const PackedBookSchema = z.object({
	slug: BookSlugSchema,
	title: z.string().min(1),
	chapters: z.array(PackedChapterSchema).min(1)
});

/** The file `pnpm books:pack` writes and Settings → Import book pack reads. */
export const BookPackSchema = z.object({
	format: z.literal(BOOK_PACK_FORMAT),
	version: z.literal(BOOK_PACK_VERSION),
	contentSchemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
	createdAt: z.string().min(1),
	/** Content hash of `books`, to tell packs apart. */
	hash: z.string().min(1),
	books: z.array(PackedBookSchema).min(1)
});

export type Book = z.infer<typeof BookSchema>;
export type ChapterFile = z.infer<typeof ChapterFileSchema>;
export type PackedChapter = z.infer<typeof PackedChapterSchema>;
export type PackedBook = z.infer<typeof PackedBookSchema>;
export type BookPack = z.infer<typeof BookPackSchema>;

/** The grammar point an item belongs to: the part of its id before `/`. */
export function itemPointId(itemId: string): string {
	return itemId.slice(0, itemId.indexOf('/'));
}

/** The book slug inside a book item's id (`point/<slug>.001`), or undefined for public items. */
export function itemBookSlug(itemId: string): string | undefined {
	const rest = itemId.slice(itemId.indexOf('/') + 1);
	const dot = rest.lastIndexOf('.');
	return dot > 0 ? rest.slice(0, dot) : undefined;
}

/** Whether an item came from a book (any of the three markers). */
export function isBookItem(item: Pick<Item, 'id' | 'source' | 'origin'>): boolean {
	return Boolean(item.origin) || item.source.startsWith('book-') || Boolean(itemBookSlug(item.id));
}

/** Book items grouped by grammar point, in book and chapter order. */
export function bookItemsByPoint(books: readonly PackedBook[]): Map<string, Item[]> {
	const byPoint = new Map<string, Item[]>();
	for (const book of books)
		for (const chapter of book.chapters)
			for (const item of chapter.items) {
				const pointId = itemPointId(item.id);
				byPoint.set(pointId, [...(byPoint.get(pointId) ?? []), item]);
			}
	return byPoint;
}

/** Public items plus book items, per point (a new map; inputs are not changed). */
export function mergeItemsByPoint(
	base: ReadonlyMap<string, readonly Item[]>,
	extra: ReadonlyMap<string, readonly Item[]>
): Map<string, Item[]> {
	const merged = new Map<string, Item[]>([...base].map(([id, items]) => [id, [...items]]));
	for (const [id, items] of extra) merged.set(id, [...(merged.get(id) ?? []), ...items]);
	return merged;
}
