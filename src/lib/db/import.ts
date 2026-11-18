/**
 * Importing a backup (P2.8a). Validates first (any known version, upgraded by
 * `parseBackup`); only a valid file touches the database. Then every table is replaced in
 * ONE transaction (all or nothing) and the cards are rebuilt from the imported review log
 * (ADR 0007: cards are a cache of the log). Book packs are replaced only by a v4+ backup.
 */
import { createScheduler, replayAnswers } from '#lib/engine/scheduler/index.js';
import { clampRetention, DEFAULT_RETENTION } from '#lib/engine/scheduler/retention.js';
import { parseBackupWithInfo, type Backup } from './backup.js';
import type { GymDB } from './schema.js';

export interface ImportSummary {
	answers: number;
	cards: number;
	books: number;
	fromVersion: number;
	appVersion: string;
	exportedAt: string;
}

export class BackupImportError extends Error {
	override name = 'BackupImportError';
}

/** Parses JSON text into a validated, upgraded backup, or throws a readable error. */
export function readBackupText(text: string): {
	backup: Backup;
	fromVersion: number;
	hadBooks: boolean;
} {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new BackupImportError('This file is not JSON.');
	}
	const fromVersion =
		typeof raw === 'object' && raw !== null && 'dbVersion' in raw
			? Number((raw as { dbVersion: unknown }).dbVersion)
			: NaN;
	try {
		return { ...parseBackupWithInfo(raw), fromVersion };
	} catch {
		throw new BackupImportError('This is not a German WTF backup (or it is damaged).');
	}
}

export async function importBackup(db: GymDB, text: string): Promise<ImportSummary> {
	const { backup, fromVersion, hadBooks } = readBackupText(text);
	const t = backup.tables;
	const setting = t.settings.find((r) => r.key === 'targetRetention')?.value;
	const retention = typeof setting === 'number' ? clampRetention(setting) : DEFAULT_RETENTION;
	const { cards, mistakeCards } = replayAnswers(createScheduler(retention), t.reviewLog);
	const progress = [db.reviewLog, db.settings, db.meta, db.funSeen, db.cards, db.mistakeCards];
	// Backups from before v4 have no book packs: keep the books already on this device.
	const cleared = hadBooks ? [...progress, db.bookPacks] : progress;
	await db.transaction('rw', [...progress, db.bookPacks], async () => {
		await Promise.all(cleared.map((table) => table.clear()));
		await db.reviewLog.bulkAdd(t.reviewLog);
		await db.settings.bulkAdd(t.settings);
		await db.meta.bulkAdd(t.meta);
		await db.funSeen.bulkAdd(t.funSeen);
		await db.cards.bulkAdd(cards);
		await db.mistakeCards.bulkAdd(mistakeCards);
		if (hadBooks) await db.bookPacks.bulkAdd(t.bookPacks);
	});
	return {
		answers: t.reviewLog.length,
		cards: cards.length,
		books: hadBooks ? t.bookPacks.length : await db.bookPacks.count(),
		fromVersion,
		appVersion: backup.appVersion,
		exportedAt: backup.exportedAt
	};
}
