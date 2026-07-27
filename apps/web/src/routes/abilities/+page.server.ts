import { nenRuntime } from '$lib/server/nen';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// The catalogue is bundled data, not a query: nothing can fail here, so the
	// hand-written three-ability fallback this route used to carry is gone. In
	// production the API host it called never existed, so that stale list was
	// the only thing the page had ever shown.
	return { abilities: nenRuntime.listAbilities() };
};
