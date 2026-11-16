/** Small deterministic PRNG (mulberry32) + helpers; seeded so sessions and tests are reproducible. */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** FNV-1a 32-bit hash of a string, for seeding from ids. */
export function hashString(text: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[out[i], out[j]] = [out[j]!, out[i]!];
	}
	return out;
}

/** Shuffles so that the result differs from the input order when possible (for order tiles). */
export function shuffleDifferent<T>(items: readonly T[], rng: Rng): T[] {
	if (items.length < 2) return [...items];
	for (let attempt = 0; attempt < 10; attempt++) {
		const out = shuffle(items, rng);
		if (out.some((item, i) => item !== items[i])) return out;
	}
	return [...items.slice(1), items[0]!];
}
