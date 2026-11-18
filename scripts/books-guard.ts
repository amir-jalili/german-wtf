/**
 * `pnpm books:guard` — runs after the build in `pnpm verify` (so in CI and before every
 * deploy): fails if any book item, `origin` or book pack is in static/content/ or build/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { findBookLeaks, isPackFileName, type Leak } from './lib/books-guard.ts';

const ROOTS = [path.join('static', 'content'), 'build'];
const leaks: Leak[] = [];
let scanned = 0;
for (const root of ROOTS) {
	if (!existsSync(root)) continue;
	for (const entry of await readdir(root, { withFileTypes: true, recursive: true })) {
		if (!entry.isFile()) continue;
		const file = path.join(entry.parentPath, entry.name);
		if (isPackFileName(file)) leaks.push({ where: file, message: 'book-pack file in the build' });
		if (!entry.name.endsWith('.json') && !entry.name.endsWith('.webmanifest')) continue;
		scanned += 1;
		let json: unknown;
		try {
			json = JSON.parse(readFileSync(file, 'utf8'));
		} catch {
			continue;
		}
		leaks.push(...findBookLeaks(json, file));
	}
}
if (leaks.length) {
	console.error(`books:guard — ${leaks.length} leak(s) of book content into the public build:`);
	for (const l of leaks.slice(0, 50)) console.error(`  ✗ ${l.where}: ${l.message}`);
	process.exit(1);
}
console.log(`books:guard ✓ no book content in ${scanned} public JSON files`);
