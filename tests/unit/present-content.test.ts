/**
 * Typed vs choice on REAL content (P2.8d): every cloze item that can be shown as multiple
 * choice must have exactly one right option, and every wrong option must be plainly wrong.
 */
import { describe, expect, it } from 'vitest';
import { checkItem } from '../../src/lib/engine/checker/item';
import { asChoice, presentItem } from '../../src/lib/engine/content/present';
import type { ClozeItem } from '../../src/lib/engine/content/schema';

describe('every real cloze item shown as choice has exactly one right option', async () => {
	const { readPointFiles } = await import('../../scripts/lib/load-content');
	const { files } = await readPointFiles();
	const items = files
		.flatMap((f) => f.point.items)
		.filter((i): i is ClozeItem => i.type === 'cloze');
	it('covers real content', () => expect(items.length).toBeGreaterThan(50));
	it.each(items.map((i) => [i.id, i] as const))('%s', (_, item) => {
		const choice = asChoice(item);
		if (!choice) {
			// multi-gap or no usable distractors: stays typed
			expect(presentItem(item, 'choice')).toBe(item);
			return;
		}
		for (const option of choice.options) {
			const verdict = checkItem(choice, { type: 'choice', option }).result.verdict;
			expect(verdict, option).toBe(option === choice.answer ? 'correct' : 'wrong');
			if (option !== choice.answer) {
				expect(checkItem(item, { type: 'cloze', gaps: [option] }).result.verdict, option).toBe(
					'wrong'
				);
			}
		}
	});
});
