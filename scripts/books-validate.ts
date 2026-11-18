/**
 * `pnpm books:validate` — the content gates on AJ's private book repo in content/books/
 * (ADR 0003). `--dir <path>` validates another folder (tests use tests/fixtures/books).
 * No clone → nothing to check, exit 0.
 */
import path from 'node:path';
import { BOOKS_REPO_DIR, readBooks, validateBooks } from './lib/books.ts';
import { readCatalogue, readPointFiles } from './lib/load-content.ts';

const flag = process.argv.indexOf('--dir');
const repo = flag > 0 ? (process.argv[flag + 1] ?? BOOKS_REPO_DIR) : BOOKS_REPO_DIR;
const { books, problems } = await readBooks(path.join(repo, 'books'));
if (!books.length && !problems.length) {
	console.log(`books:validate — no books in ${repo}/books (clone german-wtf-books there)`);
	process.exit(0);
}
const { files } = await readPointFiles();
const publicIds = new Set(files.flatMap((f) => f.point.items.map((i) => i.id)));
problems.push(...validateBooks(books, readCatalogue(), publicIds));
if (problems.length) {
	console.error(`books:validate — ${problems.length} problem(s):`);
	for (const p of problems) console.error(`  ✗ ${p.where}: ${p.message}`);
	process.exit(1);
}
const items = books.flatMap((b) => b.chapters.flatMap((c) => c.chapter.items));
console.log(`books:validate ✓ ${books.length} book(s) · ${items.length} items`);
