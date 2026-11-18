/**
 * Book content (ADR 0003): reads the private repo in content/books/, validates it with the
 * same gates as public content plus book-specific rules, and builds the importable pack.
 * Reading does file I/O; `validateBooks` and `buildPack` are pure so they can be unit-tested.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import {
	BOOK_PACK_FORMAT,
	BOOK_PACK_VERSION,
	BookSchema,
	ChapterFileSchema,
	itemBookSlug,
	itemPointId,
	type Book,
	type BookPack,
	type ChapterFile,
	type PackedBook
} from '#lib/engine/content/books.js';
import { CONTENT_SCHEMA_VERSION, type Catalogue } from '#lib/engine/content/schema.js';
import { formatZodIssues } from './load-content.ts';
import {
	correctSentences,
	isServable,
	MAX_WORDS,
	normaliseSentence,
	validateItem,
	wordCount,
	type Problem
} from './validate.ts';

/** The private repo's clone (git-ignored here). */
export const BOOKS_REPO_DIR = path.join('content', 'books');
export const BOOKS_DIR = path.join(BOOKS_REPO_DIR, 'books');

export interface ChapterSource {
	path: string;
	chapter: ChapterFile;
}

export interface BookSource {
	/** Folder name under books/. */
	dir: string;
	path: string;
	book: Book;
	chapters: ChapterSource[];
}

/** Reads every book folder; schema failures become problems. A missing folder means no books. */
export async function readBooks(
	dir = BOOKS_DIR
): Promise<{ books: BookSource[]; problems: Problem[] }> {
	const books: BookSource[] = [];
	const problems: Problem[] = [];
	if (!existsSync(dir)) return { books, problems };
	const folders = (await readdir(dir, { withFileTypes: true }))
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();
	for (const folder of folders) {
		const bookPath = path.join(dir, folder, 'book.yaml');
		if (!existsSync(bookPath)) {
			problems.push({ where: path.join(dir, folder), message: 'missing book.yaml' });
			continue;
		}
		const parsedBook = BookSchema.safeParse(parse(readFileSync(bookPath, 'utf8')));
		if (!parsedBook.success) {
			problems.push(...formatZodIssues(bookPath, parsedBook.error));
			continue;
		}
		const chapters: ChapterSource[] = [];
		const files = (await readdir(path.join(dir, folder), { withFileTypes: true }))
			.filter((e) => e.isFile() && /\.ya?ml$/.test(e.name) && e.name !== 'book.yaml')
			.map((e) => path.join(dir, folder, e.name))
			.sort();
		for (const file of files) {
			const parsed = ChapterFileSchema.safeParse(parse(readFileSync(file, 'utf8')));
			if (parsed.success) chapters.push({ path: file, chapter: parsed.data });
			else problems.push(...formatZodIssues(file, parsed.error));
		}
		books.push({ dir: folder, path: bookPath, book: parsedBook.data, chapters });
	}
	return { books, problems };
}

/**
 * Book rules on top of the item gates (CONTENT_GUIDE §1, §6): folder = slug, chapter file =
 * chapter id listed in book.yaml, item ids carry the book slug and a catalogued point,
 * `origin` matches the file and `source` matches `origin.mode`; ids and sentences unique
 * across all books and the public content.
 */
export function validateBooks(
	books: readonly BookSource[],
	catalogue: Catalogue,
	publicItemIds: ReadonlySet<string> = new Set()
): Problem[] {
	const problems: Problem[] = [];
	const points = new Map(catalogue.points.map((p) => [p.id, p]));
	const slugs = new Set<string>();
	const seenIds = new Map<string, string>();
	const seenSentences = new Map<string, string>();

	for (const { dir, path: bookPath, book, chapters } of books) {
		if (book.slug !== dir)
			problems.push({ where: bookPath, message: `slug "${book.slug}" ≠ folder "${dir}"` });
		if (slugs.has(book.slug))
			problems.push({ where: bookPath, message: `book slug "${book.slug}" used twice` });
		slugs.add(book.slug);
		const chapterIds = book.chapters.map((c) => c.id);
		if (new Set(chapterIds).size !== chapterIds.length)
			problems.push({ where: bookPath, message: 'duplicate chapter id' });
		const filesByChapter = new Set<string>();

		for (const { path: file, chapter } of chapters) {
			const fileId = path.basename(file).replace(/\.ya?ml$/, '');
			if (chapter.chapter !== fileId)
				problems.push({ where: file, message: `chapter "${chapter.chapter}" ≠ file name` });
			if (chapter.book !== book.slug)
				problems.push({ where: file, message: `book "${chapter.book}" ≠ "${book.slug}"` });
			if (!chapterIds.includes(chapter.chapter))
				problems.push({ where: file, message: `chapter "${chapter.chapter}" not in book.yaml` });
			if (filesByChapter.has(chapter.chapter))
				problems.push({ where: file, message: `chapter "${chapter.chapter}" defined twice` });
			filesByChapter.add(chapter.chapter);

			for (const item of chapter.items) {
				const where = `${file} › ${item.id}`;
				const pointId = itemPointId(item.id);
				const point = points.get(pointId);
				if (!point) problems.push({ where, message: `point "${pointId}" is not in the catalogue` });
				else if (item.level !== point.level)
					problems.push({ where, message: `level ${item.level} ≠ point level ${point.level}` });
				if (itemBookSlug(item.id) !== book.slug)
					problems.push({ where, message: `id must be ${pointId}/${book.slug}.<nnn>` });
				if (publicItemIds.has(item.id))
					problems.push({ where, message: 'id is also used by public content' });
				const dup = seenIds.get(item.id);
				if (dup) problems.push({ where, message: `duplicate item id (also in ${dup})` });
				seenIds.set(item.id, file);

				if (!item.origin) problems.push({ where, message: 'book items need an origin' });
				else {
					if (item.origin.chapter !== chapter.chapter)
						problems.push({
							where,
							message: `origin.chapter "${item.origin.chapter}" ≠ "${chapter.chapter}"`
						});
					if (item.origin.book !== book.title)
						problems.push({ where, message: `origin.book must be "${book.title}"` });
					const expected = item.origin.mode === 'exact' ? 'book-exact' : 'book-variant';
					if (item.source !== expected)
						problems.push({
							where,
							message: `source must be ${expected} for origin.mode ${item.origin.mode}`
						});
				}
				problems.push(...validateItem(item, where));
				if (item.retired) continue;
				for (const sentence of correctSentences(item)) {
					const key = normaliseSentence(sentence);
					const first = seenSentences.get(key);
					if (first && first !== item.id)
						problems.push({ where, message: `duplicate sentence (same as ${first})` });
					seenSentences.set(key, item.id);
					// The book's own sentence may be longer than our limits; our variants may not.
					const max = MAX_WORDS[item.level];
					if (item.origin?.mode !== 'exact' && max && wordCount(sentence) > max)
						problems.push({ where, message: `${wordCount(sentence)} words > ${max} allowed` });
				}
			}
		}
	}
	return problems;
}

/** The importable pack: servable items only, chapters in book order, empty chapters kept out. */
export function buildPack(books: readonly BookSource[], now: Date): BookPack {
	const packed: PackedBook[] = books
		.map(({ book, chapters }) => ({
			slug: book.slug,
			title: book.title,
			chapters: book.chapters
				.map((c) => ({
					id: c.id,
					title: c.title,
					items: chapters
						.filter((s) => s.chapter.chapter === c.id)
						.flatMap((s) => s.chapter.items.filter(isServable))
				}))
				.filter((c) => c.items.length > 0)
		}))
		.filter((b) => b.chapters.length > 0);
	return {
		format: BOOK_PACK_FORMAT,
		version: BOOK_PACK_VERSION,
		contentSchemaVersion: CONTENT_SCHEMA_VERSION,
		createdAt: now.toISOString(),
		hash: createHash('sha256').update(JSON.stringify(packed)).digest('hex').slice(0, 12),
		books: packed
	};
}

export function packFileName(now: Date): string {
	return `book-pack-${now.toISOString().slice(0, 10)}.json`;
}
