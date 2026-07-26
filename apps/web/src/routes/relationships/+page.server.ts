import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { PageServerLoad } from './$types';

const __dirname = dirname(fileURLToPath(import.meta.url));

type NetworkRelation = {
	id: string;
	from: string;
	to: string;
	type: 'alliance' | 'conflict' | 'patronage' | 'cooperation' | 'control';
	chapter: number;
	label: string;
	evidence: string;
};

const relations: NetworkRelation[] = [
	{
		id: 'benjamin-tserriednich-rivalry',
		from: 'prince-benjamin',
		to: 'prince-tserriednich',
		type: 'conflict',
		chapter: 348,
		label: 'Declared rivalry',
		evidence: 'Benjamin tells Tserriednich that only one prince will survive and promises to eliminate him personally.'
	},
	{
		id: 'kacho-fugetsu-escape',
		from: 'prince-kacho',
		to: 'prince-fugetsu',
		type: 'alliance',
		chapter: 383,
		label: 'Protective alliance',
		evidence: 'The twins attempt to escape the succession ritual together; Kacho’s post-mortem guardian then remains with Fugetsu.'
	},
	{
		id: 'justice-fugetsu-protection',
		from: 'justice-bureau',
		to: 'prince-fugetsu',
		type: 'control',
		chapter: 380,
		label: 'Protective custody',
		evidence: 'After Fugetsu appears alone on Tier 3, judicial personnel escort her and control her movement between royal camps.'
	},
	{
		id: 'mafia-spiders-proxy-war',
		from: 'mafia-char',
		to: 'phantom-troupe',
		type: 'cooperation',
		chapter: 384,
		label: 'Alliance of convenience',
		evidence: 'The Cha-R leadership lets the Spiders hunt Heil-Ly while preserving the lower-tier balance.'
	},
	{
		id: 'xiyu-spiders-hunt',
		from: 'mafia-xiyu',
		to: 'phantom-troupe',
		type: 'cooperation',
		chapter: 399,
		label: 'Joint infiltration',
		evidence: 'Hinrigh and Nobunaga enter the Heil-Ly hideout together and test its spatial traps.'
	},
	{
		id: 'spiders-heilly-war',
		from: 'phantom-troupe',
		to: 'mafia-heilly',
		type: 'conflict',
		chapter: 384,
		label: 'Open hunt',
		evidence: 'The Troupe targets Morena’s family while Heil-Ly tries to destabilize every established power on the ship.'
	},
	{
		id: 'char-heilly-war',
		from: 'mafia-char',
		to: 'mafia-heilly',
		type: 'conflict',
		chapter: 384,
		label: 'Mafia war',
		evidence: 'Cha-R works to contain Morena’s insurgency and protect the balance between the legitimate families.'
	},
	{
		id: 'xiyu-heilly-war',
		from: 'mafia-xiyu',
		to: 'mafia-heilly',
		type: 'conflict',
		chapter: 384,
		label: 'Mafia war',
		evidence: 'Xi-Yu coordinates the search for Heil-Ly’s base while keeping the Phantom Troupe under observation.'
	},
	{
		id: 'tubeppa-woble-pact',
		from: 'prince-tubeppa',
		to: 'prince-woble',
		type: 'alliance',
		chapter: 401,
		label: 'Binding alliance offered',
		evidence: 'Longhi offers Kurapika a contract linking Tubeppa’s survival strategy to Woble’s protection.'
	},
	{
		id: 'benjamin-luzurus-martial-law',
		from: 'prince-benjamin',
		to: 'prince-luzurus',
		type: 'control',
		chapter: 411,
		label: 'Military pressure',
		evidence: 'Benjamin’s soldiers begin martial-law operations against Luzurus’s guard detail.'
	}
];

export const load: PageServerLoad = async ({ cookies }) => {
	const projectRoot = join(__dirname, '../../../../../');
	const [factionsData, charactersData] = await Promise.all([
		fs.readFile(join(projectRoot, 'data/factions/factions.json'), 'utf-8'),
		fs.readFile(join(projectRoot, 'data/characters/characters.json'), 'utf-8')
	]);

	const spoilerCookie = cookies.get('userSpoilerLimit');
	const parsedLimit = spoilerCookie ? Number.parseInt(spoilerCookie, 10) : Number.NaN;
	const spoilerLimit = Number.isFinite(parsedLimit) ? parsedLimit : undefined;
	const characters = JSON.parse(charactersData).filter((character: { firstAppearanceChapterId?: string | null }) => {
		if (!spoilerLimit || !character.firstAppearanceChapterId) return true;
		const firstChapter = Number.parseInt(character.firstAppearanceChapterId, 10);
		return !Number.isFinite(firstChapter) || firstChapter <= spoilerLimit;
	});
	const factions = JSON.parse(factionsData) as Array<{ id: string; name: string; description: string }>;

	// Some recently catalogued affiliations do not yet exist in the legacy faction file.
	for (const factionId of new Set<string>(characters.map((character: { factionId?: string | null }) => character.factionId).filter(Boolean))) {
		if (!factions.some((faction) => faction.id === factionId)) {
			factions.push({
				id: factionId,
				name: factionId === 'justice-bureau' ? 'Justice Bureau' : factionId.replaceAll('-', ' '),
				description: factionId === 'justice-bureau'
					? 'Judicial and investigative authority maintaining legal order aboard the Black Whale.'
					: 'Affiliation recorded in the passenger intelligence catalogue.'
			});
		}
	}

	return {
		factions,
		characters,
		relations: spoilerLimit ? relations.filter((relation) => relation.chapter <= spoilerLimit) : relations,
		spoilerLimit
	};
};
