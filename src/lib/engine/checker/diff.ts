/**
 * Token-level diff between the user's answer and the expected answer, for the
 * feedback panel ("your answer with the wrong part highlighted").
 */
import { tokenise } from './normalise';

export interface Span {
	text: string;
	/** `same` tokens match; `wrong` tokens are only in the user's answer; `missing` only in the expected one. */
	kind: 'same' | 'wrong' | 'missing';
}

/** LCS-based diff on tokens (case-sensitive, but punctuation-insensitive). */
export function diffTokens(answer: string, expected: string): Span[] {
	const a = tokenise(answer);
	const b = tokenise(expected);
	const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
		new Array<number>(b.length + 1).fill(0)
	);
	for (let i = a.length - 1; i >= 0; i--) {
		for (let j = b.length - 1; j >= 0; j--) {
			lcs[i]![j] =
				a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
		}
	}
	const spans: Span[] = [];
	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			spans.push({ text: a[i]!, kind: 'same' });
			i++;
			j++;
		} else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
			spans.push({ text: a[i]!, kind: 'wrong' });
			i++;
		} else {
			spans.push({ text: b[j]!, kind: 'missing' });
			j++;
		}
	}
	while (i < a.length) spans.push({ text: a[i++]!, kind: 'wrong' });
	while (j < b.length) spans.push({ text: b[j++]!, kind: 'missing' });
	return spans;
}

/** Fraction of expected tokens the answer got right (0–1); picks the "closest" accepted answer. */
export function similarity(answer: string, expected: string): number {
	const spans = diffTokens(answer, expected);
	const same = spans.filter((s) => s.kind === 'same').length;
	const total = Math.max(tokenise(expected).length, tokenise(answer).length, 1);
	return same / total;
}
