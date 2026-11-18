/**
 * Leak guard (ADR 0003): nothing from AJ's books may reach the public site. Walks compiled
 * JSON and reports every object that looks like a book item, plus any pack-like file name.
 */
import { isBookItem } from '#lib/engine/content/books.js';

export interface Leak {
	where: string;
	message: string;
}

function looksLikeItem(value: Record<string, unknown>): value is {
	id: string;
	source: string;
	origin?: unknown;
} {
	return typeof value.id === 'string' && typeof value.source === 'string';
}

/** Every book item (or `origin` / book-pack marker) inside a parsed JSON value. */
export function findBookLeaks(value: unknown, where: string): Leak[] {
	const leaks: Leak[] = [];
	const visit = (node: unknown, at: string): void => {
		if (Array.isArray(node)) {
			node.forEach((child, i) => visit(child, `${at}[${i}]`));
			return;
		}
		if (!node || typeof node !== 'object') return;
		const object = node as Record<string, unknown>;
		if (object.format === 'german-wtf-book-pack')
			leaks.push({ where: at, message: 'a whole book pack' });
		if ('origin' in object) leaks.push({ where: at, message: 'object with origin' });
		else if (looksLikeItem(object) && isBookItem(object as Parameters<typeof isBookItem>[0]))
			leaks.push({ where: at, message: `book item ${object.id}` });
		for (const [key, child] of Object.entries(object)) visit(child, `${at}.${key}`);
	};
	visit(value, where);
	return leaks;
}

/** File names that must never be deployed. */
export function isPackFileName(name: string): boolean {
	return /book-pack/i.test(name) || /(^|\/)private-dist(\/|$)/.test(name);
}
