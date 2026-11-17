/**
 * IndexedDB schema (ARCHITECTURE §6). Every change is a NEW `this.version(n)` block with
 * an upgrade function and a migration test against tests/fixtures/backup-v<n-1>.json —
 * never edit an existing version (CLAUDE.md §9: never lose progress).
 */
import Dexie, { type EntityTable } from 'dexie';
import type { ItemAnswer } from '#lib/engine/checker/index.js';
import type { ErrorTag } from '#lib/engine/content/schema.js';
import {
	createScheduler,
	replayAnswers,
	type MistakeCard,
	type PointCard
} from '#lib/engine/scheduler/index.js';
import { clampRetention, DEFAULT_RETENTION } from '#lib/engine/scheduler/retention.js';

export type Verdict = 'correct' | 'near-miss' | 'wrong';

/** One answered item. Append-only. */
export interface ReviewLogEntry {
	id?: number;
	itemId: string;
	pointId: string;
	/** SRS card key `pointId:skill` (Phase 2 schedules by it). */
	cardKey: string;
	verdict: Verdict;
	answer: ItemAnswer;
	/** Milliseconds from showing the item to the answer. */
	ms: number;
	/** Unix ms. */
	timestamp: number;
	/** Where the answer came from. */
	mode: 'practice';
	/** Diagnosed error tags of a wrong answer (v3+, P2.3). Older entries have none. */
	errorTags?: ErrorTag[];
}

export interface SettingRow {
	key: string;
	value: unknown;
}

/** One fun pick that was shown (THEME_AND_FUN.md §2). Used to avoid repeats. */
export interface FunSeenEntry {
	id?: number;
	funId: string;
	event: string;
	timestamp: number;
}

export interface MetaRow {
	key: string;
	value: unknown;
}

/** Storage key — deliberately unchanged by the rename to German WTF (ADR 0006). Never change it. */
export const DB_NAME = 'grammatik-gym';
/** The newest Dexie schema version. */
export const DB_VERSION = 3 as const;

export class GymDB extends Dexie {
	reviewLog!: EntityTable<ReviewLogEntry, 'id'>;
	settings!: EntityTable<SettingRow, 'key'>;
	meta!: EntityTable<MetaRow, 'key'>;
	funSeen!: EntityTable<FunSeenEntry, 'id'>;
	cards!: EntityTable<PointCard, 'key'>;
	mistakeCards!: EntityTable<MistakeCard, 'key'>;

	constructor(name = DB_NAME) {
		super(name);
		this.version(1).stores({
			reviewLog: '++id, itemId, pointId, cardKey, timestamp',
			settings: '&key',
			meta: '&key'
		});
		// v2 (P1.12): fun-system seen-history. New empty table; no data to migrate.
		this.version(2).stores({
			funSeen: '++id, funId, timestamp'
		});
		// v3 (P2.3): SRS cards. The upgrade replays the existing review log so answers given
		// before the scheduler existed still count (ADR 0007). Mistake cards need error tags,
		// which v1/v2 entries don't have, so they start empty.
		this.version(3)
			.stores({
				cards: '&key, pointId, fsrs.dueAt',
				mistakeCards: '&key, pointId, errorTag, fsrs.dueAt'
			})
			.upgrade(async (tx) => {
				const answers = (await tx.table('reviewLog').toArray()) as ReviewLogEntry[];
				if (!answers.length) return;
				const setting = (await tx.table('settings').get('targetRetention')) as
					SettingRow | undefined;
				const retention =
					typeof setting?.value === 'number' ? clampRetention(setting.value) : DEFAULT_RETENTION;
				const { cards, mistakeCards } = replayAnswers(createScheduler(retention), answers);
				await tx.table('cards').bulkPut(cards);
				await tx.table('mistakeCards').bulkPut(mistakeCards);
			});
		this.on('populate', (tx) => {
			void tx.table('meta').add({ key: 'createdAt', value: Date.now() });
		});
	}
}
