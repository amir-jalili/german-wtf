import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint recommends not using no-undef on TypeScript projects.
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'error'
		}
	},
	{
		// Engine purity (CLAUDE.md §4, ARCHITECTURE §3): src/lib/engine/** is plain TypeScript
		// with no framework, DOM, storage or network access, so it stays unit-testable and portable.
		// tests in src/lib/engine/engine-boundary.test.ts prove these rules fire.
		files: ['src/lib/engine/**/*.ts'],
		ignores: ['src/lib/engine/**/*.test.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{ group: ['svelte', 'svelte/*'], message: 'Engine code must not import Svelte.' },
						{
							group: ['$app/*', '$env/*', '$lib/*', '#lib/*'],
							message: 'Engine code must not import app modules.'
						},
						{ group: ['dexie', 'dexie/*'], message: 'Engine code must not touch IndexedDB.' },
						{
							group: ['**/ui/**', '**/db/**', '**/stores/**'],
							message: 'Engine code must not depend on UI, DB or stores.'
						}
					]
				}
			],
			'no-restricted-globals': [
				'error',
				...[
					'window',
					'document',
					'navigator',
					'fetch',
					'indexedDB',
					'localStorage',
					'sessionStorage',
					'XMLHttpRequest',
					'location'
				].map((name) => ({
					name,
					message: `Engine code must not use the browser global "${name}".`
				}))
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	}
);
