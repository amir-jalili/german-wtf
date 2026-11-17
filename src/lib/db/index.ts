/** The app's single database instance, opened lazily in the browser. */
import { GymDB } from './schema.js';

let instance: GymDB | undefined;

export function getDb(): GymDB {
	instance ??= new GymDB();
	return instance;
}

export {
	exportBackup,
	backupFileName,
	parseBackup,
	BackupV1Schema,
	BackupV2Schema,
	type Backup
} from './backup.js';
export { recordFunSeen, recentFunIds } from './fun-seen.js';
export { loadSettings, saveSetting, DEFAULT_SETTINGS, type Settings } from './settings.js';
export { logAnswer, countAnswers, type AnswerToLog } from './review-log.js';
export { DB_VERSION, type ReviewLogEntry, type Verdict } from './schema.js';
