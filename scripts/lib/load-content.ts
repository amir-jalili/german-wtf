/** File I/O for content: reads catalogue.yaml and every point file, parsed with Zod. */
import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { CatalogueSchema, GrammarPointSchema, type Catalogue } from '#lib/engine/content/schema.js';
import type { PointFile, Problem } from './validate.ts';

export const CONTENT_DIR = 'content';
export const CATALOGUE_PATH = path.join(CONTENT_DIR, 'catalogue.yaml');
export const POINTS_DIR = path.join(CONTENT_DIR, 'points');

export function readCatalogue(): Catalogue {
	return CatalogueSchema.parse(parse(readFileSync(CATALOGUE_PATH, 'utf8')));
}

export async function listYamlFiles(dir: string): Promise<string[]> {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true, recursive: true });
	} catch {
		return [];
	}
	return entries
		.filter((e) => e.isFile() && /\.ya?ml$/.test(e.name))
		.map((e) => path.join(e.parentPath, e.name))
		.sort();
}

/** Parses every point file; schema failures become problems instead of throwing. */
export async function readPointFiles(
	dir = POINTS_DIR
): Promise<{ files: PointFile[]; problems: Problem[] }> {
	const files: PointFile[] = [];
	const problems: Problem[] = [];
	for (const file of await listYamlFiles(dir)) {
		const result = GrammarPointSchema.safeParse(parse(readFileSync(file, 'utf8')));
		if (result.success) files.push({ path: file, point: result.data });
		else problems.push(...formatZodIssues(file, result.error));
	}
	return { files, problems };
}

export function formatZodIssues(where: string, error: z.ZodError): Problem[] {
	return error.issues.map((issue) => ({
		where: `${where} › ${issue.path.join('.') || '(root)'}`,
		message: issue.message
	}));
}
