/**
 * Loads compiled content bundles (static/content/*.json) on demand and caches them in
 * memory. The service worker precaches the files, so this works offline (ADR 0005).
 */
import { resolve } from '$app/paths';
import { CONTENT_SCHEMA_VERSION, type GrammarPoint } from '#lib/engine/content/schema.js';
import type { Level } from '#lib/engine/content/levels.js';
import type { FunContent } from '#lib/engine/fun/schema.js';
import type { CompiledCatalogue, CompiledLevel, ContentIndex } from './types.js';

const cache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(file: string): Promise<T> {
	const key = file;
	let pending = cache.get(key) as Promise<T> | undefined;
	if (!pending) {
		pending = (async () => {
			const response = await fetch(`${resolve('/')}content/${file}`);
			if (!response.ok) throw new Error(`Could not load content ${file} (${response.status})`);
			return (await response.json()) as T;
		})();
		cache.set(key, pending);
		pending.catch(() => cache.delete(key));
	}
	return pending;
}

export async function loadIndex(): Promise<ContentIndex> {
	const index = await fetchJson<ContentIndex>('index.json');
	if (index.schemaVersion !== CONTENT_SCHEMA_VERSION) {
		throw new Error(
			`Content schema ${index.schemaVersion} ≠ app schema ${CONTENT_SCHEMA_VERSION}; reload to update`
		);
	}
	return index;
}

export function loadCatalogue(): Promise<CompiledCatalogue> {
	return fetchJson<CompiledCatalogue>('catalogue.json');
}

export function loadLevel(level: Level): Promise<CompiledLevel> {
	return fetchJson<CompiledLevel>(`${level}.json`);
}

/** Finds one grammar point by id (loads its level's bundle via the catalogue). */
export async function loadPoint(id: string): Promise<GrammarPoint | undefined> {
	const catalogue = await loadCatalogue();
	const entry = catalogue.points.find((p) => p.id === id);
	if (!entry) return undefined;
	const bundle = await loadLevel(entry.level);
	return bundle.points.find((p) => p.id === id);
}

/** Fun lines and memes (THEME_AND_FUN.md §2). Never throws: fun is optional. */
export async function loadFun(): Promise<FunContent> {
	try {
		return await fetchJson<FunContent>('fun.json');
	} catch {
		return { messages: [], memes: [] };
	}
}
