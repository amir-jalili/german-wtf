/**
 * X-ray helpers (ARCHITECTURE §5.5): turn an example sentence plus its hand-written spans
 * into ordered segments the UI can colour and make tappable.
 */
import type { Case, XraySpan } from './schema';

export type XraySegment = { text: string; span?: XraySpan };

/**
 * Splits `sentence` into plain and annotated segments. Each span matches the first
 * occurrence of its text that does not overlap an earlier span; unmatched spans are dropped
 * (the validator reports them at build time).
 */
export function xraySegments(sentence: string, spans: readonly XraySpan[]): XraySegment[] {
	const placed: { from: number; to: number; span: XraySpan }[] = [];
	for (const span of spans) {
		let from = sentence.indexOf(span.text);
		while (from >= 0 && placed.some((p) => from < p.to && from + span.text.length > p.from)) {
			from = sentence.indexOf(span.text, from + 1);
		}
		if (from >= 0) placed.push({ from, to: from + span.text.length, span });
	}
	placed.sort((a, b) => a.from - b.from);
	const segments: XraySegment[] = [];
	let cursor = 0;
	for (const p of placed) {
		if (p.from > cursor) segments.push({ text: sentence.slice(cursor, p.from) });
		segments.push({ text: sentence.slice(p.from, p.to), span: p.span });
		cursor = p.to;
	}
	if (cursor < sentence.length) segments.push({ text: sentence.slice(cursor) });
	return segments;
}

const CASE_PREFIXES: [string, Case][] = [
	['nom', 'nom'],
	['akk', 'akk'],
	['acc', 'akk'],
	['dat', 'dat'],
	['gen', 'gen']
];

/** "Akkusativ (ein)" → 'akk'; "dat" → 'dat'; anything else → undefined. */
export function caseOfLabel(label: string): Case | undefined {
	const l = label.trim().toLowerCase();
	return CASE_PREFIXES.find(([prefix]) => l.startsWith(prefix))?.[1];
}

const ROLE_LABELS: Record<XraySpan['role'], string> = {
	subj: 'subject',
	'akk-obj': 'direct object',
	'dat-obj': 'indirect (dative) object',
	'gen-attr': 'genitive attribute',
	'prep-obj': 'prepositional phrase',
	verb: 'verb',
	'verb-part': 'verb part (sentence bracket)',
	pred: 'predicate'
};

/** Human-readable description of a span, e.g. "direct object · Akkusativ · masculine". */
export function describeSpan(span: XraySpan): string {
	const caseNames: Record<Case, string> = {
		nom: 'Nominativ',
		akk: 'Akkusativ',
		dat: 'Dativ',
		gen: 'Genitiv'
	};
	const genders = { m: 'masculine', f: 'feminine', n: 'neuter', pl: 'plural' } as const;
	return [
		ROLE_LABELS[span.role],
		span.case && caseNames[span.case],
		span.gender && genders[span.gender],
		span.note
	]
		.filter(Boolean)
		.join(' · ');
}
