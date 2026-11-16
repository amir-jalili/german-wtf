import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCurriculum } from './curriculum-md';

describe('parseCurriculum', () => {
	it('parses id, level, titles and prerequisites from a line', () => {
		const md = `## A1 (2 points)\n\n- \`present-regular\` — **Präsens: regelmäßige Verben** · present tense, regular verbs ⟵ pronouns-nominative\n- \`noun-gender-articles\` — **Genus und Artikel** · gender and articles\n\n## Contrast drills\n- \`x\` — **y**\n`;
		expect(parseCurriculum(md)).toEqual([
			{
				id: 'present-regular',
				level: 'A1',
				titleDe: 'Präsens: regelmäßige Verben',
				titleEn: 'present tense, regular verbs',
				prerequisites: ['pronouns-nominative']
			},
			{
				id: 'noun-gender-articles',
				level: 'A1',
				titleDe: 'Genus und Artikel',
				titleEn: 'gender and articles',
				prerequisites: []
			}
		]);
	});

	it('handles a parenthetical example without an English gloss', () => {
		const md = `## A1\n- \`present-stem-change\` — **Präsens mit Vokalwechsel** (e→i, e→ie) ⟵ present-regular\n`;
		const [p] = parseCurriculum(md);
		expect(p?.titleEn).toBeUndefined();
		expect(p?.prerequisites).toEqual(['present-regular']);
	});

	it('finds all 162 points in the real curriculum', () => {
		const points = parseCurriculum(readFileSync('docs/CURRICULUM.md', 'utf8'));
		expect(points).toHaveLength(162);
		expect(new Set(points.map((p) => p.id)).size).toBe(162);
	});
});
