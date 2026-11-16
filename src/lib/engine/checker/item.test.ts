import { describe, expect, it } from 'vitest';
import { ItemSchema } from '../content/schema';
import { checkItem } from './item';

const base = {
	level: 'A2',
	skill: 'form',
	explanation: 'x',
	errorTags: ['adj-ending'],
	review: { status: 'verified', by: 'c', date: '2026-11-17' },
	source: 'original'
} as const;

const cloze2 = ItemSchema.parse({
	...base,
	id: 'p/001',
	type: 'cloze',
	text: 'Gestern {{bin}} ich nach Berlin {{gefahren}}.',
	accepted: [['bin'], ['gefahren']],
	distractorNotes: { habe: 'fahren = movement → sein' }
});
const choice = ItemSchema.parse({
	...base,
	id: 'p/002',
	type: 'choice',
	text: 'Wir wohnen in ___ Stadt.',
	options: ['der', 'die', 'dem'],
	answer: 'der',
	distractorNotes: { die: 'Wo? → Dativ' }
});
const order = ItemSchema.parse({
	...base,
	id: 'p/003',
	type: 'order',
	prefix: 'Ich komme nicht, ',
	tiles: ['weil', 'ich', 'arbeiten', 'muss'],
	accepted: ['weil ich arbeiten muss'],
	suffix: '.'
});

describe('checkItem', () => {
	it('cloze: all gaps right → correct with the full sentence', () => {
		const r = checkItem(cloze2, { type: 'cloze', gaps: ['bin', 'gefahren'] });
		expect(r.result).toEqual({
			verdict: 'correct',
			matched: 'Gestern bin ich nach Berlin gefahren.'
		});
		expect(r.correctSentence).toBe('Gestern bin ich nach Berlin gefahren.');
	});

	it('cloze: one near-miss and the rest right → near-miss', () => {
		const r = checkItem(cloze2, { type: 'cloze', gaps: ['bin', 'gefahrn'] });
		expect(r.result.verdict).toBe('near-miss');
	});

	it('cloze: one wrong gap → wrong, with the distractor note and a sentence-level diff', () => {
		const r = checkItem(cloze2, { type: 'cloze', gaps: ['habe', 'gefahren'] });
		expect(r.result).toMatchObject({
			verdict: 'wrong',
			feedback: 'fahren = movement → sein',
			tags: ['adj-ending']
		});
		expect(r.givenSentence).toBe('Gestern habe ich nach Berlin gefahren.');
		if (r.result.verdict === 'wrong')
			expect(r.result.diff.some((s) => s.kind === 'wrong' && s.text === 'habe')).toBe(true);
	});

	it('cloze: empty gaps are shown as ___', () => {
		const r = checkItem(cloze2, { type: 'cloze', gaps: ['', ''] });
		expect(r.givenSentence).toBe('Gestern ___ ich nach Berlin ___.');
		expect(r.result.verdict).toBe('wrong');
	});

	it('choice: right and wrong options', () => {
		expect(checkItem(choice, { type: 'choice', option: 'der' }).result.verdict).toBe('correct');
		const wrong = checkItem(choice, { type: 'choice', option: 'die' });
		expect(wrong.result).toMatchObject({
			verdict: 'wrong',
			expected: 'Wir wohnen in der Stadt.',
			feedback: 'Wo? → Dativ'
		});
		expect(wrong.givenSentence).toBe('Wir wohnen in die Stadt.');
	});

	it('order: right order, wrong order with prefix/suffix wrapped', () => {
		const right = checkItem(order, { type: 'order', tiles: ['weil', 'ich', 'arbeiten', 'muss'] });
		expect(right.result).toEqual({
			verdict: 'correct',
			matched: 'Ich komme nicht, weil ich arbeiten muss.'
		});
		const wrong = checkItem(order, { type: 'order', tiles: ['weil', 'ich', 'muss', 'arbeiten'] });
		expect(wrong.result).toMatchObject({
			verdict: 'wrong',
			expected: 'Ich komme nicht, weil ich arbeiten muss.'
		});
		expect(wrong.givenSentence).toBe('Ich komme nicht, weil ich muss arbeiten.');
	});

	it('order: tile capitalisation never counts against the user', () => {
		const r = checkItem(order, { type: 'order', tiles: ['Weil', 'ich', 'arbeiten', 'muss'] });
		expect(r.result.verdict).toBe('correct');
	});

	it('rejects mismatched answer types', () => {
		expect(() => checkItem(choice, { type: 'cloze', gaps: [] })).toThrow();
	});
});
