import { readDataFile } from '$lib/server/data-files';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Read directly from the newly created JSON file for rapid prototyping
	const characters = await readDataFile('characters/characters.json');

	return { characters };
};
