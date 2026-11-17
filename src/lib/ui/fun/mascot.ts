/**
 * The mascot (docs/THEME_AND_FUN.md §1). Its name lives here and only here, so AJ can
 * rename the cat in one place.
 */
export const MASCOT_NAME = 'Dativ';

/** Moods with an original drawing in Mascot.svelte. */
export const MOODS = [
	'loaf',
	'smug',
	'sleeping',
	'flat-on-keyboard',
	'crying-thumbs-up',
	'judging',
	'box'
] as const;

export type Mood = (typeof MOODS)[number];

/** Moods named in THEME_AND_FUN.md that have no drawing yet fall back to `loaf`. */
export function toMood(value: string | undefined): Mood {
	return (MOODS as readonly string[]).includes(value ?? '') ? (value as Mood) : 'loaf';
}

export const MOOD_LABELS: Record<Mood, string> = {
	loaf: 'sitting like a loaf of bread',
	smug: 'looking smug',
	sleeping: 'curled up asleep',
	'flat-on-keyboard': 'lying flat on a keyboard',
	'crying-thumbs-up': 'crying but giving a thumbs up',
	judging: 'judging you silently',
	box: 'peeking out of a cardboard box'
};
