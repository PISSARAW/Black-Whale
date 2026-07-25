import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { PageServerLoad } from './$types';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const load: PageServerLoad = async () => {
	// Read directly from the newly created JSON file for rapid prototyping
	// Go up to project root: src/routes/characters -> ../../../../../data/characters/characters.json
	const projectRoot = join(__dirname, '../../../../../');
	const charactersPath = join(projectRoot, 'data/characters/characters.json');
	const charactersData = await fs.readFile(charactersPath, 'utf-8');
	const characters = JSON.parse(charactersData);

	return { characters };
};
