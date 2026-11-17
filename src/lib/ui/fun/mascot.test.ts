import { describe, expect, it } from 'vitest';
import { MOODS, MOOD_LABELS, toMood } from './mascot';

describe('mascot moods', () => {
	it('has at least the five moods required by P1.11, each with a label', () => {
		for (const m of ['loaf', 'smug', 'flat-on-keyboard', 'crying-thumbs-up', 'sleeping'])
			expect(MOODS).toContain(m);
		for (const m of MOODS) expect(MOOD_LABELS[m]).toBeTruthy();
	});
	it('falls back to loaf for moods without a drawing', () => {
		expect(toMood('zoomies')).toBe('loaf');
		expect(toMood(undefined)).toBe('loaf');
		expect(toMood('smug')).toBe('smug');
	});
});
