/**
 * Parses docs/CURRICULUM.md into a list of points so the catalogue validator can check
 * that content/catalogue.yaml and the human-readable curriculum never drift apart.
 *
 * Line format (see CURRICULUM.md): - `id` — **Deutsch** · English ⟵ prereq-a, prereq-b
 */
import { isLevel, type Level } from '#lib/engine/content/levels.js';

export interface CurriculumPoint {
	id: string;
	level: Level;
	titleDe: string;
	/** English gloss after " · ", if present. */
	titleEn?: string;
	prerequisites: string[];
}

const LEVEL_HEADING = /^## (A1|A2|B1|B2|C1|C2)\b/;
const POINT_LINE = /^- `([a-z0-9-]+)` — \*\*(.+?)\*\*(.*)$/;

export function parseCurriculum(markdown: string): CurriculumPoint[] {
	const points: CurriculumPoint[] = [];
	let level: Level | undefined;
	for (const raw of markdown.split('\n')) {
		const line = raw.trim();
		const heading = LEVEL_HEADING.exec(line);
		if (heading) {
			level = isLevel(heading[1]) ? heading[1] : undefined;
			continue;
		}
		if (line.startsWith('## ')) {
			level = undefined; // any other section (contrast drills …)
			continue;
		}
		const match = POINT_LINE.exec(line);
		if (!match || !level) continue;
		const [, id, titleDe, rest = ''] = match;
		const [beforeArrow, afterArrow] = rest.split('⟵');
		const prerequisites = (afterArrow ?? '')
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);
		const enMatch = /·\s*(.+?)\s*$/.exec(beforeArrow ?? '');
		const titleEn = enMatch?.[1]?.replace(/\s*\(.*\)\s*$/, '').trim() || undefined;
		points.push({ id: id ?? '', level, titleDe: titleDe ?? '', titleEn, prerequisites });
	}
	return points;
}
