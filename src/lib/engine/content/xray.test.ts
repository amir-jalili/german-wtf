import { describe, expect, it } from 'vitest';
import type { XraySpan } from './schema';
import { caseOfLabel, describeSpan, xraySegments } from './xray';

const span = (text: string, extra: Partial<XraySpan> = {}): XraySpan => ({
	text,
	role: 'akk-obj',
	...extra
});

describe('xraySegments', () => {
	it('splits a sentence into plain and annotated segments in sentence order', () => {
		const segs = xraySegments('Ich kaufe den Tisch.', [
			span('den Tisch', { case: 'akk' }),
			span('Ich', { role: 'subj' })
		]);
		expect(segs.map((s) => [s.text, s.span?.role])).toEqual([
			['Ich', 'subj'],
			[' kaufe ', undefined],
			['den Tisch', 'akk-obj'],
			['.', undefined]
		]);
	});

	it('uses the next non-overlapping occurrence for repeated words and drops unknown spans', () => {
		const segs = xraySegments('Mit dem Hund und mit dem Hund.', [
			span('dem Hund'),
			span('dem Hund'),
			span('Katze')
		]);
		expect(segs.filter((s) => s.span).length).toBe(2);
		expect(segs.map((s) => s.text).join('')).toBe('Mit dem Hund und mit dem Hund.');
	});

	it('returns the whole sentence as one plain segment without spans', () => {
		expect(xraySegments('Hallo.', [])).toEqual([{ text: 'Hallo.' }]);
	});
});

describe('caseOfLabel and describeSpan', () => {
	it('maps table row labels to cases', () => {
		expect(caseOfLabel('Akkusativ (ein)')).toBe('akk');
		expect(caseOfLabel('dat')).toBe('dat');
		expect(caseOfLabel('Genitiv')).toBe('gen');
		expect(caseOfLabel('Plural')).toBeUndefined();
	});
	it('describes a span', () => {
		expect(describeSpan(span('den Tisch', { case: 'akk', gender: 'm' }))).toBe(
			'direct object · Akkusativ · masculine'
		);
	});
});
