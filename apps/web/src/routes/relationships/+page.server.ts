import fs from 'fs/promises';
import path from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Read directly from the JSON files for rapid prototyping
	const factionsPath = path.resolve('../../data/factions/factions.json');
	const charactersPath = path.resolve('../../data/characters/characters.json');
	
	const factionsData = await fs.readFile(factionsPath, 'utf-8');
	const charactersData = await fs.readFile(charactersPath, 'utf-8');
	
	const factions = JSON.parse(factionsData);
	const characters = JSON.parse(charactersData);

	return { factions, characters };
};
