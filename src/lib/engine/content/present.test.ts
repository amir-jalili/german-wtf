import { describe, expect, it } from 'vitest';
import { asChoice, presentItem } from './present';
import { ItemSchema, type ClozeItem } from './schema';

const cloze = (over: Record<string, unknown> = {}) =>
	ItemSchema.parse({
		id: 'dative-articles/001',
		type: 'cloze',
		level: 'A2',
		skill: 'form',
		text: 'Ich fahre mit {{dem}} Bus zur Uni.',
		accepted: ['dem'],
		explanation: 'mit + Dativ',
		errorTags: ['case'],
		distractorNotes: { den: 'Akkusativ', der: 'Feminin', Dem: 'capitals only' },
		review: { status: 'verified', by: 'c', date: '2026-11-17' },
		source: 'original',
		...over
	}) as ClozeItem;

describe('asChoice', () => {
	it('turns a one-gap cloze into a choice with the canonical answer and real wrong options', () => {
		const choice = asChoice(cloze())!;
		expect(choice.type).toBe('choice');
		expect(choice.text).toBe('Ich fahre mit ___ Bus zur Uni.');
		expect(choice.answer).toBe('dem');
		// "Dem" is only a capitalisation near-miss, so it is never offered as "wrong"
		expect([...choice.options].sort()).toEqual(['dem', 'den', 'der']);
		expect(choice.id).toBe('dative-articles/001');
		expect(choice.explanation).toBe('mit + Dativ');
	});
	it('is stable for the same item', () => {
		expect(asChoice(cloze())!.options).toEqual(asChoice(cloze())!.options);
	});
	it('keeps typed when there are no distractors or several gaps', () => {
		expect(asChoice(cloze({ distractorNotes: undefined }))).toBeUndefined();
		expect(
			asChoice(cloze({ text: '{{Mit}} {{dem}} Bus.', accepted: [['Mit'], ['dem']] }))
		).toBeUndefined();
		expect(presentItem(cloze({ distractorNotes: undefined }), 'choice').type).toBe('cloze');
		expect(presentItem(cloze(), 'typed').type).toBe('cloze');
		expect(presentItem(cloze(), 'choice').type).toBe('choice');
	});
});
