/**
 * Mastery level of a card from its FSRS stability in days (ARCHITECTURE §5.2):
 * New → Learning (< 3 d) → Familiar (< 21 d) → Strong (< 90 d) → Mastered (≥ 90 d).
 */
export const MASTERY_LEVELS = ['new', 'learning', 'familiar', 'strong', 'mastered'] as const;
export type Mastery = (typeof MASTERY_LEVELS)[number];

export function masteryOf(card: { reps: number; stability: number }): Mastery {
	if (card.reps === 0) return 'new';
	if (card.stability < 3) return 'learning';
	if (card.stability < 21) return 'familiar';
	if (card.stability < 90) return 'strong';
	return 'mastered';
}

/** The weakest of several cards (a point's mastery is its weakest skill's). */
export function weakestMastery(levels: readonly Mastery[]): Mastery {
	if (!levels.length) return 'new';
	return levels.reduce((a, b) => (MASTERY_LEVELS.indexOf(a) <= MASTERY_LEVELS.indexOf(b) ? a : b));
}
