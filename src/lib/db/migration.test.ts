/**
 * Migration tests (CLAUDE.md §9): a database written by an older schema version, filled
 * from that version's committed backup fixture, must open with the current code without
 * losing anything. Add one block per new version; keep the old ones forever.
 */
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	BackupV1Schema,
	BackupV2Schema,
	BackupV3Schema,
	exportBackup,
	parseBackup
} from './backup';
import { recentFunIds, recordFunSeen } from './fun-seen';
import { DB_VERSION, GymDB } from './schema';
import { loadSettings, saveSetting } from './settings';

const fixtureV1 = BackupV1Schema.parse(
	JSON.parse(readFileSync('tests/fixtures/backup-v1.json', 'utf8'))
);

/** The v1 schema exactly as shipped in 0.1.0 (copied, never edited). */
function openV1(name: string): Dexie {
	const db = new Dexie(name);
	db.version(1).stores({
		reviewLog: '++id, itemId, pointId, cardKey, timestamp',
		settings: '&key',
		meta: '&key'
	});
	return db;
}

const fixtureV2 = BackupV2Schema.parse(
	JSON.parse(readFileSync('tests/fixtures/backup-v2.json', 'utf8'))
);
const fixtureV3Raw: unknown = JSON.parse(readFileSync('tests/fixtures/backup-v3.json', 'utf8'));

/** The v2 schema exactly as shipped in 0.2.x (copied, never edited). */
function openV2(name: string): Dexie {
	const db = openV1(name);
	db.version(2).stores({ funSeen: '++id, funId, timestamp' });
	return db;
}

describe('Dexie migrations', () => {
	it('v1 → current: all review log, settings and meta rows survive; funSeen exists and is empty', async () => {
		const name = 'migrate-v1';
		const v1 = openV1(name);
		await v1.open();
		await v1.table('reviewLog').bulkAdd(fixtureV1.tables.reviewLog);
		await v1.table('settings').bulkAdd(fixtureV1.tables.settings);
		await v1.table('meta').bulkAdd(fixtureV1.tables.meta);
		v1.close();

		const db = new GymDB(name);
		await db.open();
		expect(db.verno).toBe(DB_VERSION);
		expect(await db.reviewLog.toArray()).toEqual(fixtureV1.tables.reviewLog);
		expect(await db.settings.toArray()).toEqual(fixtureV1.tables.settings);
		expect(await db.meta.toArray()).toEqual(fixtureV1.tables.meta);
		expect(await db.funSeen.count()).toBe(0);
		// v3 replays the v1 answers into one card per point × skill
		const keys = new Set(fixtureV1.tables.reviewLog.map((e) => e.cardKey));
		expect((await db.cards.toArray()).map((c) => c.key).sort()).toEqual([...keys].sort());
		await db.delete();
	});

	it('v2 → v3: every row survives and the answers are replayed into SRS cards', async () => {
		const name = 'migrate-v2';
		const v2 = openV2(name);
		await v2.open();
		await v2.table('reviewLog').bulkAdd(fixtureV2.tables.reviewLog);
		await v2.table('settings').bulkAdd(fixtureV2.tables.settings);
		await v2.table('meta').bulkAdd(fixtureV2.tables.meta);
		await v2.table('funSeen').bulkAdd(fixtureV2.tables.funSeen);
		v2.close();

		const db = new GymDB(name);
		await db.open();
		expect(db.verno).toBe(3);
		expect(await db.reviewLog.toArray()).toEqual(fixtureV2.tables.reviewLog);
		// IndexedDB returns rows in key order
		expect(await db.settings.toArray()).toEqual(
			[...fixtureV2.tables.settings].sort((a, b) => a.key.localeCompare(b.key))
		);
		expect(await db.meta.toArray()).toEqual(fixtureV2.tables.meta);
		expect(await db.funSeen.toArray()).toEqual(fixtureV2.tables.funSeen);
		const cards = await db.cards.toArray();
		const keys = new Set(fixtureV2.tables.reviewLog.map((e) => e.cardKey));
		expect(cards.map((c) => c.key).sort()).toEqual([...keys].sort());
		for (const card of cards) {
			expect(card.fsrs.reps).toBeGreaterThan(0);
			expect(card.fsrs.dueAt).toBeInstanceOf(Date);
		}
		// no error tags were stored before v3
		expect(await db.mistakeCards.count()).toBe(0);
		// and the due index works
		expect(await db.cards.where('fsrs.dueAt').belowOrEqual(new Date('2100-01-01')).count()).toBe(
			cards.length
		);
		await db.delete();
	});

	it('a fresh database opens at v3 with no cards', async () => {
		const db = new GymDB('fresh-v3');
		await db.open();
		expect(db.verno).toBe(3);
		expect(await db.cards.count()).toBe(0);
		await db.delete();
	});

	it('old v1 and v2 backups still parse and are upgraded to v3 with replayed cards', () => {
		const fromV1 = parseBackup(fixtureV1);
		expect(fromV1.dbVersion).toBe(3);
		expect(fromV1.tables.funSeen).toEqual([]);
		expect(fromV1.tables.reviewLog).toHaveLength(3);
		expect(fromV1.tables.cards.length).toBeGreaterThan(0);
		const fromV2 = parseBackup(fixtureV2);
		expect(fromV2.dbVersion).toBe(3);
		expect(fromV2.tables.funSeen).toHaveLength(2);
		expect(fromV2.tables.mistakeCards).toEqual([]);
	});

	it('the committed v3 fixture validates and turns ISO strings back into Dates', () => {
		const v3 = parseBackup(fixtureV3Raw);
		expect(BackupV3Schema.safeParse(fixtureV3Raw).success).toBe(true);
		expect(v3.tables.cards).toHaveLength(3);
		expect(v3.tables.mistakeCards.map((c) => c.key)).toEqual(['mistake:dative-articles:case']);
		expect(v3.tables.cards[0]!.fsrs.dueAt).toBeInstanceOf(Date);
		expect(v3.tables.reviewLog.find((e) => e.errorTags)?.errorTags).toEqual(['case']);
	});

	it('v3 export → JSON → parse round-trips cards exactly', async () => {
		const db = new GymDB('roundtrip-v3');
		const v3 = parseBackup(fixtureV3Raw);
		await db.cards.bulkAdd(v3.tables.cards);
		await db.mistakeCards.bulkAdd(v3.tables.mistakeCards);
		const exported = await exportBackup(db, '0.3.0', new Date('2026-11-18T00:00:00Z'));
		const back = parseBackup(JSON.parse(JSON.stringify(exported)));
		expect(back.tables.cards).toEqual(v3.tables.cards);
		expect(back.tables.mistakeCards).toEqual(v3.tables.mistakeCards);
		await db.delete();
	});

	it('the committed v2 fixture validates', () => {
		expect(parseBackup(fixtureV2).tables.funSeen).toHaveLength(2);
	});
});

describe('funSeen and settings', () => {
	it('records fun picks and returns recent ids oldest first', async () => {
		const db = new GymDB('fun-seen');
		await recordFunSeen(db, 'a', 'session-done', 1);
		await recordFunSeen(db, 'b', 'near-miss', 2);
		await recordFunSeen(db, 'c', 'session-done', 3);
		expect(await recentFunIds(db, 2)).toEqual(['b', 'c']);
		await db.delete();
	});

	it('settings default to chaos "some" and persist changes; unknown values fall back', async () => {
		const db = new GymDB('settings');
		expect((await loadSettings(db)).catChaos).toBe('some');
		expect((await loadSettings(db)).targetRetention).toBe(0.9);
		await saveSetting(db, 'targetRetention', 0.5);
		expect((await loadSettings(db)).targetRetention).toBe(0.7);
		await db.settings.put({ key: 'targetRetention', value: 'high' });
		expect((await loadSettings(db)).targetRetention).toBe(0.9);
		await saveSetting(db, 'catChaos', 'maximum');
		expect((await loadSettings(db)).catChaos).toBe('maximum');
		await db.settings.put({ key: 'catChaos', value: 'banana' });
		expect((await loadSettings(db)).catChaos).toBe('some');
		await db.delete();
	});
});
