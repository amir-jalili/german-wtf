/** Fun content (docs/THEME_AND_FUN.md §2): sarcastic lines and meme metadata, as data. */
import { z } from 'zod';

export const FUN_TRIGGERS = [
	'first-session',
	'session-done',
	'perfect-session',
	'point-learned',
	'point-mastered',
	'level-complete',
	'wrong-streak-3',
	'near-miss',
	'leech',
	'mistake-resolved',
	'streak-7',
	'streak-30',
	'comeback',
	'late-night',
	'nothing-due',
	'app-update',
	'error-page'
] as const;
export const FunTriggerSchema = z.enum(FUN_TRIGGERS);
export type FunTrigger = z.infer<typeof FunTriggerSchema>;

/** Milestones always show at chaos level "some"; everything else is an "extra". */
export const MILESTONES: readonly FunTrigger[] = [
	'first-session',
	'perfect-session',
	'point-learned',
	'point-mastered',
	'level-complete',
	'streak-7',
	'streak-30',
	'comeback'
];

/** All moods named in THEME_AND_FUN.md §1 (the UI falls back to `loaf` for undrawn ones). */
export const ALL_MOODS = [
	'smug',
	'loaf',
	'sleeping',
	'flat-on-keyboard',
	'crying-thumbs-up',
	'knocking-things-off-table',
	'box',
	'zoomies',
	'judging'
] as const;

const FunId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'fun id must be kebab-case');

export const FunMessageSchema = z.object({
	id: FunId,
	text: z.string().min(1).max(200),
	triggers: z.array(FunTriggerSchema).min(1),
	mood: z.enum(ALL_MOODS).optional(),
	/** Show this meme image with the line. */
	meme: FunId.optional(),
	lang: z.enum(['en', 'de']),
	by: z.enum(['aj', 'claude']),
	added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
export type FunMessage = z.infer<typeof FunMessageSchema>;

export const MemeSchema = z.object({
	id: FunId,
	/** File name in static/fun/memes/. */
	file: z.string().regex(/^[a-z0-9-]+\.(?:jpe?g|png|gif|webp)$/, 'kebab-case image file name'),
	alt: z.string().min(1),
	triggers: z.array(FunTriggerSchema).min(1),
	by: z.enum(['aj', 'claude'])
});
export type Meme = z.infer<typeof MemeSchema>;

export const FunMessagesSchema = z.array(FunMessageSchema);
export const MemesSchema = z.array(MemeSchema);

export interface FunContent {
	messages: FunMessage[];
	memes: Meme[];
}
