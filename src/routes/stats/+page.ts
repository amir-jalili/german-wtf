import { loadCatalogue } from '#lib/content/load.js';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async () => ({ catalogue: await loadCatalogue() });
