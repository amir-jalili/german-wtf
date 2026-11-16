/**
 * `pnpm content:compile` — validates all content, then writes the JSON bundles the app
 * loads at runtime (ARCHITECTURE §7):
 *   static/content/index.json       { schemaVersion, hash, levels: { A1: {file, hash, points, items} … } }
 *   static/content/catalogue.json   catalogue entries + hasLesson/itemCount per point
 *   static/content/<level>.json     { level, hash, points: [ grammar points with servable items only ] }
 * Draft/flagged/retired items are never written (CONTENT_GUIDE §6). Runs before every build.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { LEVELS } from '#lib/engine/content/levels.js';
import { CONTENT_SCHEMA_VERSION, type GrammarPoint } from '#lib/engine/content/schema.js';
import { parseCurriculum } from './lib/curriculum-md.ts';
import { readCatalogue, readPointFiles } from './lib/load-content.ts';
import { isServable, validateCatalogue, validatePoints } from './lib/validate.ts';

const OUT_DIR = path.join('static', 'content');

const catalogue = readCatalogue();
const curriculum = parseCurriculum(readFileSync('docs/CURRICULUM.md', 'utf8'));
const { files, problems: parseProblems } = await readPointFiles();
const problems = [
	...validateCatalogue(catalogue, curriculum),
	...parseProblems,
	...validatePoints(files, catalogue)
];
if (problems.length) {
	for (const p of problems) console.error(`  ✗ ${p.where}: ${p.message}`);
	throw new Error(`content:compile aborted: ${problems.length} validation problem(s)`);
}

const servablePoints: GrammarPoint[] = files.map(({ point }) => ({
	...point,
	items: point.items.filter(isServable)
}));
const byId = new Map(servablePoints.map((p) => [p.id, p]));

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const hashOf = (text: string): string =>
	createHash('sha256').update(text).digest('hex').slice(0, 12);

const levels: Record<string, { file: string; hash: string; points: number; items: number }> = {};
for (const level of LEVELS) {
	const points = servablePoints.filter((p) => p.level === level);
	const json = JSON.stringify({ level, points });
	const hash = hashOf(json);
	const file = `${level}.json`;
	writeFileSync(path.join(OUT_DIR, file), JSON.stringify({ level, hash, points }));
	levels[level] = {
		file,
		hash,
		points: points.length,
		items: points.reduce((n, p) => n + p.items.length, 0)
	};
}

const catalogueJson = {
	schemaVersion: CONTENT_SCHEMA_VERSION,
	points: catalogue.points.map((entry) => {
		const point = byId.get(entry.id);
		return { ...entry, hasLesson: Boolean(point), itemCount: point?.items.length ?? 0 };
	})
};
writeFileSync(path.join(OUT_DIR, 'catalogue.json'), JSON.stringify(catalogueJson));

const index = {
	schemaVersion: CONTENT_SCHEMA_VERSION,
	hash: hashOf(
		Object.values(levels)
			.map((l) => l.hash)
			.join('')
	),
	generatedAt: new Date().toISOString(),
	levels
};
writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));

const totalItems = Object.values(levels).reduce((n, l) => n + l.items, 0);
console.log(
	`content:compile ✓ ${servablePoints.length} points with lessons, ${totalItems} servable items → ${OUT_DIR}/ (hash ${index.hash})`
);
