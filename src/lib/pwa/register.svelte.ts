/**
 * Service-worker registration and update state (ADR 0005).
 *
 * The worker is registered once from the root layout. When a new version has been
 * downloaded, `pwa.needRefresh` becomes true and the UI shows "New version — reload";
 * nothing reloads until the user taps it (CLAUDE.md §9: never force-reload a session).
 */
import { registerSW } from 'virtual:pwa-register';

class PwaState {
	needRefresh = $state(false);
	offlineReady = $state(false);
	#update: ((reloadPage?: boolean) => Promise<void>) | undefined;

	/** Call once in the browser. Safe to call again (no-op). */
	register(): void {
		if (this.#update || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
		this.#update = registerSW({
			immediate: true,
			onNeedRefresh: () => (this.needRefresh = true),
			onOfflineReady: () => (this.offlineReady = true),
			onRegisterError: (error) => console.warn('Service worker registration failed', error)
		});
	}

	/** Activates the downloaded version and reloads the page. */
	async reloadToUpdate(): Promise<void> {
		await this.#update?.(true);
	}
}

export const pwa = new PwaState();
