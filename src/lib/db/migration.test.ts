/**
 * Migration tests (CLAUDE.md §9): a database written by an older schema version, filled
 * from that version's committed backup fixture, must open with the current code without
 * losing anything. Add one block per new version; keep the old ones forever.
 */
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BackupV1Schema, BackupV2Schema, parseBackup } from './backup';
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
		await db.delete();
	});

	it('old v1 backups still parse and are upgraded to the v2 shape', () => {
		const upgraded = parseBackup(fixtureV1);
		expect(upgraded.dbVersion).toBe(2);
		expect(upgraded.tables.funSeen).toEqual([]);
		expect(upgraded.tables.reviewLog).toHaveLength(3);
	});

	it('the committed v2 fixture validates', () => {
		const v2 = BackupV2Schema.parse(
			JSON.parse(readFileSync('tests/fixtures/backup-v2.json', 'utf8'))
		);
		expect(parseBackup(v2).tables.funSeen).toHaveLength(2);
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
		await saveSetting(db, 'catChaos', 'maximum');
		expect((await loadSettings(db)).catChaos).toBe('maximum');
		await db.settings.put({ key: 'catChaos', value: 'banana' });
		expect((await loadSettings(db)).catChaos).toBe('some');
		await db.delete();
	});
});
