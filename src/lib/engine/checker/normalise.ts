/**
 * Text normalisation for answer checking (ARCHITECTURE §5.1).
 *
 * `normalise` is what both the user's answer and every accepted answer go through
 * before an exact comparison: it removes differences that are never meaningful
 * (whitespace, quote styles, dash styles, trailing punctuation). It deliberately keeps
 * umlauts, ß and capitalisation: those differences are reported as near-misses instead.
 */

const QUOTES = /[„“”"»«‚‘’]/g;
const DASHES = /[–—]/g;

export function normalise(text: string): string {
	return text
		.normalize('NFC')
		.replace(QUOTES, '"')
		.replace(DASHES, '-')
		.replace(/\s+/g, ' ')
		.replace(/\s+([,.;:!?])/g, '$1') // "Hallo , du" → "Hallo, du"
		.trim()
		.replace(/[.!?…]+$/u, '') // trailing sentence punctuation is optional
		.trim();
}

/** Lower-case form of `normalise`, used to detect capitalisation-only differences. */
export function foldCase(text: string): string {
	return normalise(text).toLocaleLowerCase('de-DE');
}

/** Replaces umlauts and ß by their ASCII fallbacks (ä→ae, ö→oe, ü→ue, ß→ss). */
export function asciiFold(text: string): string {
	return text
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/Ä/g, 'Ae')
		.replace(/Ö/g, 'Oe')
		.replace(/Ü/g, 'Ue')
		.replace(/ß/g, 'ss')
		.replace(/ẞ/g, 'SS');
}

/** Strips umlaut dots entirely (ä→a), for "forgot the umlaut" detection. */
export function stripUmlauts(text: string): string {
	return text
		.replace(/ä/g, 'a')
		.replace(/ö/g, 'o')
		.replace(/ü/g, 'u')
		.replace(/Ä/g, 'A')
		.replace(/Ö/g, 'O')
		.replace(/Ü/g, 'U');
}

/** Splits into word tokens (letters, digits, apostrophes) keeping their order. */
export function tokenise(text: string): string[] {
	return normalise(text)
		.split(/[\s]+/)
		.map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}']+$/gu, ''))
		.filter(Boolean);
}
