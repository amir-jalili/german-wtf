/**
 * IndexedDB schema (ARCHITECTURE §6). Every change is a NEW `this.version(n)` block with
 * an upgrade function and a migration test against tests/fixtures/backup-v<n-1>.json —
 * never edit an existing version (CLAUDE.md §9: never lose progress).
 */
import Dexie, { type EntityTable } from 'dexie';
import type { ItemAnswer } from '#lib/engine/checker/index.js';

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
}

export interface SettingRow {
	key: string;
	value: unknown;
}

export interface MetaRow {
	key: string;
	value: unknown;
}

/** Storage key — deliberately unchanged by the rename to German WTF (ADR 0006). Never change it. */
export const DB_NAME = 'grammatik-gym';
/** The newest Dexie schema version. */
export const DB_VERSION = 1;

export class GymDB extends Dexie {
	reviewLog!: EntityTable<ReviewLogEntry, 'id'>;
	settings!: EntityTable<SettingRow, 'key'>;
	meta!: EntityTable<MetaRow, 'key'>;

	constructor(name = DB_NAME) {
		super(name);
		this.version(1).stores({
			reviewLog: '++id, itemId, pointId, cardKey, timestamp',
			settings: '&key',
			meta: '&key'
		});
		this.on('populate', (tx) => {
			void tx.table('meta').add({ key: 'createdAt', value: Date.now() });
		});
	}
}
