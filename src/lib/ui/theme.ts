/**
 * Applies the theme setting (P2.8c): `data-theme` on <html> overrides the system preference
 * (app.css). Mirrored in localStorage so the inline script in app.html can set it before
 * the first paint (no light flash in forced dark mode). Storage may be unavailable: ignore.
 */
import type { Theme } from '#lib/db/index.js';

export const THEME_STORAGE_KEY = 'german-wtf-theme';

export function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	if (theme === 'system') delete root.dataset.theme;
	else root.dataset.theme = theme;
	try {
		if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
		else localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// private mode or blocked storage: the theme still applies for this visit
	}
}
