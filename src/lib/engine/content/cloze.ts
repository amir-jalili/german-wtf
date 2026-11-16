/** Helpers for cloze texts of the form "Ich helfe dem {{alten}} Mann." */

const GAP = /\{\{([^{}]+)\}\}/g;

export interface ClozeSegment {
	kind: 'text' | 'gap';
	/** For text: the literal; for gap: the canonical answer written in the braces. */
	value: string;
	/** Gap index (0-based) for gaps. */
	gap?: number;
}

/** Splits a cloze text into literal and gap segments, in order. */
export function splitCloze(text: string): ClozeSegment[] {
	const segments: ClozeSegment[] = [];
	let last = 0;
	let gap = 0;
	for (const match of text.matchAll(GAP)) {
		const index = match.index ?? 0;
		if (index > last) segments.push({ kind: 'text', value: text.slice(last, index) });
		segments.push({ kind: 'gap', value: match[1] ?? '', gap: gap++ });
		last = index + match[0].length;
	}
	if (last < text.length) segments.push({ kind: 'text', value: text.slice(last) });
	return segments;
}

/** The canonical answers written inside the braces, in gap order. */
export function clozeGapAnswers(text: string): string[] {
	return splitCloze(text)
		.filter((s) => s.kind === 'gap')
		.map((s) => s.value);
}

/** The full correct sentence with the given answers (default: the canonical ones). */
export function fillCloze(text: string, answers?: readonly string[]): string {
	return splitCloze(text)
		.map((s) => (s.kind === 'gap' ? (answers?.[s.gap ?? 0] ?? s.value) : s.value))
		.join('');
}
