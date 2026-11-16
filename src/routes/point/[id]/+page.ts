import { error } from '@sveltejs/kit';
import { loadPoint } from '#lib/content/load.js';
import type { PageLoad } from './$types';

// Dynamic route: not prerendered; served by the SPA fallback (ADR 0004) and rendered on the client.
export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const point = await loadPoint(params.id);
	if (!point) error(404, `No lesson for "${params.id}" yet`);
	return { point };
};
