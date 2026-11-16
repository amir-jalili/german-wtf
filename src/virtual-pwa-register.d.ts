/**
 * Types for the virtual module provided by @vite-pwa/sveltekit. Declared here (in a
 * script-style .d.ts without imports) so the project does not need @unplugin-pwa/core
 * as a direct dependency just for its types.
 */
declare module 'virtual:pwa-register' {
	export interface RegisterSWOptions {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegisteredSW?: (
			swScriptUrl: string,
			registration: ServiceWorkerRegistration | undefined
		) => void;
		onRegisterError?: (error: unknown) => void;
	}
	/** Registers the service worker; returns a function that activates a waiting update and reloads. */
	export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
