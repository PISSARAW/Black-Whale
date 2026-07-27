import fs from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, parse } from 'path';

// Resolving the JSON data directory from `import.meta.url` breaks in production:
// the bundled server chunks live under build/server/chunks/... so the relative
// depth no longer matches the source tree. Walk up from the working directory
// instead — it is the repo root in production (`node apps/web/build` from /app)
// and apps/web in dev.
function findDataRoot(): string {
	let current = process.cwd();
	const { root } = parse(current);

	while (true) {
		if (existsSync(join(current, 'data/characters/characters.json'))) return join(current, 'data');
		if (current === root) break;
		current = dirname(current);
	}

	throw new Error(`Unable to locate the data/ directory starting from ${process.cwd()}`);
}

let cachedDataRoot: string | null = null;

export function dataRoot(): string {
	cachedDataRoot ??= findDataRoot();
	return cachedDataRoot;
}

export async function readDataFile<T = unknown>(relativePath: string): Promise<T> {
	const contents = await fs.readFile(join(dataRoot(), relativePath), 'utf-8');
	return JSON.parse(contents) as T;
}

/**
 * A passenger as catalogued in data/characters/characters.json. Only the fields
 * the site reads are declared; the file carries more (biography, battles, nen).
 */
export interface CatalogCharacter {
	id: string;
	canonicalName: string;
	aliases?: string[];
	description?: string;
	factionId?: string | null;
	firstAppearanceChapterId?: string | null;
	canonStatus?: string;
	shipLocation?: { tier?: number; room?: string; status?: string; role?: string | null } | null;
}

export interface CatalogFaction {
	id: string;
	name: string;
	description: string;
}
