/**
 * Feature flags (CLAUDE.md §9): half-built features ship behind a flag so `main` is
 * always releasable. Flip a flag to true when the feature's phase is done.
 */
export const flags = {
	/** Book packs: import + "My books" tab (ROADMAP P2.9). */
	bookPacks: false,
	/** Optional BYOK AI tutor (Phase 7). */
	aiTutor: false,
	/** Dev-only pages under /dev (style guide, crash test, review queue). */
	devPages: true
} as const;

export type FlagName = keyof typeof flags;

export function isEnabled(flag: FlagName): boolean {
	return flags[flag];
}
