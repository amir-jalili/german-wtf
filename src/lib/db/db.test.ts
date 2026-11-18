import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ItemSchema } from '#lib/engine/content/schema.js';
import { checkItem } from '#lib/engine/checker/index.js';
import { BackupV1Schema, BackupV4Schema, backupFileName, exportBackup } from './backup';
import { countAnswers, logAnswer, toLogEntry } from './review-log';
import { DB_VERSION, GymDB } from './schema';

const item = ItemSchema.parse({
	id: 'dative-articles/001',
	type: 'cloze',
	level: 'A2',
	skill: 'form',
	text: 'Ich fahre mit {{dem}} Bus zur Uni.',
	accepted: ['dem'],
	explanation: 'x',
	errorTags: ['article-form'],
	review: { status: 'verified', by: 'c', date: '2026-11-17' },
	source: 'original'
});

let db: GymDB;
let n = 0;
beforeEach(async () => {
	db = new GymDB(`test-${n++}`);
	await db.open();
});
afterEach(async () => {
	await db.delete();
});

describe('GymDB', () => {
	it('opens at the current version and writes createdAt on first open', async () => {
		expect(db.verno).toBe(DB_VERSION);
		expect((await db.meta.get('createdAt'))?.value).toEqual(expect.any(Number));
	});

	it('logs every answer with card key, verdict and a plain copy of the answer', async () => {
		const answer = { type: 'cloze' as const, gaps: ['den'] };
		await logAnswer(
			db,
			{ item, pointId: 'dative-articles', answer, check: checkItem(item, answer), ms: 4321.7 },
			1_800_000_000_000
		);
		const [row] = await db.reviewLog.toArray();
		expect(row).toMatchObject({
			itemId: 'dative-articles/001',
			cardKey: 'dative-articles:form',
			verdict: 'wrong',
			answer: { type: 'cloze', gaps: ['den'] },
			ms: 4322,
			timestamp: 1_800_000_000_000,
			mode: 'practice',
			errorTags: ['article-form']
		});
		expect(await countAnswers(db)).toBe(1);
	});

	it('exports a backup that validates against the current (v4) backup schema', async () => {
		const answer = { type: 'cloze' as const, gaps: ['dem'] };
		await logAnswer(db, {
			item,
			pointId: 'dative-articles',
			answer,
			check: checkItem(item, answer),
			ms: 900
		});
		await db.settings.put({ key: 'theme', value: 'dark' });
		const backup = await exportBackup(db, '0.1.0', new Date('2026-11-17T12:00:00Z'));
		expect(BackupV4Schema.parse(backup).tables.reviewLog).toHaveLength(1);
		expect(backup.tables.bookPacks).toEqual([]);
		expect(backup.tables.settings).toEqual([{ key: 'theme', value: 'dark' }]);
		expect(backupFileName(new Date('2026-11-17T12:00:00Z'))).toBe(
			'german-wtf-backup-2026-11-17.json'
		);
	});

	it('the committed v1 fixture still validates (kept forever for migration tests)', () => {
		const fixture = JSON.parse(readFileSync('tests/fixtures/backup-v1.json', 'utf8'));
		expect(BackupV1Schema.parse(fixture).dbVersion).toBe(1);
	});

	it('toLogEntry is pure', () => {
		const answer = { type: 'choice' as const, option: 'dem' };
		const choice = ItemSchema.parse({
			...item,
			type: 'choice',
			text: 'mit ___ Bus',
			options: ['dem', 'den'],
			answer: 'dem',
			accepted: undefined
		});
		expect(
			toLogEntry({ item: choice, pointId: 'p', answer, check: checkItem(choice, answer), ms: 1 }, 5)
				.verdict
		).toBe('correct');
		// correct answers carry no error tags
		expect(
			'errorTags' in
				toLogEntry(
					{ item: choice, pointId: 'p', answer, check: checkItem(choice, answer), ms: 1 },
					5
				)
		).toBe(false);
	});
});
