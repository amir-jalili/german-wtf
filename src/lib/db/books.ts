/**
 * Imported book packs (ADR 0003, P2.9b). A pack replaces its books by slug; other books stay.
 * Answers to book items are in the review log like any answer, keyed by item id, so
 * re-importing or removing a book never touches progress.
 */
import { BookPackSchema, type BookPack } from '#lib/engine/content/books.js';
import type { GymDB, StoredBook } from './schema.js';

export class BookPackImportError extends Error {
	override name = 'BookPackImportError';
}

export interface BookImportSummary {
	books: { slug: string; title: string; chapters: number; items: number; replaced: boolean }[];
}

export function readBookPackText(text: string): BookPack {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new BookPackImportError('This file is not JSON.');
	}
	const parsed = BookPackSchema.safeParse(raw);
	if (!parsed.success) {
		const format = (raw as { format?: unknown } | null)?.format;
		if (format === 'german-wtf-book-pack')
			throw new BookPackImportError(
				'This book pack is from a different app version, or it is damaged. Update the app and make the pack again.'
			);
		throw new BookPackImportError('This is not a German WTF book pack.');
	}
	return parsed.data;
}

export async function importBookPack(
	db: GymDB,
	text: string,
	now = Date.now()
): Promise<BookImportSummary> {
	const pack = readBookPackText(text);
	const rows: StoredBook[] = pack.books.map((book) => ({
		...book,
		packHash: pack.hash,
		packCreatedAt: pack.createdAt,
		importedAt: now
	}));
	const existing = new Set(
		(await db.bookPacks.bulkGet(rows.map((r) => r.slug))).filter(Boolean).map((r) => r!.slug)
	);
	await db.bookPacks.bulkPut(rows);
	return {
		books: rows.map((b) => ({
			slug: b.slug,
			title: b.title,
			chapters: b.chapters.length,
			items: b.chapters.reduce((n, c) => n + c.items.length, 0),
			replaced: existing.has(b.slug)
		}))
	};
}

/** All imported books, by title. */
export async function loadBooks(db: GymDB): Promise<StoredBook[]> {
	const books = await db.bookPacks.toArray();
	return books.sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

/** Removes a book's items from the app. Its answers stay in the review log. */
export async function removeBook(db: GymDB, slug: string): Promise<void> {
	await db.bookPacks.delete(slug);
}
