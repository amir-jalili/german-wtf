import { describe, expect, it } from 'vitest';
import { clozeGapAnswers, fillCloze, splitCloze } from './cloze';

describe('cloze helpers', () => {
	it('splits text into literal and gap segments', () => {
		expect(splitCloze('Ich helfe dem {{alten}} Mann.')).toEqual([
			{ kind: 'text', value: 'Ich helfe dem ' },
			{ kind: 'gap', value: 'alten', gap: 0 },
			{ kind: 'text', value: ' Mann.' }
		]);
	});

	it('handles gaps at the start and end and several gaps', () => {
		expect(clozeGapAnswers('{{Bin}} ich zu spät {{gekommen}}')).toEqual(['Bin', 'gekommen']);
		expect(splitCloze('{{a}}{{b}}')).toHaveLength(2);
	});

	it('fills the canonical answers or given answers', () => {
		const text = 'Gestern {{bin}} ich nach Berlin {{gefahren}}.';
		expect(fillCloze(text)).toBe('Gestern bin ich nach Berlin gefahren.');
		expect(fillCloze(text, ['war'])).toBe('Gestern war ich nach Berlin gefahren.');
	});
});
