/** App settings as reactive state, persisted in IndexedDB (src/lib/db/settings.ts). */
import {
	DEFAULT_SETTINGS,
	getDb,
	loadSettings,
	saveSetting,
	type Settings
} from '#lib/db/index.js';

class SettingsStore {
	value = $state<Settings>({ ...DEFAULT_SETTINGS });
	loaded = $state(false);
	#loading: Promise<void> | undefined;

	/** Loads once; safe to call from several components. */
	load(): Promise<void> {
		this.#loading ??= loadSettings(getDb()).then(
			(s) => {
				this.value = s;
				this.loaded = true;
			},
			(error: unknown) => {
				console.warn('Could not load settings', error);
				this.loaded = true;
			}
		);
		return this.#loading;
	}

	/** Forget the loaded values so the next load() reads the database again (after an import). */
	reset(): void {
		this.#loading = undefined;
	}

	async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
		this.value = { ...this.value, [key]: value };
		await saveSetting(getDb(), key, value);
	}
}

export const settings = new SettingsStore();
