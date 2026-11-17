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
	BackupV3Schema,
	type Backup
} from './backup.js';
export { recordFunSeen, recentFunIds } from './fun-seen.js';
export {
	loadSettings,
	saveSetting,
	DEFAULT_SETTINGS,
	DAILY_MINUTES,
	MAX_NEW_PER_DAY,
	type Settings
} from './settings.js';
export {
	loadAnswers,
	loadSrsState,
	refreshCardsForPoint,
	startOfLocalDay,
	type SrsState
} from './srs.js';
export { logAnswer, countAnswers, type AnswerToLog } from './review-log.js';
export { DB_VERSION, type AnswerMode, type ReviewLogEntry, type Verdict } from './schema.js';
