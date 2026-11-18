import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportBackup, parseBackup } from './backup';
import { BackupImportError, importBackup } from './import';
import { GymDB } from './schema';

const fixture = (v: number) => readFileSync(`tests/fixtures/backup-v${v}.json`, 'utf8');

let db: GymDB;
let n = 0;
beforeEach(async () => {
	db = new GymDB(`import-${n++}`);
	await db.open();
	await db.reviewLog.add({
		itemId: 'old/001',
		pointId: 'old',
		cardKey: 'old:form',
		verdict: 'correct',
		answer: { type: 'choice', option: 'x' },
		ms: 1,
		timestamp: 1,
		mode: 'practice'
	});
});
afterEach(async () => {
	await db.delete();
});

describe('importBackup', () => {
	it.each([1, 2, 3, 4])(
		'imports a v%i backup, replacing what was there and rebuilding cards',
		async (v) => {
			const summary = await importBackup(db, fixture(v));
			const expected = parseBackup(JSON.parse(fixture(v)));
			expect(summary.fromVersion).toBe(v);
			expect(summary.answers).toBe(expected.tables.reviewLog.length);
			expect(await db.reviewLog.toArray()).toEqual(expected.tables.reviewLog);
			expect(await db.reviewLog.where('pointId').equals('old').count()).toBe(0);
			const keys = new Set(expected.tables.reviewLog.map((e) => e.cardKey));
			expect((await db.cards.toArray()).map((c) => c.key).sort()).toEqual([...keys].sort());
		}
	);

	it('v3: rebuilt cards equal the cards in the backup (both come from the same replay)', async () => {
		await importBackup(db, fixture(3));
		const expected = parseBackup(JSON.parse(fixture(3)));
		expect(await db.cards.toArray()).toEqual(
			[...expected.tables.cards].sort((a, b) => a.key.localeCompare(b.key))
		);
		expect(await db.mistakeCards.toArray()).toEqual(expected.tables.mistakeCards);
	});

	it('a v4 backup replaces the books; an older one keeps the books on this device', async () => {
		const v4 = parseBackup(JSON.parse(fixture(4)));
		const mine = { ...v4.tables.bookPacks[0]!, slug: 'mein-buch', title: 'Mein Buch' };
		await db.bookPacks.add(mine);
		expect((await importBackup(db, fixture(3))).books).toBe(1);
		expect((await db.bookPacks.toArray()).map((b) => b.slug)).toEqual(['mein-buch']);
		expect((await importBackup(db, fixture(4))).books).toBe(1);
		expect((await db.bookPacks.toArray()).map((b) => b.slug)).toEqual(['testbuch-a2']);
	});

	it('export → import round-trips', async () => {
		await importBackup(db, fixture(4));
		const exported = JSON.stringify(await exportBackup(db, '0.3.0'));
		const other = new GymDB(`import-other-${n}`);
		await importBackup(other, exported);
		expect(await other.reviewLog.toArray()).toEqual(await db.reviewLog.toArray());
		expect(await other.cards.toArray()).toEqual(await db.cards.toArray());
		expect(await other.bookPacks.toArray()).toEqual(await db.bookPacks.toArray());
		await other.delete();
	});

	it.each([
		['not JSON', 'hello', 'This file is not JSON.'],
		['another app', JSON.stringify({ app: 'other', dbVersion: 3 }), /not a German WTF backup/],
		['damaged', fixture(3).replace('"verdict": "correct"', '"verdict": "maybe"'), /damaged/]
	])('rejects %s and changes nothing', async (_, text, message) => {
		await expect(importBackup(db, text)).rejects.toThrow(BackupImportError);
		await expect(importBackup(db, text)).rejects.toThrow(message);
		expect(await db.reviewLog.count()).toBe(1);
		expect((await db.reviewLog.toArray())[0]!.itemId).toBe('old/001');
	});
});
