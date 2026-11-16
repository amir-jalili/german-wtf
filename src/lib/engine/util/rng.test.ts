import { describe, expect, it } from 'vitest';
import { hashString, mulberry32, shuffle, shuffleDifferent } from './rng';

describe('rng', () => {
	it('is deterministic for a seed and in [0,1)', () => {
		const a = mulberry32(42);
		const b = mulberry32(42);
		const values = Array.from({ length: 5 }, () => a());
		expect(values).toEqual(Array.from({ length: 5 }, () => b()));
		expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
	});
	it('hashes strings stably', () => {
		expect(hashString('accusative-articles/001')).toBe(hashString('accusative-articles/001'));
		expect(hashString('a')).not.toBe(hashString('b'));
	});
	it('shuffles without losing items and shuffleDifferent changes the order', () => {
		const items = ['weil', 'ich', 'morgen', 'arbeiten', 'muss'];
		const out = shuffle(items, mulberry32(1));
		expect([...out].sort()).toEqual([...items].sort());
		for (let seed = 0; seed < 20; seed++) {
			expect(shuffleDifferent(items, mulberry32(seed))).not.toEqual(items);
		}
		expect(shuffleDifferent(['a', 'b'], mulberry32(3))).toEqual(['b', 'a']);
	});
});
