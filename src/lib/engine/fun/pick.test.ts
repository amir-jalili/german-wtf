import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../util/rng';
import { endsWithWrongStreak, isLateNight, pickFun, sessionEndEvents } from './pick';
import type { FunContent, FunMessage } from './schema';

const msg = (
	id: string,
	by: 'aj' | 'claude',
	triggers: FunMessage['triggers'] = ['session-done']
): FunMessage => ({
	id,
	text: id,
	triggers,
	lang: 'en',
	by,
	added: '2026-11-17'
});

const content: FunContent = {
	messages: [
		msg('aj-1', 'aj'),
		msg('c-1', 'claude'),
		msg('c-2', 'claude'),
		msg('mastered', 'claude', ['point-mastered'])
	],
	memes: []
};
const base = { chaos: 'some' as const, seen: [] as string[], extrasShown: 0, rng: mulberry32(1) };

describe('pickFun', () => {
	it('returns nothing in serious mode', () => {
		expect(pickFun('point-mastered', content, { ...base, chaos: 'off' })).toBeUndefined();
	});

	it('"some": milestones always, at most one extra per session', () => {
		expect(pickFun('session-done', content, base)).toBeDefined();
		expect(pickFun('session-done', content, { ...base, extrasShown: 1 })).toBeUndefined();
		expect(pickFun('point-mastered', content, { ...base, extrasShown: 5 })?.id).toBe('mastered');
	});

	it('"maximum": every event, regardless of extras', () => {
		expect(
			pickFun('session-done', content, { ...base, chaos: 'maximum', extrasShown: 9 })
		).toBeDefined();
	});

	it('returns nothing when no entry matches the event', () => {
		expect(pickFun('leech', content, { ...base, chaos: 'maximum' })).toBeUndefined();
	});

	it('avoids recently seen entries', () => {
		for (let seed = 0; seed < 30; seed++) {
			const pick = pickFun('session-done', content, {
				...base,
				seen: ['aj-1', 'c-1'],
				rng: mulberry32(seed)
			});
			expect(pick?.id).toBe('c-2');
		}
	});

	it('falls back to the least recently seen entry when all were seen recently', () => {
		const pick = pickFun('session-done', content, { ...base, seen: ['c-2', 'aj-1', 'c-1'] });
		expect(pick?.id).toBe('c-2');
	});

	it('prefers AJ’s lines about 2:1 per entry', () => {
		const counts: Record<string, number> = {};
		const rng = mulberry32(42);
		for (let i = 0; i < 4000; i++) {
			const id = pickFun('session-done', content, { ...base, chaos: 'maximum', rng })!.id;
			counts[id] = (counts[id] ?? 0) + 1;
		}
		// weights 2:1:1 → AJ ≈ 50 %, each Claude line ≈ 25 %
		expect(counts['aj-1']! / 4000).toBeGreaterThan(0.45);
		expect(counts['aj-1']! / 4000).toBeLessThan(0.55);
		expect(counts['c-1']! / counts['aj-1']!).toBeGreaterThan(0.4);
		expect(counts['c-1']! / counts['aj-1']!).toBeLessThan(0.6);
	});

	it('attaches a linked meme to a message and can pick memes on their own', () => {
		const withMeme: FunContent = {
			messages: [{ ...msg('cry', 'aj', ['level-complete']), meme: 'crying-cat' }],
			memes: [
				{
					id: 'crying-cat',
					file: 'crying-cat.jpg',
					alt: 'A crying cat',
					triggers: ['streak-7'],
					by: 'aj'
				}
			]
		};
		expect(pickFun('level-complete', withMeme, base)).toMatchObject({
			kind: 'message',
			meme: { file: 'crying-cat.jpg' }
		});
		expect(pickFun('streak-7', withMeme, base)).toMatchObject({
			kind: 'meme',
			alt: 'A crying cat'
		});
	});
});

describe('event helpers', () => {
	it('late night is 22:00–04:59', () => {
		expect(isLateNight(new Date(2026, 10, 17, 22, 0))).toBe(true);
		expect(isLateNight(new Date(2026, 10, 17, 4, 59))).toBe(true);
		expect(isLateNight(new Date(2026, 10, 17, 21, 59))).toBe(false);
		expect(isLateNight(new Date(2026, 10, 17, 5, 0))).toBe(false);
	});
	it('detects a wrong streak of 3', () => {
		expect(endsWithWrongStreak(['correct', 'wrong', 'wrong', 'wrong'])).toBe(true);
		expect(endsWithWrongStreak(['wrong', 'wrong', 'near-miss'])).toBe(false);
		expect(endsWithWrongStreak(['wrong', 'wrong'])).toBe(false);
	});
	it('orders session-end events most specific first', () => {
		const noon = new Date(2026, 10, 17, 12, 0);
		expect(sessionEndEvents(['correct', 'near-miss'], noon, false)).toEqual([
			'perfect-session',
			'session-done'
		]);
		expect(sessionEndEvents(['wrong'], new Date(2026, 10, 17, 23, 0), true)).toEqual([
			'first-session',
			'late-night',
			'session-done'
		]);
	});
});
