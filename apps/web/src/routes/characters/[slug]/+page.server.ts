import { prisma } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { filterVisible } from '@black-whale/spoiler-engine';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Map for narrative importance
const getNarrativeImportance = (canonStatus: string) => {
	if (canonStatus === 'canon') return 'PRIMARY';
	if (canonStatus === 'semi-canon') return 'SECONDARY';
	return 'MINOR';
};

export const load: PageServerLoad = async ({ params, cookies }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const spoilerProfile = spoilerLimitCookie ? { maxChapter: parseInt(spoilerLimitCookie) } : undefined;

	// Read directly from the JSON file for rapid prototyping
	const projectRoot = join(__dirname, '../../../../../../');
	const charactersPath = join(projectRoot, 'data/characters/characters.json');
	const abilitiesPath = join(projectRoot, 'data/abilities/abilities.json');
	const [charactersData, abilitiesData] = await Promise.all([
		fs.readFile(charactersPath, 'utf-8'),
		fs.readFile(abilitiesPath, 'utf-8')
	]);
	const characters = JSON.parse(charactersData);
	const abilities = JSON.parse(abilitiesData);
	
	const jsonCharacter = characters.find((c: any) => c.id === params.slug);

	if (!jsonCharacter) {
		throw error(404, 'Character not found');
	}

	const characterAbilities = abilities.filter((ability: any) => ability.ownerId === jsonCharacter.id);
	const chapterMatch = jsonCharacter.firstAppearanceChapterId?.match(/ch-(\d+)/);
	const firstVisibleChapterNumber = chapterMatch ? parseInt(chapterMatch[1]) : 340;

	// Try to find character in database with slug = params.slug
	let character = await prisma.character.findUnique({
		where: { slug: params.slug },
		include: {
			firstVisibleEvent: { include: { chapter: true } },
			originalBody: {
				include: {
					presences: {
						include: { fromEvent: { include: { chapter: true } }, untilEvent: { include: { chapter: true } }, location: true },
						orderBy: { fromEvent: { sequence: 'asc' } }
					},
					states: {
						include: { fromEvent: { include: { chapter: true } }, untilEvent: { include: { chapter: true } } },
						orderBy: { fromEvent: { sequence: 'asc' } }
					}
				}
			}
		}
	});

	// Some legacy seed records use a different slug and own the canonical body.
	// Fall back to that record when the exact catalog entry has no movement history.
	if (!character?.originalBody) {
		const charactersByName = await prisma.character.findMany({
			where: { canonicalName: jsonCharacter.canonicalName },
			include: {
				firstVisibleEvent: { include: { chapter: true } },
				originalBody: {
					include: {
						presences: {
							include: { fromEvent: { include: { chapter: true } }, untilEvent: { include: { chapter: true } }, location: true },
							orderBy: { fromEvent: { sequence: 'asc' } }
						},
						states: {
							include: { fromEvent: { include: { chapter: true } }, untilEvent: { include: { chapter: true } } },
							orderBy: { fromEvent: { sequence: 'asc' } }
						}
					}
				}
			}
		});
		character = charactersByName.find((candidate) => candidate.originalBody) || charactersByName[0] || null;
	}

	// If still not found in database, create a mock character from JSON
	if (!character) {
		// Spoiler checking based on JSON data
		if (spoilerProfile && firstVisibleChapterNumber > spoilerProfile.maxChapter) {
			throw error(404, 'Character not found');
		}

		// Return the JSON character data (will need to be adapted by the page)
		return { 
			character: {
				id: jsonCharacter.id,
				slug: jsonCharacter.id,
				canonicalName: jsonCharacter.canonicalName,
				aliases: jsonCharacter.aliases || [],
				description: jsonCharacter.description || null,
				suspectedAllegiance: jsonCharacter.suspectedAllegiance || null,
				biography: jsonCharacter.biography || [],
				abilitiesAndPowers: jsonCharacter.abilitiesAndPowers || null,
				equipment: jsonCharacter.equipment || [],
				guardianSpiritBeast: jsonCharacter.guardianSpiritBeast || null,
				identity: jsonCharacter.identity || null,
				narrativeImportance: getNarrativeImportance(jsonCharacter.canonStatus || 'canon'),
				modelingLevel: 3,
				nen: jsonCharacter.nen || null,
				mangaAppearances: jsonCharacter.mangaAppearances || [],
				battles: jsonCharacter.battles || [],
				competitions: jsonCharacter.competitions || [],
				abilities: characterAbilities,
				firstVisibleEvent: {
					chapter: { number: firstVisibleChapterNumber }
				}
			},
			presences: [],
			states: []
		};
	}

	// Spoiler checking
	if (spoilerProfile && firstVisibleChapterNumber > spoilerProfile.maxChapter) {
		throw error(404, 'Character not found'); // Hide future characters entirely
	}

	// Filter and mask future presences and states
	let visiblePresences = character.originalBody ? character.originalBody.presences : [];
	let visibleStates = character.originalBody ? character.originalBody.states : [];

	if (spoilerProfile) {
		// visiblePresences = filterTemporalRecords(visiblePresences as any, spoilerProfile) as any;
		// visiblePresences = maskFutureEnds(visiblePresences as any, spoilerProfile) as any;
		
		// visibleStates = filterTemporalRecords(visibleStates as any, spoilerProfile) as any;
		// visibleStates = maskFutureEnds(visibleStates as any, spoilerProfile) as any;
	}

	return { 
		character: {
			...character,
			description: jsonCharacter.description || character.description,
			suspectedAllegiance: jsonCharacter.suspectedAllegiance || null,
			biography: jsonCharacter.biography || [],
			abilitiesAndPowers: jsonCharacter.abilitiesAndPowers || null,
			equipment: jsonCharacter.equipment || [],
			guardianSpiritBeast: jsonCharacter.guardianSpiritBeast || null,
			identity: jsonCharacter.identity || null,
			nen: jsonCharacter.nen || null,
			mangaAppearances: jsonCharacter.mangaAppearances || [],
			battles: jsonCharacter.battles || [],
			competitions: jsonCharacter.competitions || [],
			abilities: characterAbilities,
			firstVisibleEvent: {
				...character.firstVisibleEvent,
				chapter: {
					...character.firstVisibleEvent.chapter,
					number: firstVisibleChapterNumber
				}
			}
		},
		presences: visiblePresences, 
		states: visibleStates 
	};
};
