import { describe, expect, it } from 'vitest';
import { check, closest, type CheckResult } from './check';
import { diffTokens, similarity } from './diff';
import { levenshtein } from './levenshtein';
import { asciiFold, normalise, stripUmlauts, tokenise } from './normalise';

type Case = {
	name: string;
	answer: string;
	accepted: string[];
	verdict: CheckResult['verdict'];
	/** For near-miss: the reason; for wrong: the expected answer. */
	detail?: string;
	options?: Parameters<typeof check>[2];
};

const cases: Case[] = [
	// ---- exact / normalisation ----
	{ name: 'exact match', answer: 'alten', accepted: ['alten'], verdict: 'correct' },
	{ name: 'surrounding whitespace', answer: '  alten ', accepted: ['alten'], verdict: 'correct' },
	{
		name: 'internal double spaces',
		answer: 'weil ich  morgen arbeiten muss',
		accepted: ['weil ich morgen arbeiten muss'],
		verdict: 'correct'
	},
	{
		name: 'trailing full stop optional',
		answer: 'Das Auto wird repariert',
		accepted: ['Das Auto wird repariert.'],
		verdict: 'correct'
	},
	{
		name: 'extra trailing full stop',
		answer: 'Das Auto wird repariert.',
		accepted: ['Das Auto wird repariert'],
		verdict: 'correct'
	},
	{
		name: 'German quotes vs straight quotes',
		answer: 'Er sagte: "Ja."',
		accepted: ['Er sagte: „Ja.“'],
		verdict: 'correct'
	},
	{
		name: 'space before comma',
		answer: 'Ich komme , weil ich muss',
		accepted: ['Ich komme, weil ich muss'],
		verdict: 'correct'
	},
	{
		name: 'second variant accepted',
		answer: 'in dem',
		accepted: ['im', 'in dem'],
		verdict: 'correct'
	},
	{
		name: 'word-order variant accepted',
		answer: 'Trotzdem gehen wir spazieren.',
		accepted: ['Wir gehen trotzdem spazieren.', 'Trotzdem gehen wir spazieren.'],
		verdict: 'correct'
	},
	{ name: 'NFC vs decomposed umlaut', answer: 'Grüße', accepted: ['Grüße'], verdict: 'correct' },
	{ name: 'en dash vs hyphen', answer: 'von 3 - 5', accepted: ['von 3 – 5'], verdict: 'correct' },
	{
		name: 'ellipsis trailing',
		answer: 'Wenn ich doch Zeit hätte…',
		accepted: ['Wenn ich doch Zeit hätte!'],
		verdict: 'correct'
	},

	// ---- near-miss: capitalisation ----
	{
		name: 'noun not capitalised',
		answer: 'der mann',
		accepted: ['der Mann'],
		verdict: 'near-miss',
		detail: 'capitalisation'
	},
	{
		name: 'sentence start lower-case',
		answer: 'ich helfe dem alten Mann',
		accepted: ['Ich helfe dem alten Mann.'],
		verdict: 'near-miss',
		detail: 'capitalisation'
	},
	{
		name: 'Sie vs sie polite form',
		answer: 'Können sie mir helfen?',
		accepted: ['Können Sie mir helfen?'],
		verdict: 'near-miss',
		detail: 'capitalisation'
	},
	{
		name: 'all caps',
		answer: 'ALTEN',
		accepted: ['alten'],
		verdict: 'near-miss',
		detail: 'capitalisation'
	},

	// ---- near-miss: umlaut ----
	{
		name: 'ue for ü',
		answer: 'Gruesse',
		accepted: ['Grüße'],
		verdict: 'near-miss',
		detail: 'umlaut'
	},
	{ name: 'ae for ä', answer: 'kaeme', accepted: ['käme'], verdict: 'near-miss', detail: 'umlaut' },
	{
		name: 'oe for ö',
		answer: 'moechte',
		accepted: ['möchte'],
		verdict: 'near-miss',
		detail: 'umlaut'
	},
	{
		name: 'umlaut dropped',
		answer: 'Hauser',
		accepted: ['Häuser'],
		verdict: 'near-miss',
		detail: 'umlaut'
	},
	{
		name: 'umlaut dropped in a sentence',
		answer: 'Ich mochte ein Brotchen',
		accepted: ['Ich möchte ein Brötchen'],
		verdict: 'near-miss',
		detail: 'umlaut'
	},
	{
		name: 'umlaut written and lower-case',
		answer: 'gruesse',
		accepted: ['Grüße'],
		verdict: 'near-miss',
		detail: 'umlaut'
	},
	{
		name: 'Ue capital',
		answer: 'Ueber',
		accepted: ['Über'],
		verdict: 'near-miss',
		detail: 'umlaut'
	},

	// ---- near-miss: ß / ss ----
	{
		name: 'ss for ß',
		answer: 'Strasse',
		accepted: ['Straße'],
		verdict: 'near-miss',
		detail: 'eszett'
	},
	{ name: 'ß for ss', answer: 'daß', accepted: ['dass'], verdict: 'near-miss', detail: 'eszett' },
	{
		name: 'ss for ß in a sentence',
		answer: 'Ich weiss es nicht',
		accepted: ['Ich weiß es nicht'],
		verdict: 'near-miss',
		detail: 'eszett'
	},
	{
		name: 'ß written where both standard: accepted lists both',
		answer: 'Grüsse',
		accepted: ['Grüße', 'Grüsse'],
		verdict: 'correct'
	},

	// ---- near-miss: typo ----
	{
		name: 'one letter swapped in a long word',
		answer: 'gefahern',
		accepted: ['gefahren'],
		verdict: 'wrong',
		detail: 'gefahren'
	},
	{
		name: 'one missing letter in a long word',
		answer: 'gefahrn',
		accepted: ['gefahren'],
		verdict: 'near-miss',
		detail: 'typo'
	},
	{
		name: 'one extra letter in a long word',
		answer: 'gefahrren',
		accepted: ['gefahren'],
		verdict: 'near-miss',
		detail: 'typo'
	},
	{
		name: 'one wrong letter in a long word',
		answer: 'gefahran',
		accepted: ['gefahren'],
		verdict: 'near-miss',
		detail: 'typo'
	},
	{
		name: 'typo in a long word inside a sentence',
		answer: 'Das Auto wird repariet',
		accepted: ['Das Auto wird repariert'],
		verdict: 'near-miss',
		detail: 'typo'
	},
	{
		name: 'two typos are wrong',
		answer: 'gefaren',
		accepted: ['gefahren'],
		verdict: 'near-miss',
		detail: 'typo'
	},
	{
		name: 'three edits are wrong',
		answer: 'gefaen',
		accepted: ['gefahren'],
		verdict: 'wrong',
		detail: 'gefahren'
	},

	// ---- NOT near-misses: real grammar errors in short words ----
	{
		name: 'den vs dem is a case error, not a typo',
		answer: 'den',
		accepted: ['dem'],
		verdict: 'wrong',
		detail: 'dem'
	},
	{
		name: 'alte vs alten is an ending error',
		answer: 'alte',
		accepted: ['alten'],
		verdict: 'wrong',
		detail: 'alten'
	},
	{
		name: 'ein vs eine (gender)',
		answer: 'ein',
		accepted: ['eine'],
		verdict: 'wrong',
		detail: 'eine'
	},
	{
		name: 'hat vs ist (auxiliary)',
		answer: 'hat',
		accepted: ['ist'],
		verdict: 'wrong',
		detail: 'ist'
	},
	{
		name: 'kämest vs kämst are both valid forms, so kämt is not a typo of kämest',
		answer: 'kämt',
		accepted: ['kämest', 'kämst'],
		verdict: 'wrong',
		detail: 'kämst'
	},
	{
		name: 'ending error in a long word is not a typo when it is another listed form',
		answer: 'repariert',
		accepted: ['reparierte', 'repariert'],
		verdict: 'correct'
	},
	{
		name: 'other valid form at same position',
		answer: 'Ich helfe den alten Mann',
		accepted: ['Ich helfe dem alten Mann'],
		verdict: 'wrong',
		detail: 'Ich helfe dem alten Mann'
	},
	{
		name: 'wrong word order is wrong',
		answer: 'weil ich muss morgen arbeiten',
		accepted: ['weil ich morgen arbeiten muss'],
		verdict: 'wrong',
		detail: 'weil ich morgen arbeiten muss'
	},
	{
		name: 'missing word is wrong',
		answer: 'weil ich arbeiten muss',
		accepted: ['weil ich morgen arbeiten muss'],
		verdict: 'wrong',
		detail: 'weil ich morgen arbeiten muss'
	},
	{
		name: 'extra word is wrong',
		answer: 'weil ich heute morgen arbeiten muss',
		accepted: ['weil ich morgen arbeiten muss'],
		verdict: 'wrong',
		detail: 'weil ich morgen arbeiten muss'
	},
	{ name: 'empty answer is wrong', answer: '', accepted: ['dem'], verdict: 'wrong', detail: 'dem' },
	{
		name: 'completely different',
		answer: 'Banane',
		accepted: ['dem'],
		verdict: 'wrong',
		detail: 'dem'
	},

	// ---- closest expected answer among several ----
	{
		name: 'closest variant chosen for the diff',
		answer: 'Es regnet, trotzdem wir gehen spazieren.',
		accepted: [
			'Es regnet, trotzdem gehen wir spazieren.',
			'Es regnet. Trotzdem gehen wir spazieren.',
			'Es regnet, wir gehen trotzdem spazieren.'
		],
		verdict: 'wrong',
		detail: 'Es regnet, trotzdem gehen wir spazieren.'
	},

	// ---- distractor notes ----
	{
		name: 'distractor note matched case-insensitively',
		answer: 'Alte',
		accepted: ['alten'],
		verdict: 'wrong',
		detail: 'alten',
		options: { distractorNotes: { alte: '-e only in Nom. sg.' } }
	}
];

describe('check()', () => {
	it.each(cases)('$name', ({ answer, accepted, verdict, detail, options }) => {
		const result = check(answer, accepted, options);
		expect(result.verdict).toBe(verdict);
		if (result.verdict === 'near-miss' && detail) expect(result.reason).toBe(detail);
		if (result.verdict === 'wrong' && detail) expect(result.expected).toBe(detail);
	});

	it('returns the distractor note as feedback and the item tags', () => {
		const result = check('alte', ['alten'], {
			errorTags: ['adj-ending'],
			distractorNotes: { alte: 'Dativ → -en' }
		});
		expect(result).toMatchObject({
			verdict: 'wrong',
			tags: ['adj-ending'],
			feedback: 'Dativ → -en'
		});
	});

	it('produces a token diff with the wrong part highlighted', () => {
		const result = check('Ich helfe den alten Mann', ['Ich helfe dem alten Mann.']);
		expect(result.verdict).toBe('wrong');
		if (result.verdict !== 'wrong') return;
		expect(result.diff).toEqual([
			{ text: 'Ich', kind: 'same' },
			{ text: 'helfe', kind: 'same' },
			{ text: 'den', kind: 'wrong' },
			{ text: 'dem', kind: 'missing' },
			{ text: 'alten', kind: 'same' },
			{ text: 'Mann', kind: 'same' }
		]);
	});

	it('gives a readable hint for near-misses', () => {
		const result = check('Gruesse', ['Grüße']);
		expect(result.verdict === 'near-miss' && result.hint).toContain('Grüße');
	});

	it('throws when there are no accepted answers', () => {
		expect(() => check('x', [])).toThrow();
	});
});

describe('normalise helpers', () => {
	it('normalises whitespace, quotes and trailing punctuation but keeps umlauts and case', () => {
		expect(normalise('  Der  Mann ! ')).toBe('Der Mann');
		expect(normalise('„Hallo“')).toBe('"Hallo"');
		expect(normalise('Grüße')).toBe('Grüße');
	});
	it('folds and strips umlauts', () => {
		expect(asciiFold('Grüße Äpfel Öl')).toBe('Gruesse Aepfel Oel');
		expect(stripUmlauts('Grüße')).toBe('Gruße');
	});
	it('tokenises without punctuation', () => {
		expect(tokenise('Ich komme, weil ich muss.')).toEqual(['Ich', 'komme', 'weil', 'ich', 'muss']);
	});
});

describe('levenshtein', () => {
	it.each([
		['', '', 0],
		['abc', 'abc', 0],
		['abc', 'abd', 1],
		['abc', 'ab', 1],
		['abc', 'abcd', 1],
		['gefahren', 'gefahern', 2],
		['kitten', 'sitting', 3]
	])('%s → %s = %i', (a, b, d) => {
		expect(levenshtein(a, b)).toBe(d);
	});
	it('exits early above max', () => {
		expect(levenshtein('kitten', 'sitting', 1)).toBe(2);
	});
});

describe('diff and similarity', () => {
	it('marks missing and extra tokens', () => {
		expect(diffTokens('weil ich arbeiten muss', 'weil ich morgen arbeiten muss')).toEqual([
			{ text: 'weil', kind: 'same' },
			{ text: 'ich', kind: 'same' },
			{ text: 'morgen', kind: 'missing' },
			{ text: 'arbeiten', kind: 'same' },
			{ text: 'muss', kind: 'same' }
		]);
	});
	it('scores identical as 1 and disjoint as 0', () => {
		expect(similarity('a b c', 'a b c')).toBe(1);
		expect(similarity('x', 'a b')).toBe(0);
	});
	it('closest() prefers the variant with most shared tokens', () => {
		expect(
			closest('Trotzdem gehen wir', [
				'Wir gehen trotzdem spazieren.',
				'Trotzdem gehen wir spazieren.'
			])
		).toBe('Trotzdem gehen wir spazieren.');
	});
});
