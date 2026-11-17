import { loadCatalogue } from '#lib/content/load.js';
import type { PageLoad } from './$types';

// Rendered on the client from the compiled catalogue (works offline via the service worker).
export const ssr = false;

export const load: PageLoad = async () => ({ catalogue: await loadCatalogue() });
