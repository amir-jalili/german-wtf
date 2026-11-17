/**
 * Backup format: a JSON export of all tables plus versions. One schema per Dexie version;
 * `parseBackup` accepts every old version and upgrades it, so old backups always import.
 * Fixtures: tests/fixtures/backup-v<n>.json (keep forever, CLAUDE.md §9).
 */
import { z } from 'zod';
import { DB_VERSION, type GymDB, type ReviewLogEntry } from './schema.js';

const VerdictSchema = z.enum(['correct', 'near-miss', 'wrong']);
const AnswerSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('cloze'), gaps: z.array(z.string()) }),
	z.object({ type: z.literal('choice'), option: z.string() }),
	z.object({ type: z.literal('order'), tiles: z.array(z.string()) })
]);

export const ReviewLogEntrySchema = z.object({
	id: z.number().int().optional(),
	itemId: z.string(),
	pointId: z.string(),
	cardKey: z.string(),
	verdict: VerdictSchema,
	answer: AnswerSchema,
	ms: z.number().nonnegative(),
	timestamp: z.number().int().positive(),
	mode: z.literal('practice')
});

const KeyValue = z.object({ key: z.string(), value: z.unknown() });

const TablesV1 = z.object({
	reviewLog: z.array(ReviewLogEntrySchema),
	settings: z.array(KeyValue),
	meta: z.array(KeyValue)
});

export const BackupV1Schema = z.object({
	// Storage identifier, deliberately NOT renamed with the app (ADR 0006).
	app: z.literal('grammatik-gym'),
	dbVersion: z.literal(1),
	appVersion: z.string(),
	exportedAt: z.string(),
	tables: TablesV1
});

export const FunSeenEntrySchema = z.object({
	id: z.number().int().optional(),
	funId: z.string(),
	event: z.string(),
	timestamp: z.number().int().positive()
});

/** v2 (P1.12) adds the funSeen table. */
export const BackupV2Schema = BackupV1Schema.extend({
	dbVersion: z.literal(2),
	tables: TablesV1.extend({ funSeen: z.array(FunSeenEntrySchema) })
});

export type BackupV1 = z.infer<typeof BackupV1Schema>;
export type Backup = z.infer<typeof BackupV2Schema>;

/** Reads a backup of any known version and upgrades it to the newest shape. */
export function parseBackup(data: unknown): Backup {
	const v2 = BackupV2Schema.safeParse(data);
	if (v2.success) return v2.data;
	const v1 = BackupV1Schema.parse(data);
	return { ...v1, dbVersion: 2, tables: { ...v1.tables, funSeen: [] } };
}

export async function exportBackup(
	db: GymDB,
	appVersion: string,
	now = new Date()
): Promise<Backup> {
	const version: Backup['dbVersion'] = DB_VERSION;
	return db.transaction('r', [db.reviewLog, db.settings, db.meta, db.funSeen], async () => ({
		app: 'grammatik-gym' as const,
		dbVersion: version,
		appVersion,
		exportedAt: now.toISOString(),
		tables: {
			reviewLog: (await db.reviewLog.toArray()) as ReviewLogEntry[],
			settings: await db.settings.toArray(),
			meta: await db.meta.toArray(),
			funSeen: await db.funSeen.toArray()
		}
	}));
}

export function backupFileName(now = new Date()): string {
	return `german-wtf-backup-${now.toISOString().slice(0, 10)}.json`;
}
