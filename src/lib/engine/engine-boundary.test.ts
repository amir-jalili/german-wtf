/**
 * Proves that the ESLint boundary for src/lib/engine/** (eslint.config.js) fires:
 * engine code may not import Svelte, app modules, Dexie, UI/DB/stores, or use browser globals.
 */
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: process.cwd() });
const enginePath = 'src/lib/engine/checker/fake-module.ts';
const uiPath = 'src/lib/ui/fake-component.ts';

async function ruleIdsFor(code: string, filePath: string): Promise<string[]> {
	const [result] = await eslint.lintText(code, { filePath });
	return (result?.messages ?? []).map((m) => m.ruleId ?? 'unknown');
}

describe('engine boundary lint rule', () => {
	it.each([
		"import { onMount } from 'svelte';",
		"import { browser } from '$app/environment';",
		"import Dexie from 'dexie';",
		"import { db } from '../../db/index';",
		"import { x } from '#lib/stores/settings';"
	])('rejects %s in engine code', async (code) => {
		const rules = await ruleIdsFor(`${code}\nexport const x = 1;\n`, enginePath);
		expect(rules).toContain('no-restricted-imports');
	});

	it.each([
		'window.alert("x")',
		'document.title',
		'fetch("/x")',
		'indexedDB.open("x")',
		'localStorage.getItem("x")'
	])('rejects browser global %s in engine code', async (expr) => {
		const rules = await ruleIdsFor(`export const x = ${expr};\n`, enginePath);
		expect(rules).toContain('no-restricted-globals');
	});

	it('allows the same imports outside the engine', async () => {
		const rules = await ruleIdsFor(
			"import { onMount } from 'svelte';\nexport const x = onMount;\n",
			uiPath
		);
		expect(rules).not.toContain('no-restricted-imports');
	});

	it('allows pure imports inside the engine', async () => {
		const rules = await ruleIdsFor(
			"import { LEVELS } from '../content/levels';\nexport const x = LEVELS;\n",
			enginePath
		);
		expect(rules).toEqual([]);
	});
});
