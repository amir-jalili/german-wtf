/**
 * `pnpm content:validate` — quality gate 1 (CONTENT_GUIDE §6): schema and consistency checks
 * on content/catalogue.yaml and content/points/**. Exits 1 on any problem.
 */
import { readFileSync } from 'node:fs';
import { parseCurriculum } from './lib/curriculum-md.ts';
import { readFun } from './lib/fun.ts';
import { readCatalogue, readPointFiles } from './lib/load-content.ts';
import { isServable, validateCatalogue, validatePoints, type Problem } from './lib/validate.ts';

export async function runValidation(): Promise<{ problems: Problem[]; summary: string }> {
	const catalogue = readCatalogue();
	const curriculum = parseCurriculum(readFileSync('docs/CURRICULUM.md', 'utf8'));
	const problems = validateCatalogue(catalogue, curriculum);
	const { files, problems: parseProblems } = await readPointFiles();
	const fun = readFun();
	problems.push(...parseProblems, ...validatePoints(files, catalogue), ...fun.problems);
	const items = files.flatMap((f) => f.point.items);
	const summary = `${catalogue.points.length} catalogue points · ${files.length} point files · ${items.length} items (${items.filter(isServable).length} servable) · ${fun.content.messages.length} fun lines, ${fun.content.memes.length} memes`;
	return { problems, summary };
}

const { problems, summary } = await runValidation();
if (problems.length) {
	console.error(`content:validate — ${problems.length} problem(s):`);
	for (const p of problems) console.error(`  ✗ ${p.where}: ${p.message}`);
	process.exit(1);
}
console.log(`content:validate ✓ ${summary}`);
