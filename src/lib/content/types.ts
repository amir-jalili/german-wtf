/** Shapes of the compiled JSON bundles written by scripts/content-compile.ts. */
import type { Level } from '#lib/engine/content/levels.js';
import type { CatalogueEntry, GrammarPoint } from '#lib/engine/content/schema.js';

export interface ContentIndex {
	schemaVersion: number;
	hash: string;
	generatedAt: string;
	levels: Record<Level, { file: string; hash: string; points: number; items: number }>;
}

export interface CompiledCatalogueEntry extends CatalogueEntry {
	hasLesson: boolean;
	itemCount: number;
}

export interface CompiledCatalogue {
	schemaVersion: number;
	points: CompiledCatalogueEntry[];
}

export interface CompiledLevel {
	level: Level;
	hash: string;
	points: GrammarPoint[];
}
