/** Loading and validating content/fun/ (THEME_AND_FUN.md §2). */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { FunMessagesSchema, MemesSchema, type FunContent } from '#lib/engine/fun/schema.js';
import { formatZodIssues } from './load-content.ts';
import type { Problem } from './validate.ts';

export const FUN_DIR = path.join('content', 'fun');
export const MEMES_DIR = path.join('static', 'fun', 'memes');

export function readFun(): { content: FunContent; problems: Problem[] } {
	const problems: Problem[] = [];
	const messagesPath = path.join(FUN_DIR, 'messages.yaml');
	const memesPath = path.join(FUN_DIR, 'memes.yaml');
	const messages = FunMessagesSchema.safeParse(parse(readFileSync(messagesPath, 'utf8')) ?? []);
	const memes = MemesSchema.safeParse(parse(readFileSync(memesPath, 'utf8')) ?? []);
	if (!messages.success) problems.push(...formatZodIssues(messagesPath, messages.error));
	if (!memes.success) problems.push(...formatZodIssues(memesPath, memes.error));
	const content = { messages: messages.data ?? [], memes: memes.data ?? [] };
	problems.push(...validateFun(content, (file) => existsSync(path.join(MEMES_DIR, file))));
	return { content, problems };
}

export function validateFun(content: FunContent, fileExists: (file: string) => boolean): Problem[] {
	const problems: Problem[] = [];
	const ids = new Set<string>();
	for (const entry of [...content.messages, ...content.memes]) {
		if (ids.has(entry.id))
			problems.push({ where: `fun › ${entry.id}`, message: 'duplicate fun id' });
		ids.add(entry.id);
	}
	const memeIds = new Set(content.memes.map((m) => m.id));
	for (const m of content.messages) {
		if (m.meme && !memeIds.has(m.meme))
			problems.push({ where: `fun › ${m.id}`, message: `unknown meme "${m.meme}"` });
	}
	for (const meme of content.memes) {
		if (!fileExists(meme.file))
			problems.push({
				where: `fun › ${meme.id}`,
				message: `image static/fun/memes/${meme.file} not found`
			});
	}
	return problems;
}
