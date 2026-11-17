import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkItem } from '#lib/engine/checker/index.js';
import { ItemSchema } from '#lib/engine/content/schema.js';
import { logAnswer } from './review-log';
import { GymDB } from './schema';
import { loadSettings } from './settings';
import { loadSrsState, rebuildAllCards, refreshCardsForPoint, startOfLocalDay } from './srs';

const item = (n: number) =>
	ItemSchema.parse({
		id: `dative-articles/${String(n).padStart(3, '0')}`,
		type: 'cloze',
		level: 'A2',
		skill: 'form',
		text: 'Ich fahre mit {{dem}} Bus.',
		accepted: ['dem'],
		explanation: 'x',
		errorTags: ['case'],
		review: { status: 'verified', by: 'c', date: '2026-11-17' },
		source: 'original'
	});

const NOW = new Date('2026-11-17T12:00:00');
let db: GymDB;
let n = 0;
beforeEach(async () => {
	db = new GymDB(`srs-${n++}`);
	await db.open();
});
afterEach(async () => {
	await db.delete();
});

async function answer(i: number, gap: string, at: number, extra = {}) {
	const it = item(i);
	const a = { type: 'cloze' as const, gaps: [gap] };
	await logAnswer(
		db,
		{
			item: it,
			pointId: 'dative-articles',
			answer: a,
			check: checkItem(it, a),
			ms: 4000,
			...extra
		},
		at
	);
}

describe('SRS storage', () => {
	it('refreshCardsForPoint rebuilds point and mistake cards from the log', async () => {
		await answer(1, 'dem', NOW.getTime() - 5 * 60_000);
		await answer(2, 'den', NOW.getTime()); // wrong → mistake card for 'case'
		await refreshCardsForPoint(db, 'dative-articles', 0.9);
		const cards = await db.cards.toArray();
		expect(cards.map((c) => c.key)).toEqual(['dative-articles:form']);
		expect(cards[0]!.fsrs.reps).toBe(1); // one sitting = one review
		expect((await db.mistakeCards.toArray()).map((m) => m.key)).toEqual([
			'mistake:dative-articles:case'
		]);
		// idempotent
		await refreshCardsForPoint(db, 'dative-articles', 0.9);
		expect(await db.cards.count()).toBe(1);
	});

	it('logs session mode and mistake key, and a correct mistake review counts', async () => {
		await answer(1, 'den', NOW.getTime() - 2 * 86_400_000);
		await answer(2, 'dem', NOW.getTime(), {
			mode: 'mistake',
			mistakeKey: 'mistake:dative-articles:case'
		});
		const rows = await db.reviewLog.toArray();
		expect(rows[1]).toMatchObject({ mode: 'mistake', mistakeKey: 'mistake:dative-articles:case' });
		await refreshCardsForPoint(db, 'dative-articles', 0.9);
		const [m] = await db.mistakeCards.toArray();
		expect(m!.correctStreak).toBe(1);
	});

	it('loadSrsState returns last-seen times, recent ids and points started today', async () => {
		const yesterday = startOfLocalDay(NOW) - 3_600_000;
		await answer(1, 'dem', yesterday);
		await answer(2, 'dem', NOW.getTime() - 60_000);
		await answer(1, 'dem', NOW.getTime());
		const state = await loadSrsState(db, NOW, 2);
		expect(state.lastSeen.get('dative-articles/001')).toBe(NOW.getTime());
		expect(state.recentItemIds).toEqual(['dative-articles/002', 'dative-articles/001']);
		expect(state.newToday).toBe(0); // first answered yesterday
		expect(state.lastAnswerAt).toBe(NOW.getTime());
		const fresh = new GymDB(`srs-fresh-${n}`);
		const empty = await loadSrsState(fresh, NOW);
		expect(empty).toMatchObject({ cards: [], recentItemIds: [], newToday: 0 });
		await fresh.delete();
	});

	it('rebuildAllCards uses the new retention: higher retention → due sooner', async () => {
		await answer(1, 'dem', NOW.getTime() - 3 * 86_400_000);
		await answer(2, 'dem', NOW.getTime());
		await rebuildAllCards(db, 0.8);
		const loose = (await db.cards.toArray())[0]!.fsrs.dueAt.getTime();
		await rebuildAllCards(db, 0.95);
		const strict = (await db.cards.toArray())[0]!.fsrs.dueAt.getTime();
		expect(strict).toBeLessThan(loose);
		expect(await db.cards.count()).toBe(1);
	});

	it('session settings have defaults and reject bad values', async () => {
		expect(await loadSettings(db)).toMatchObject({
			dailyMinutes: 15,
			newPerDay: 1,
			showStreak: true
		});
		await db.settings.bulkPut([
			{ key: 'dailyMinutes', value: 25 },
			{ key: 'newPerDay', value: 9 }
		]);
		expect(await loadSettings(db)).toMatchObject({ dailyMinutes: 25, newPerDay: 1 });
		expect(await loadSettings(db)).toMatchObject({ theme: 'system', ttsRate: 0.95, ttsVoice: '' });
		await db.settings.bulkPut([
			{ key: 'theme', value: 'dark' },
			{ key: 'ttsRate', value: 9 },
			{ key: 'ttsVoice', value: 'Anna' }
		]);
		expect(await loadSettings(db)).toMatchObject({
			theme: 'dark',
			ttsRate: 0.95,
			ttsVoice: 'Anna'
		});
	});
});
