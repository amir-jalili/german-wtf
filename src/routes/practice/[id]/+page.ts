import { error } from '@sveltejs/kit';
import { loadBookItemsByPoint } from '#lib/content/books.js';
import { loadPoint } from '#lib/content/load.js';
import type { PageLoad } from './$types';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const [point, bookItems] = await Promise.all([loadPoint(params.id), loadBookItemsByPoint()]);
	if (!point) error(404, `No exercises for "${params.id}" yet`);
	// Items from imported book packs join the point's own (P2.9b).
	return { point: { ...point, items: [...point.items, ...(bookItems.get(point.id) ?? [])] } };
};
