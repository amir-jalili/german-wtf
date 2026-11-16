import { describe, expect, it } from 'vitest';
import { isLevel, LEVELS, levelIndex } from './levels';

describe('levels', () => {
	it('lists the six CEFR levels in order', () => {
		expect(LEVELS).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
	});

	it('orders levels so that A1 < C2', () => {
		expect(levelIndex('A1')).toBeLessThan(levelIndex('C2'));
		expect(levelIndex('B1')).toBe(2);
	});

	it('recognises valid and rejects invalid level strings', () => {
		expect(isLevel('B2')).toBe(true);
		expect(isLevel('b2')).toBe(false);
		expect(isLevel(3)).toBe(false);
	});
});
