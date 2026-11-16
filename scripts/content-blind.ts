/**
 * `tsx scripts/content-blind.ts <point-id>` — prints a point's items WITHOUT answers, as the
 * questionnaire for the blind-solve gate (CONTENT_GUIDE §6.3): a fresh Claude context solves
 * it, and the answers are compared with the keys.
 */
import { readPointFiles } from './lib/load-content.ts';

const pointId = process.argv[2];
if (!pointId) throw new Error('usage: tsx scripts/content-blind.ts <point-id>');
const { files } = await readPointFiles();
const file = files.find((f) => f.point.id === pointId);
if (!file) throw new Error(`no point file for ${pointId}`);

for (const item of file.point.items) {
	const hint = item.hint ? ` ${item.hint}` : '';
	const prompt = item.prompt ? ` — ${item.prompt}` : '';
	switch (item.type) {
		case 'cloze':
			console.log(
				`${item.id} [cloze]${prompt}: ${item.text.replace(/\{\{[^{}]+\}\}/g, '___')}${hint}`
			);
			break;
		case 'choice':
			console.log(
				`${item.id} [choice]${prompt}: ${item.text}${hint}  options: ${item.options.join(' | ')}`
			);
			break;
		case 'order':
			console.log(
				`${item.id} [order]${prompt}: "${item.prefix ?? ''}" + tiles [${item.tiles.join(', ')}] + "${item.suffix ?? ''}"`
			);
			break;
	}
}
