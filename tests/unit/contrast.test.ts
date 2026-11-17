/**
 * WCAG 2.2 AA contrast for the theme tokens in src/app.css (CLAUDE.md §4): normal text
 * ≥ 4.5:1, large text / UI components ≥ 3:1. Checked for light and both dark blocks.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app.css', 'utf8');

function block(selectorStart: string): Record<string, string> {
	const start = css.indexOf(selectorStart);
	if (start < 0) throw new Error(`no block ${selectorStart}`);
	const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
	return Object.fromEntries(
		[...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!])
	);
}

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
	return (x! + 0.05) / (y! + 0.05);
}

const themes = {
	light: block(':root {'),
	'dark (system)': block(":root:not([data-theme='light'])"),
	'dark (forced)': block(":root[data-theme='dark']")
};

/** [foreground, background, minimum ratio] */
const pairs: [string, string, number][] = [
	['text', 'bg', 4.5],
	['text', 'surface', 4.5],
	['text', 'surface-2', 4.5],
	['muted', 'bg', 4.5],
	['muted', 'surface', 4.5],
	['accent-contrast', 'accent', 4.5],
	['accent', 'bg', 4.5],
	['accent', 'surface', 4.5],
	['success', 'surface', 4.5],
	['warn', 'surface', 4.5],
	['danger', 'surface', 4.5],
	['case-nom', 'surface', 4.5],
	['case-akk', 'surface', 4.5],
	['case-dat', 'surface', 4.5],
	['case-gen', 'surface', 4.5]
];

describe('theme contrast (WCAG AA)', () => {
	for (const [name, tokens] of Object.entries(themes)) {
		it.each(pairs)(`${name}: %s on %s ≥ %d`, (fg, bg, min) => {
			const f = tokens[fg] ?? themes.light[fg];
			const b = tokens[bg] ?? themes.light[bg];
			expect(f && b, `missing token ${fg}/${bg}`).toBeTruthy();
			expect(contrast(f!, b!)).toBeGreaterThanOrEqual(min);
		});
	}

	it.each(Object.keys(themes))('%s: the letter on case badges is ≥ 4.5', (name) => {
		const tokens = themes[name as keyof typeof themes];
		for (const c of ['case-nom', 'case-akk', 'case-dat', 'case-gen']) {
			expect(contrast(tokens['case-badge-text']!, tokens[c]!), c).toBeGreaterThanOrEqual(4.5);
		}
	});
});
