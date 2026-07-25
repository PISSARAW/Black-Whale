import fs from 'fs/promises';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Read directly from the newly created JSON file for rapid prototyping
	const charactersPath = '/Users/henripissa/Documents/GitHub.nosync/Black-Whale/data/characters/characters.json';
	const charactersData = await fs.readFile(charactersPath, 'utf-8');
	const characters = JSON.parse(charactersData);

	return { characters };
};
