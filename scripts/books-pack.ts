/**
 * `pnpm books:pack` — validates content/books/ and writes the importable pack to
 * private-dist/book-pack-<date>.json (git-ignored, never deployed; ADR 0003).
 * AJ imports it in Settings → Import book pack (on iPhone via Files / iCloud Drive / AirDrop).
 * `--dir <repo>` and `--out <folder>` override the defaults.
 * `--dev` (run by `pnpm dev`): writes private-dist/dev-book-pack.json for the dev server
 * instead, and with no books or problems it removes that file rather than failing.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BOOKS_REPO_DIR, buildPack, packFileName, readBooks, validateBooks } from './lib/books.ts';
import { readCatalogue, readPointFiles } from './lib/load-content.ts';

const arg = (name: string, fallback: string): string => {
	const i = process.argv.indexOf(name);
	return i > 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};
const repo = arg('--dir', BOOKS_REPO_DIR);
const outDir = arg('--out', 'private-dist');
const dev = process.argv.includes('--dev');
const DEV_PACK_FILE = path.join('private-dist', 'dev-book-pack.json');

const { books, problems } = await readBooks(path.join(repo, 'books'));
const { files } = await readPointFiles();
const publicIds = new Set(files.flatMap((f) => f.point.items.map((i) => i.id)));
problems.push(...validateBooks(books, readCatalogue(), publicIds));
const now = new Date();
const pack = buildPack(books, now);
if (dev) {
	rmSync(DEV_PACK_FILE, { force: true });
	if (problems.length)
		console.warn(`books:pack --dev: ${problems.length} problem(s), run pnpm books:validate`);
	else if (pack.books.length) {
		mkdirSync(path.dirname(DEV_PACK_FILE), { recursive: true });
		writeFileSync(DEV_PACK_FILE, JSON.stringify(pack));
		console.log(`books:pack --dev ✓ ${pack.books.length} book(s) for the dev server`);
	}
	process.exit(0);
}
if (problems.length) {
	for (const p of problems) console.error(`  ✗ ${p.where}: ${p.message}`);
	throw new Error(`books:pack aborted: ${problems.length} problem(s)`);
}
if (!pack.books.length) throw new Error(`books:pack: no verified book items in ${repo}/books`);
mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, packFileName(now));
writeFileSync(file, JSON.stringify(pack));
const items = pack.books.flatMap((b) => b.chapters.flatMap((c) => c.items)).length;
console.log(
	`books:pack ✓ ${pack.books.length} book(s), ${items} items → ${file} (hash ${pack.hash})`
);
