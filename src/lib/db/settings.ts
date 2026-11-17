/** Typed access to the key/value `settings` table. Defaults live here. */
import type { ChaosLevel } from '#lib/engine/fun/pick.js';
import { CHAOS_LEVELS } from '#lib/engine/fun/pick.js';
import { clampRetention, DEFAULT_RETENTION } from '#lib/engine/scheduler/retention.js';
import { ANSWER_MODES, type AnswerPreference } from '#lib/engine/content/present.js';
import type { GymDB } from './schema.js';

export interface Settings {
	/** Fun frequency (THEME_AND_FUN.md §2). */
	catChaos: ChaosLevel;
	/** FSRS target retention, 0.70–0.97 (ADR 0007; UI in P2.8). */
	targetRetention: number;
	/** Daily session length in minutes (PRODUCT_SPEC: 10/15/25; UI in P2.8). */
	dailyMinutes: number;
	/** New grammar points per day, 0–3. */
	newPerDay: number;
	/** Show the day streak on Stats (some people find streaks stressful). */
	showStreak: boolean;
	theme: Theme;
	/** Speech rate for German audio, 0.5–1.5. */
	ttsRate: number;
	/** Preferred German voice name; '' = pick automatically. */
	ttsVoice: string;
	/** Typed answers (default, better for learning) or multiple choice where possible. */
	answerPreference: AnswerPreference;
}

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];
export const TTS_RATES = [0.75, 0.95, 1.1] as const;

export const DAILY_MINUTES = [5, 10, 15, 25] as const;
export const MAX_NEW_PER_DAY = 3;

export const DEFAULT_SETTINGS: Settings = {
	catChaos: 'some',
	targetRetention: DEFAULT_RETENTION,
	dailyMinutes: 15,
	newPerDay: 1,
	showStreak: true,
	theme: 'system',
	ttsRate: 0.95,
	ttsVoice: '',
	answerPreference: 'typed'
};

function intIn(value: unknown, min: number, max: number, fallback: number): number {
	return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
		? value
		: fallback;
}

export async function loadSettings(db: GymDB): Promise<Settings> {
	const rows = await db.settings.toArray();
	const map = new Map(rows.map((r) => [r.key, r.value]));
	const chaos = map.get('catChaos');
	return {
		catChaos: CHAOS_LEVELS.includes(chaos as ChaosLevel)
			? (chaos as ChaosLevel)
			: DEFAULT_SETTINGS.catChaos,
		targetRetention:
			typeof map.get('targetRetention') === 'number'
				? clampRetention(map.get('targetRetention') as number)
				: DEFAULT_SETTINGS.targetRetention,
		dailyMinutes: intIn(map.get('dailyMinutes'), 1, 120, DEFAULT_SETTINGS.dailyMinutes),
		newPerDay: intIn(map.get('newPerDay'), 0, MAX_NEW_PER_DAY, DEFAULT_SETTINGS.newPerDay),
		showStreak:
			typeof map.get('showStreak') === 'boolean'
				? (map.get('showStreak') as boolean)
				: DEFAULT_SETTINGS.showStreak,
		theme: THEMES.includes(map.get('theme') as Theme)
			? (map.get('theme') as Theme)
			: DEFAULT_SETTINGS.theme,
		ttsRate:
			typeof map.get('ttsRate') === 'number' &&
			(map.get('ttsRate') as number) >= 0.5 &&
			(map.get('ttsRate') as number) <= 1.5
				? (map.get('ttsRate') as number)
				: DEFAULT_SETTINGS.ttsRate,
		ttsVoice: typeof map.get('ttsVoice') === 'string' ? (map.get('ttsVoice') as string) : '',
		answerPreference: ANSWER_MODES.includes(map.get('answerPreference') as AnswerPreference)
			? (map.get('answerPreference') as AnswerPreference)
			: DEFAULT_SETTINGS.answerPreference
	};
}

export async function saveSetting<K extends keyof Settings>(
	db: GymDB,
	key: K,
	value: Settings[K]
): Promise<void> {
	await db.settings.put({ key, value });
}
