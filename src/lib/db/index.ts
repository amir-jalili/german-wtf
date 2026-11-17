/** The app's single database instance, opened lazily in the browser. */
import { GymDB } from './schema.js';

let instance: GymDB | undefined;

export function getDb(): GymDB {
	instance ??= new GymDB();
	return instance;
}

export { exportBackup, backupFileName, BackupV1Schema, type Backup } from './backup.js';
export { logAnswer, countAnswers, type AnswerToLog } from './review-log.js';
export { DB_VERSION, type ReviewLogEntry, type Verdict } from './schema.js';
