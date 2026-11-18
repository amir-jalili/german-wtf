/**
 * Backup format: a JSON export of all tables plus versions. One schema per Dexie version;
 * `parseBackup` accepts every old version and upgrades it, so old backups always import.
 * Fixtures: tests/fixtures/backup-v<n>.json (keep forever, CLAUDE.md §9).
 */
import { z } from 'zod';
import { PackedBookSchema } from '#lib/engine/content/books.js';
import { ErrorTagSchema, SkillSchema } from '#lib/engine/content/schema.js';
import {
	createScheduler,
	replayAnswers,
	type MistakeCard,
	type PointCard
} from '#lib/engine/scheduler/index.js';
import { clampRetention, DEFAULT_RETENTION } from '#lib/engine/scheduler/retention.js';
import {
	ANSWER_MODES,
	DB_VERSION,
	type GymDB,
	type ReviewLogEntry,
	type StoredBook
} from './schema.js';

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

/** FSRS state as ts-fsrs returns it; JSON turns its Dates into ISO strings, so coerce back. */
const FsrsCardSchema = z.looseObject({
	stability: z.number(),
	stabilityFast: z.number(),
	difficulty: z.number(),
	state: z.number().int(),
	scheduleStatus: z.string(),
	dueAt: z.coerce.date(),
	lastReviewAt: z.coerce.date().nullable(),
	cardId: z.union([z.string(), z.number()]),
	reps: z.number().int().nonnegative(),
	lapses: z.number().int().nonnegative(),
	scheduledDays: z.number(),
	learningStep: z.number()
});

const LeechSchema = z.object({
	flaggedAt: z.coerce.date(),
	lapsesAtFlag: z.number().int(),
	scaffoldLeft: z.number().int().nonnegative()
});

export const PointCardSchema = z.object({
	key: z.string(),
	pointId: z.string(),
	skill: SkillSchema,
	fsrs: FsrsCardSchema,
	leech: LeechSchema.optional()
});

export const MistakeCardSchema = z.object({
	key: z.string().startsWith('mistake:'),
	pointId: z.string(),
	errorTag: ErrorTagSchema,
	fsrs: FsrsCardSchema,
	createdAt: z.coerce.date(),
	correctStreak: z.number().int().nonnegative(),
	resolvedAt: z.coerce.date().optional(),
	leech: LeechSchema.optional()
});

/** v3 (P2.3) adds SRS cards and error tags on wrong answers. */
export const BackupV3Schema = BackupV2Schema.extend({
	dbVersion: z.literal(3),
	tables: BackupV2Schema.shape.tables.extend({
		reviewLog: z.array(
			ReviewLogEntrySchema.extend({
				mode: z.enum(ANSWER_MODES),
				errorTags: z.array(ErrorTagSchema).optional(),
				mistakeKey: z.string().optional()
			})
		),
		cards: z.array(PointCardSchema),
		mistakeCards: z.array(MistakeCardSchema)
	})
});

export const StoredBookSchema = PackedBookSchema.extend({
	packHash: z.string(),
	packCreatedAt: z.string(),
	importedAt: z.number().int()
});

/** v4 (P2.9b) adds the imported book packs. */
export const BackupV4Schema = BackupV3Schema.extend({
	dbVersion: z.literal(4),
	tables: BackupV3Schema.shape.tables.extend({ bookPacks: z.array(StoredBookSchema) })
});

export type BackupV1 = z.infer<typeof BackupV1Schema>;
export type BackupV2 = z.infer<typeof BackupV2Schema>;
type ParsedV3 = z.infer<typeof BackupV3Schema>;
type ParsedV4 = z.infer<typeof BackupV4Schema>;
/** v3 with cards typed as the engine's card types (the loose FSRS schema keeps every field). */
type BackupV3 = Omit<ParsedV3, 'tables'> & {
	tables: Omit<ParsedV3['tables'], 'cards' | 'mistakeCards'> & {
		cards: PointCard[];
		mistakeCards: MistakeCard[];
	};
};
/** The newest backup shape. */
export type Backup = Omit<ParsedV4, 'tables'> & {
	tables: BackupV3['tables'] & { bookPacks: StoredBook[] };
};

function v1ToV2(v1: BackupV1): BackupV2 {
	return { ...v1, dbVersion: 2, tables: { ...v1.tables, funSeen: [] } };
}

/** Like the Dexie v3 upgrade: replay the answers into cards (mistake cards need tags v2 lacks). */
function v2ToV3(v2: BackupV2): BackupV3 {
	const setting = v2.tables.settings.find((r) => r.key === 'targetRetention')?.value;
	const retention = typeof setting === 'number' ? clampRetention(setting) : DEFAULT_RETENTION;
	const { cards, mistakeCards } = replayAnswers(createScheduler(retention), v2.tables.reviewLog);
	return { ...v2, dbVersion: 3, tables: { ...v2.tables, cards, mistakeCards } };
}

function v3ToV4(v3: BackupV3): Backup {
	return { ...v3, dbVersion: 4, tables: { ...v3.tables, bookPacks: [] } };
}

/**
 * Reads a backup of any known version and upgrades it to the newest shape.
 * `hadBooks` is false for backups from before v4: they carry no book packs, and importing
 * them should keep the books already on this device.
 */
export function parseBackupWithInfo(data: unknown): { backup: Backup; hadBooks: boolean } {
	const v4 = BackupV4Schema.safeParse(data);
	if (v4.success) return { backup: v4.data as Backup, hadBooks: true };
	const v3 = BackupV3Schema.safeParse(data);
	if (v3.success) return { backup: v3ToV4(v3.data as BackupV3), hadBooks: false };
	const v2 = BackupV2Schema.safeParse(data);
	if (v2.success) return { backup: v3ToV4(v2ToV3(v2.data)), hadBooks: false };
	return { backup: v3ToV4(v2ToV3(v1ToV2(BackupV1Schema.parse(data)))), hadBooks: false };
}

export function parseBackup(data: unknown): Backup {
	return parseBackupWithInfo(data).backup;
}

export async function exportBackup(
	db: GymDB,
	appVersion: string,
	now = new Date()
): Promise<Backup> {
	const version: Backup['dbVersion'] = DB_VERSION;
	const tables = [
		db.reviewLog,
		db.settings,
		db.meta,
		db.funSeen,
		db.cards,
		db.mistakeCards,
		db.bookPacks
	];
	return db.transaction('r', tables, async () => ({
		app: 'grammatik-gym' as const,
		dbVersion: version,
		appVersion,
		exportedAt: now.toISOString(),
		tables: {
			reviewLog: (await db.reviewLog.toArray()) as ReviewLogEntry[],
			settings: await db.settings.toArray(),
			meta: await db.meta.toArray(),
			funSeen: await db.funSeen.toArray(),
			cards: await db.cards.toArray(),
			mistakeCards: await db.mistakeCards.toArray(),
			bookPacks: await db.bookPacks.toArray()
		}
	}));
}

export function backupFileName(now = new Date()): string {
	return `german-wtf-backup-${now.toISOString().slice(0, 10)}.json`;
}
