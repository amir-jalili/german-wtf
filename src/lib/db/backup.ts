/**
 * Backup format: a JSON export of all tables plus versions. Validated with Zod on import
 * (P2.8) and by the migration tests against tests/fixtures/backup-v<n>.json.
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

export const BackupV1Schema = z.object({
	// Storage identifier, deliberately NOT renamed with the app (ADR 0006).
	app: z.literal('grammatik-gym'),
	dbVersion: z.literal(1),
	appVersion: z.string(),
	exportedAt: z.string(),
	tables: z.object({
		reviewLog: z.array(ReviewLogEntrySchema),
		settings: z.array(KeyValue),
		meta: z.array(KeyValue)
	})
});

export type Backup = z.infer<typeof BackupV1Schema>;

export async function exportBackup(
	db: GymDB,
	appVersion: string,
	now = new Date()
): Promise<Backup> {
	return db.transaction('r', db.reviewLog, db.settings, db.meta, async () => ({
		app: 'grammatik-gym' as const,
		dbVersion: DB_VERSION,
		appVersion,
		exportedAt: now.toISOString(),
		tables: {
			reviewLog: (await db.reviewLog.toArray()) as ReviewLogEntry[],
			settings: await db.settings.toArray(),
			meta: await db.meta.toArray()
		}
	}));
}

export function backupFileName(now = new Date()): string {
	return `german-wtf-backup-${now.toISOString().slice(0, 10)}.json`;
}
