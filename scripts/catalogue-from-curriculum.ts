/**
 * One-off bootstrap (kept for reference): merges docs/CURRICULUM.md with a JSON of
 * {id: [titleEn, family, compareWith]} into content/catalogue.yaml.
 * Usage: tsx scripts/catalogue-from-curriculum.ts <meta.json>
 * After bootstrapping, catalogue.yaml is edited by hand; the validator keeps it in sync.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { stringify } from 'yaml';
import { parseCurriculum } from './lib/curriculum-md.ts';

const metaPath = process.argv[2];
if (!metaPath) throw new Error('usage: tsx scripts/catalogue-from-curriculum.ts <meta.json>');
const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as Record<
	string,
	[string, string, string[]]
>;
const points = parseCurriculum(readFileSync('docs/CURRICULUM.md', 'utf8')).map((p) => {
	const m = meta[p.id];
	if (!m) throw new Error(`no meta for ${p.id}`);
	return {
		id: p.id,
		title: { en: m[0], de: p.titleDe },
		level: p.level,
		family: m[1],
		prerequisites: p.prerequisites,
		compareWith: m[2]
	};
});
const header = `# Machine-readable catalogue of docs/CURRICULUM.md (ids, titles, level, family, prerequisites,
# compareWith). Edited by hand; \`pnpm content:validate\` checks it against CURRICULUM.md
# (ids, levels, German titles, prerequisites) and for cycles. IDs never change (CLAUDE.md §9).
`;
writeFileSync(
	'content/catalogue.yaml',
	header + stringify({ schemaVersion: 1, points }, { lineWidth: 120 })
);
console.log(`wrote content/catalogue.yaml with ${points.length} points`);
