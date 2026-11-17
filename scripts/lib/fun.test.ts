import { describe, expect, it } from 'vitest';
import { FunMessagesSchema } from '#lib/engine/fun/schema.js';
import { readFun, validateFun } from './fun';

const line = {
	text: 'x',
	triggers: ['session-done'],
	lang: 'en',
	by: 'claude',
	added: '2026-11-17'
} as const;

describe('fun content validation', () => {
	it('the real content/fun files are valid', () => {
		expect(readFun().problems).toEqual([]);
	});

	it('reports duplicate ids, unknown memes and missing image files', () => {
		const messages = FunMessagesSchema.parse([
			{ ...line, id: 'a', meme: 'nope' },
			{ ...line, id: 'a' }
		]);
		const memes = [
			{
				id: 'cat',
				file: 'cat.jpg',
				alt: 'a cat',
				triggers: ['session-done' as const],
				by: 'aj' as const
			}
		];
		const messagesOut = validateFun({ messages, memes }, () => false).map((p) => p.message);
		expect(messagesOut).toContain('duplicate fun id');
		expect(messagesOut).toContain('unknown meme "nope"');
		expect(messagesOut).toContain('image static/fun/memes/cat.jpg not found');
	});

	it('rejects unknown triggers and moods in the schema', () => {
		expect(FunMessagesSchema.safeParse([{ ...line, id: 'b', triggers: ['tuesday'] }]).success).toBe(
			false
		);
		expect(FunMessagesSchema.safeParse([{ ...line, id: 'b', mood: 'grumpy' }]).success).toBe(false);
	});
});
