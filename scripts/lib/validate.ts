/**
 * Content quality gate 1 (CONTENT_GUIDE §6): schema + consistency checks for the catalogue
 * and every grammar-point file. Pure functions over parsed data so they can be unit-tested;
 * scripts/content-validate.ts does the file I/O and reporting.
 */
import { levelIndex, type Level } from '#lib/engine/content/levels.js';
import { clozeGapAnswers, fillCloze } from '#lib/engine/content/cloze.js';
import type { Catalogue, CatalogueEntry, GrammarPoint, Item } from '#lib/engine/content/schema.js';
import type { CurriculumPoint } from './curriculum-md.ts';

export interface Problem {
	/** Where: file path or id. */
	where: string;
	message: string;
}

/** Max words of the full correct sentence per level (CONTENT_GUIDE §2). */
export const MAX_WORDS: Partial<Record<Level, number>> = { A1: 8, A2: 12, B1: 16, B2: 20 };

export function validateCatalogue(catalogue: Catalogue, curriculum: CurriculumPoint[]): Problem[] {
	const problems: Problem[] = [];
	const byId = new Map<string, CatalogueEntry>();
	for (const point of catalogue.points) {
		if (byId.has(point.id)) problems.push({ where: point.id, message: 'duplicate id' });
		byId.set(point.id, point);
	}
	for (const point of catalogue.points) {
		for (const prereq of point.prerequisites) {
			const target = byId.get(prereq);
			if (!target) {
				problems.push({ where: point.id, message: `unknown prerequisite "${prereq}"` });
			} else if (levelIndex(target.level) > levelIndex(point.level)) {
				problems.push({
					where: point.id,
					message: `prerequisite "${prereq}" (${target.level}) is above ${point.level}`
				});
			}
		}
		for (const other of point.compareWith) {
			if (!byId.has(other))
				problems.push({ where: point.id, message: `unknown compareWith "${other}"` });
			if (other === point.id) problems.push({ where: point.id, message: 'compareWith itself' });
		}
	}
	for (const cycle of findCycles(catalogue.points)) {
		problems.push({ where: cycle[0] ?? '?', message: `prerequisite cycle: ${cycle.join(' → ')}` });
	}
	problems.push(...checkCurriculumSync(catalogue.points, curriculum));
	return problems;
}

/** Returns one representative cycle per strongly connected cycle found by DFS. */
export function findCycles(points: readonly CatalogueEntry[]): string[][] {
	const edges = new Map(points.map((p) => [p.id, p.prerequisites]));
	const state = new Map<string, 'visiting' | 'done'>();
	const stack: string[] = [];
	const cycles: string[][] = [];
	const visit = (id: string): void => {
		const s = state.get(id);
		if (s === 'done') return;
		if (s === 'visiting') {
			cycles.push([...stack.slice(stack.indexOf(id)), id]);
			return;
		}
		state.set(id, 'visiting');
		stack.push(id);
		for (const next of edges.get(id) ?? []) if (edges.has(next)) visit(next);
		stack.pop();
		state.set(id, 'done');
	};
	for (const p of points) visit(p.id);
	return cycles;
}

function checkCurriculumSync(
	points: readonly CatalogueEntry[],
	curriculum: CurriculumPoint[]
): Problem[] {
	const problems: Problem[] = [];
	const inCatalogue = new Map(points.map((p) => [p.id, p]));
	const inCurriculum = new Map(curriculum.map((p) => [p.id, p]));
	for (const id of inCurriculum.keys()) {
		if (!inCatalogue.has(id))
			problems.push({
				where: 'catalogue.yaml',
				message: `missing point "${id}" from CURRICULUM.md`
			});
	}
	for (const point of points) {
		const doc = inCurriculum.get(point.id);
		if (!doc) {
			problems.push({ where: point.id, message: 'not in CURRICULUM.md' });
			continue;
		}
		if (doc.level !== point.level)
			problems.push({ where: point.id, message: `level ${point.level} ≠ CURRICULUM ${doc.level}` });
		if (doc.titleDe !== point.title.de)
			problems.push({
				where: point.id,
				message: `German title differs from CURRICULUM: "${doc.titleDe}"`
			});
		const a = [...point.prerequisites].sort().join(',');
		const b = [...doc.prerequisites].sort().join(',');
		if (a !== b)
			problems.push({ where: point.id, message: `prerequisites [${a}] ≠ CURRICULUM [${b}]` });
	}
	return problems;
}

export interface PointFile {
	/** Path relative to repo root, e.g. content/points/adjectives/adj-endings-definite.yaml */
	path: string;
	point: GrammarPoint;
}

/** Whether an item is served in production builds. */
export function isServable(item: Item): boolean {
	return item.review.status === 'verified' && !item.retired;
}

/** The full correct sentence(s) of an item, used for duplicate and length checks. */
export function correctSentences(item: Item): string[] {
	switch (item.type) {
		case 'cloze':
			return [
				fillCloze(
					item.text,
					item.accepted.map((a) => a[0] ?? '')
				)
			];
		case 'choice':
			return [item.text.replace(/_{2,}/, item.answer)];
		case 'order':
			return item.accepted.map((a) => `${item.prefix ?? ''}${a}${item.suffix ?? ''}`);
	}
}

export function wordCount(sentence: string): number {
	return sentence.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function normaliseSentence(sentence: string): string {
	return sentence
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

export function validatePoints(
	files: PointFile[],
	catalogue: Catalogue,
	options: { allowBooks?: boolean } = {}
): Problem[] {
	const problems: Problem[] = [];
	const catalogueById = new Map(catalogue.points.map((p) => [p.id, p]));
	const seenItemIds = new Map<string, string>();
	const seenSentences = new Map<string, string>();
	const seenPoints = new Set<string>();

	for (const { path, point } of files) {
		const where = path;
		const entry = catalogueById.get(point.id);
		if (seenPoints.has(point.id))
			problems.push({ where, message: `point "${point.id}" defined twice` });
		seenPoints.add(point.id);
		if (!entry) {
			problems.push({ where, message: `point "${point.id}" is not in the catalogue` });
		} else {
			const expectedPath = `content/points/${entry.family}/${point.id}.yaml`;
			if (!path.endsWith(expectedPath) && !options.allowBooks)
				problems.push({ where, message: `expected file path ${expectedPath}` });
			if (point.level !== entry.level)
				problems.push({ where, message: `level ${point.level} ≠ catalogue ${entry.level}` });
			if (point.family !== entry.family)
				problems.push({ where, message: `family ${point.family} ≠ catalogue ${entry.family}` });
			if (point.title.de !== entry.title.de)
				problems.push({ where, message: 'title.de differs from catalogue' });
			if (point.title.en !== entry.title.en)
				problems.push({ where, message: 'title.en differs from catalogue' });
			if (sortedKey(point.prerequisites) !== sortedKey(entry.prerequisites))
				problems.push({ where, message: 'prerequisites differ from catalogue' });
			if (sortedKey(point.compareWith) !== sortedKey(entry.compareWith))
				problems.push({ where, message: 'compareWith differ from catalogue' });
		}
		for (const example of point.lesson.examples) {
			for (const span of example.xray) {
				if (!example.de.includes(span.text))
					problems.push({
						where,
						message: `x-ray span "${span.text}" not found in example "${example.de}"`
					});
			}
		}
		for (const item of point.items) {
			const itemWhere = `${path} › ${item.id}`;
			if (!item.id.startsWith(`${point.id}/`))
				problems.push({ where: itemWhere, message: `item id must start with "${point.id}/"` });
			const dup = seenItemIds.get(item.id);
			if (dup) problems.push({ where: itemWhere, message: `duplicate item id (also in ${dup})` });
			seenItemIds.set(item.id, path);
			if (!options.allowBooks && (item.origin || item.source.startsWith('book-'))) {
				problems.push({
					where: itemWhere,
					message: 'book-based item in public content (ADR 0003: put it in content/books/)'
				});
			}
			problems.push(...validateItem(item, itemWhere));
			if (item.retired) continue;
			for (const sentence of correctSentences(item)) {
				const key = normaliseSentence(sentence);
				const first = seenSentences.get(key);
				if (first && first !== item.id)
					problems.push({
						where: itemWhere,
						message: `duplicate sentence (same as ${first}): "${sentence}"`
					});
				seenSentences.set(key, item.id);
				const max = MAX_WORDS[item.level];
				if (max && wordCount(sentence) > max)
					problems.push({
						where: itemWhere,
						message: `${wordCount(sentence)} words > ${max} allowed at ${item.level}: "${sentence}"`
					});
			}
		}
	}
	return problems;
}

export function validateItem(item: Item, where: string): Problem[] {
	const problems: Problem[] = [];
	switch (item.type) {
		case 'cloze': {
			const canonical = clozeGapAnswers(item.text);
			if (canonical.length !== item.accepted.length) {
				problems.push({
					where,
					message: `${canonical.length} gap(s) in text but ${item.accepted.length} accepted list(s)`
				});
				break;
			}
			canonical.forEach((answer, gap) => {
				const list = item.accepted[gap] ?? [];
				if (list[0] !== answer)
					problems.push({
						where,
						message: `gap ${gap + 1}: text has {{${answer}}} but first accepted answer is "${list[0]}"`
					});
				if (new Set(list).size !== list.length)
					problems.push({ where, message: `gap ${gap + 1}: duplicate accepted answers` });
			});
			for (const key of Object.keys(item.distractorNotes ?? {})) {
				if (item.accepted.some((list) => list.includes(key)))
					problems.push({ where, message: `distractorNotes key "${key}" is an accepted answer` });
			}
			break;
		}
		case 'choice': {
			if (!item.options.includes(item.answer))
				problems.push({ where, message: `answer "${item.answer}" is not among the options` });
			if (new Set(item.options).size !== item.options.length)
				problems.push({ where, message: 'duplicate options' });
			if (!/_{2,}/.test(item.text) && !item.text.trim().endsWith('?'))
				problems.push({ where, message: 'choice text needs a ___ gap or must be a question' });
			for (const key of Object.keys(item.distractorNotes ?? {})) {
				if (key === item.answer)
					problems.push({ where, message: 'distractorNotes key is the correct answer' });
				if (!item.options.includes(key))
					problems.push({ where, message: `distractorNotes key "${key}" is not an option` });
			}
			break;
		}
		case 'order': {
			const tileTokens = tokenKey(item.tiles.join(' '));
			if (new Set(item.accepted).size !== item.accepted.length)
				problems.push({ where, message: 'duplicate accepted orders' });
			for (const answer of item.accepted) {
				if (tokenKey(answer) !== tileTokens)
					problems.push({
						where,
						message: `accepted order "${answer}" does not use exactly the tiles`
					});
			}
			if (item.fields) {
				const joined = Object.values(item.fields).filter(Boolean).join(' ');
				if (tokenKey(joined) !== tileTokens)
					problems.push({ where, message: 'fields do not cover exactly the tiles' });
			}
			break;
		}
	}
	return problems;
}

function sortedKey(list: readonly string[]): string {
	return [...list].sort().join(',');
}

/** Order tiles are compared case-insensitively: the UI capitalises the first tile itself. */
function tokenKey(text: string): string {
	return text.toLocaleLowerCase('de-DE').split(/\s+/).filter(Boolean).sort().join('\u0000');
}
