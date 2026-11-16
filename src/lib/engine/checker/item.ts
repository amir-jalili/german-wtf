/**
 * Checks a user's answer to a whole item (cloze with several gaps, choice, order) by
 * delegating to `check()` and combining the gap results.
 */
import { fillCloze } from '../content/cloze';
import type { ChoiceItem, ClozeItem, Item, OrderItem } from '../content/schema';
import { check, type CheckResult } from './check';
import { diffTokens } from './diff';

/** What the exercise components collect. */
export type ItemAnswer =
	| { type: 'cloze'; gaps: string[] }
	| { type: 'choice'; option: string }
	| { type: 'order'; tiles: string[] };

export interface ItemCheck {
	result: CheckResult;
	/** The full correct sentence (canonical), for the feedback panel and TTS. */
	correctSentence: string;
	/** The user's answer rendered as a sentence, for the diff display. */
	givenSentence: string;
}

export function checkItem(item: Item, answer: ItemAnswer): ItemCheck {
	switch (item.type) {
		case 'cloze':
			if (answer.type !== 'cloze') throw new Error('answer type mismatch');
			return checkCloze(item, answer.gaps);
		case 'choice':
			if (answer.type !== 'choice') throw new Error('answer type mismatch');
			return checkChoice(item, answer.option);
		case 'order':
			if (answer.type !== 'order') throw new Error('answer type mismatch');
			return checkOrder(item, answer.tiles);
	}
}

function checkCloze(item: ClozeItem, gaps: string[]): ItemCheck {
	const results = item.accepted.map((accepted, i) =>
		check(gaps[i] ?? '', accepted, {
			errorTags: item.errorTags,
			distractorNotes: item.distractorNotes
		})
	);
	const correctSentence = fillCloze(item.text);
	const givenSentence = fillCloze(
		item.text,
		gaps.map((g) => g.trim() || '___')
	);
	const wrong = results.find((r) => r.verdict === 'wrong');
	if (wrong && wrong.verdict === 'wrong') {
		return {
			result: {
				verdict: 'wrong',
				expected: correctSentence,
				diff: diffTokens(givenSentence, correctSentence),
				tags: wrong.tags,
				feedback: wrong.feedback
			},
			correctSentence,
			givenSentence
		};
	}
	const near = results.find((r) => r.verdict === 'near-miss');
	if (near && near.verdict === 'near-miss') {
		return { result: { ...near, matched: correctSentence }, correctSentence, givenSentence };
	}
	return {
		result: { verdict: 'correct', matched: correctSentence },
		correctSentence,
		givenSentence
	};
}

function checkChoice(item: ChoiceItem, option: string): ItemCheck {
	const correctSentence = item.text.replace(/_{2,}/, item.answer);
	const givenSentence = item.text.replace(/_{2,}/, option);
	if (option === item.answer) {
		return {
			result: { verdict: 'correct', matched: correctSentence },
			correctSentence,
			givenSentence
		};
	}
	return {
		result: {
			verdict: 'wrong',
			expected: correctSentence,
			diff: diffTokens(givenSentence, correctSentence),
			tags: [...item.errorTags],
			feedback: item.distractorNotes?.[option]
		},
		correctSentence,
		givenSentence
	};
}

function checkOrder(item: OrderItem, tiles: string[]): ItemCheck {
	const wrap = (inner: string): string => `${item.prefix ?? ''}${inner}${item.suffix ?? ''}`;
	// Tiles that start the sentence get a capital; tiles continuing a prefix do not.
	const given = item.prefix?.trim() ? tiles.join(' ') : capitaliseFirst(tiles.join(' '));
	const result = check(given, item.accepted, {
		errorTags: item.errorTags,
		distractorNotes: item.distractorNotes,
		ignoreCase: true
	});
	const canonical = wrap(item.accepted[0] ?? '');
	if (result.verdict === 'wrong') {
		const expected = wrap(result.expected);
		return {
			result: { ...result, expected, diff: diffTokens(wrap(given), expected) },
			correctSentence: expected,
			givenSentence: wrap(given)
		};
	}
	return {
		result: { ...result, matched: wrap(result.matched) },
		correctSentence: canonical,
		givenSentence: wrap(given)
	};
}

function capitaliseFirst(text: string): string {
	return text.charAt(0).toLocaleUpperCase('de-DE') + text.slice(1);
}
