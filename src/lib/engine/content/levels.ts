/**
 * CEFR levels in curriculum order. Shared by the catalogue validator, the
 * grammar map and the session builder, so the order lives in exactly one place.
 */
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type Level = (typeof LEVELS)[number];

export function isLevel(value: unknown): value is Level {
	return typeof value === 'string' && (LEVELS as readonly string[]).includes(value);
}

/** 0 for A1 … 5 for C2. Lets callers compare levels (`levelIndex(a) <= levelIndex(b)`). */
export function levelIndex(level: Level): number {
	return LEVELS.indexOf(level);
}
