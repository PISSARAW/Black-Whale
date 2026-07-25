import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { PageServerLoad } from './$types';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const load: PageServerLoad = async () => {
	// Read directly from the JSON files for rapid prototyping
	const projectRoot = join(__dirname, '../../../../../');
	const factionsPath = join(projectRoot, 'data/factions/factions.json');
	const charactersPath = join(projectRoot, 'data/characters/characters.json');
	
	const factionsData = await fs.readFile(factionsPath, 'utf-8');
	const charactersData = await fs.readFile(charactersPath, 'utf-8');
	
	const factions = JSON.parse(factionsData);
	const characters = JSON.parse(charactersData);

	return { factions, characters };
};
