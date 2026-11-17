/**
 * Typed vs choice (P2.8d). A one-gap cloze item can be shown as multiple choice: the correct
 * option is the canonical answer, the wrong options are the item's `distractorNotes` keys,
 * kept only if the typed checker would mark them plainly wrong (never correct or "almost").
 * Same item id, explanation and tags, so logging and scheduling don't change.
 */
import { checkItem } from '../checker/item';
import { hashString, mulberry32, shuffle } from '../util/rng';
import type { ChoiceItem, ClozeItem, Item } from './schema';

export const ANSWER_MODES = ['typed', 'choice'] as const;
export type AnswerPreference = (typeof ANSWER_MODES)[number];
export const MAX_CHOICE_OPTIONS = 4;

export function asChoice(item: ClozeItem): ChoiceItem | undefined {
	if (item.accepted.length !== 1) return undefined;
	const answer = item.accepted[0]![0]!;
	const wrong = Object.keys(item.distractorNotes ?? {}).filter(
		(option) => checkItem(item, { type: 'cloze', gaps: [option] }).result.verdict === 'wrong'
	);
	const distractors = [...new Set(wrong)].slice(0, MAX_CHOICE_OPTIONS - 1);
	if (!distractors.length) return undefined;
	const rng = mulberry32(hashString(item.id));
	// Everything except the cloze-only `accepted` carries over (same id, explanation, tags).
	const { text, ...rest } = item;
	const base: Omit<ClozeItem, 'text' | 'accepted' | 'type'> & { accepted?: unknown } = { ...rest };
	delete base.accepted;
	return {
		...(base as Omit<ClozeItem, 'text' | 'accepted' | 'type'>),
		type: 'choice',
		text: text.replace(/\{\{[^{}]+\}\}/, '___'),
		options: shuffle([answer, ...distractors], rng),
		answer
	};
}

/** The item as the learner prefers to answer it (falls back to typed when there's no choice). */
export function presentItem(item: Item, preference: AnswerPreference): Item {
	if (preference === 'choice' && item.type === 'cloze') return asChoice(item) ?? item;
	return item;
}
