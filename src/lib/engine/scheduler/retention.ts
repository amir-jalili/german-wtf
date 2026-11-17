/** Target-retention bounds (ADR 0007). Separate from fsrs.ts so Settings can import it without ts-fsrs. */
export const DEFAULT_RETENTION = 0.9;
export const MIN_RETENTION = 0.7;
export const MAX_RETENTION = 0.97;

export function clampRetention(value: number): number {
	if (!Number.isFinite(value)) return DEFAULT_RETENTION;
	return Math.min(MAX_RETENTION, Math.max(MIN_RETENTION, value));
}
