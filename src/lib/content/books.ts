/**
 * Book items for the app (ADR 0003): the packs imported into IndexedDB, plus — in `pnpm dev`
 * only — the pack built from content/books/ at dev start (served by a dev-server middleware,
 * never part of a build), so new book items can be tried on the laptop without importing.
 */
import { resolve } from '$app/paths';
import { getDb, loadBooks, type StoredBook } from '#lib/db/index.js';
import { BookPackSchema, bookItemsByPoint } from '#lib/engine/content/books.js';
import type { Item } from '#lib/engine/content/schema.js';

export const DEV_PACK_PATH = '__dev/book-pack.json';

async function loadDevBooks(): Promise<StoredBook[]> {
	if (!import.meta.env.DEV) return [];
	try {
		const response = await fetch(`${resolve('/')}${DEV_PACK_PATH}`);
		if (!response.ok) return [];
		const pack = BookPackSchema.parse(await response.json());
		return pack.books.map((b) => ({
			...b,
			packHash: pack.hash,
			packCreatedAt: pack.createdAt,
			importedAt: Date.parse(pack.createdAt)
		}));
	} catch {
		return [];
	}
}

/** Imported books; in dev, content/books/ wins over an imported book with the same slug. */
export async function loadAllBooks(): Promise<StoredBook[]> {
	const [stored, dev] = await Promise.all([
		loadBooks(getDb()).catch((error: unknown) => {
			console.warn('Could not load book packs', error);
			return [];
		}),
		loadDevBooks()
	]);
	const devSlugs = new Set(dev.map((b) => b.slug));
	return [...stored.filter((b) => !devSlugs.has(b.slug)), ...dev];
}

/** Servable book items by point (packs contain only verified items; retired ones are skipped). */
export async function loadBookItemsByPoint(): Promise<Map<string, Item[]>> {
	const byPoint = bookItemsByPoint(await loadAllBooks());
	for (const [id, items] of byPoint)
		byPoint.set(
			id,
			items.filter((i) => !i.retired)
		);
	return byPoint;
}
