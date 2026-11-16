/**
 * Checker v1 (ARCHITECTURE §5.1): exact match → near-miss → diagnosis.
 *
 *   normalise(answer) == normalise(accepted[i])          → correct
 *   differs only by capitalisation / umlaut spelling /
 *   ß-ss / one typo in a long word                        → near-miss (counts as correct, shows a hint)
 *   otherwise                                             → wrong, with the closest expected answer,
 *                                                          a token diff, error tags and feedback
 */
import type { ErrorTag } from '../content/schema';
import { diffTokens, similarity, type Span } from './diff';
import { levenshtein } from './levenshtein';
import { asciiFold, foldCase, normalise, stripUmlauts, tokenise } from './normalise';

export type CheckResult =
	| { verdict: 'correct'; matched: string }
	| { verdict: 'near-miss'; matched: string; hint: string; reason: NearMissReason }
	| { verdict: 'wrong'; expected: string; diff: Span[]; tags: ErrorTag[]; feedback?: string };

export type NearMissReason = 'capitalisation' | 'umlaut' | 'eszett' | 'typo';

export interface CheckOptions {
	/** Error tags of the item; returned on a wrong answer when nothing more specific is known. */
	errorTags?: readonly ErrorTag[];
	/** Wrong answer (as written in content) → specific feedback. */
	distractorNotes?: Readonly<Record<string, string>>;
	/** Minimum length of the expected word for the one-typo tolerance. Default 6. */
	typoMinLength?: number;
}

/** Checks a typed answer against every accepted variant. */
export function check(
	answer: string,
	accepted: readonly string[],
	options: CheckOptions = {}
): CheckResult {
	const given = normalise(answer);
	if (accepted.length === 0) throw new Error('check(): no accepted answers');

	for (const variant of accepted) {
		if (given === normalise(variant)) return { verdict: 'correct', matched: variant };
	}

	for (const variant of accepted) {
		const reason = nearMissReason(given, normalise(variant), accepted, options.typoMinLength ?? 6);
		if (reason)
			return { verdict: 'near-miss', matched: variant, reason, hint: hintFor(reason, variant) };
	}

	const expected = closest(given, accepted);
	const note = lookupDistractorNote(given, options.distractorNotes);
	return {
		verdict: 'wrong',
		expected,
		diff: diffTokens(given, expected),
		tags: [...(options.errorTags ?? [])],
		feedback: note
	};
}

function nearMissReason(
	given: string,
	variant: string,
	accepted: readonly string[],
	typoMinLength: number
): NearMissReason | undefined {
	if (given.toLocaleLowerCase('de-DE') === variant.toLocaleLowerCase('de-DE'))
		return 'capitalisation';
	const g = foldCase(given);
	const v = foldCase(variant);
	if (asciiFold(g) === asciiFold(v) && g.replace(/ß/g, 'ss') !== v.replace(/ß/g, 'ss'))
		return 'umlaut';
	if (stripUmlauts(g) === stripUmlauts(v) && g !== v) return 'umlaut';
	if (g.replace(/ß/g, 'ss') === v.replace(/ß/g, 'ss')) return 'eszett';
	// One typo in a single long word. Conservative on purpose: German grammar lives in
	// short words and in endings, so an edit that changes the first or last letter, or any
	// edit in a word shorter than `typoMinLength`, is treated as a real error, not a typo.
	const gw = tokenise(g);
	const vw = tokenise(v);
	if (gw.length === vw.length) {
		let diffs = 0;
		for (let i = 0; i < gw.length; i++) {
			const a = gw[i]!;
			const b = vw[i]!;
			if (a === b) continue;
			diffs++;
			if (diffs > 1 || !looksLikeTypo(a, b, typoMinLength) || isOtherValidForm(a, i, accepted))
				return undefined;
		}
		if (diffs === 1) return 'typo';
	}
	return undefined;
}

function looksLikeTypo(typed: string, expected: string, minLength: number): boolean {
	return (
		expected.length >= minLength &&
		typed.length > 0 &&
		typed[0] === expected[0] &&
		typed[typed.length - 1] === expected[expected.length - 1] &&
		levenshtein(typed, expected, 1) === 1
	);
}

/** True if `word` is the word at position `index` in some other accepted answer (then it is a real alternative form, not a typo). */
function isOtherValidForm(word: string, index: number, accepted: readonly string[]): boolean {
	return accepted.some((variant) => tokenise(foldCase(variant))[index] === word);
}

function hintFor(reason: NearMissReason, variant: string): string {
	switch (reason) {
		case 'capitalisation':
			return `Almost: *${variant}* — check the capitalisation.`;
		case 'umlaut':
			return `Almost: *${variant}* — check the umlaut.`;
		case 'eszett':
			return `Almost: *${variant}* — ß or ss.`;
		case 'typo':
			return `Almost: *${variant}* — a typo.`;
	}
}

/** The accepted answer the user's text is closest to (most shared tokens, then fewest edits). */
export function closest(given: string, accepted: readonly string[]): string {
	let best = accepted[0]!;
	let bestScore = -1;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const variant of accepted) {
		const score = similarity(given, normalise(variant));
		const distance = levenshtein(foldCase(given), foldCase(variant));
		if (score > bestScore || (score === bestScore && distance < bestDistance)) {
			best = variant;
			bestScore = score;
			bestDistance = distance;
		}
	}
	return best;
}

function lookupDistractorNote(
	given: string,
	notes?: Readonly<Record<string, string>>
): string | undefined {
	if (!notes) return undefined;
	const g = foldCase(given);
	for (const [key, note] of Object.entries(notes)) {
		if (foldCase(key) === g) return note;
	}
	return undefined;
}
