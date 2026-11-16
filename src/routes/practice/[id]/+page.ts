import { error } from '@sveltejs/kit';
import { loadPoint } from '#lib/content/load.js';
import type { PageLoad } from './$types';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const point = await loadPoint(params.id);
	if (!point) error(404, `No exercises for "${params.id}" yet`);
	return { point };
};
