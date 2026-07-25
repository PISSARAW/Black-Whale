import { prisma } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { filterVisible, filterTemporalRecords, maskFutureEnds } from '@black-whale/spoiler-engine';
import fs from 'fs/promises';
import path from 'path';

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
	const charactersPath = '/Users/henripissa/Documents/GitHub.nosync/Black-Whale/data/characters/characters.json';
	const charactersData = await fs.readFile(charactersPath, 'utf-8');
	const characters = JSON.parse(charactersData);
	
	const jsonCharacter = characters.find((c: any) => c.id === params.slug);

	if (!jsonCharacter) {
		throw error(404, 'Character not found');
	}

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

	// If not found with exact slug, try to find by canonicalName
	if (!character) {
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
		character = charactersByName[0] || null;
	}

	// If still not found in database, create a mock character from JSON
	if (!character) {
		// Extract chapter number from firstAppearanceChapterId
		let firstVisibleChapterNumber = 340;
		if (jsonCharacter.firstAppearanceChapterId) {
			const match = jsonCharacter.firstAppearanceChapterId.match(/ch-(\d+)/);
			if (match) {
				firstVisibleChapterNumber = parseInt(match[1]);
			}
		}

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
				narrativeImportance: getNarrativeImportance(jsonCharacter.canonStatus || 'canon'),
				modelingLevel: 3,
				firstVisibleEvent: {
					chapter: { number: firstVisibleChapterNumber }
				}
			},
			presences: [],
			states: []
		};
	}

	// Spoiler checking
	if (spoilerProfile && character.firstVisibleEvent.chapter.number > spoilerProfile.maxChapter) {
		throw error(404, 'Character not found'); // Hide future characters entirely
	}

	// Filter and mask future presences and states
	let visiblePresences = character.originalBody ? character.originalBody.presences : [];
	let visibleStates = character.originalBody ? character.originalBody.states : [];

	if (spoilerProfile) {
		visiblePresences = filterTemporalRecords(visiblePresences as any, spoilerProfile) as any;
		visiblePresences = maskFutureEnds(visiblePresences as any, spoilerProfile) as any;
		
		visibleStates = filterTemporalRecords(visibleStates as any, spoilerProfile) as any;
		visibleStates = maskFutureEnds(visibleStates as any, spoilerProfile) as any;
	}

	return { 
		character, 
		presences: visiblePresences, 
		states: visibleStates 
	};
};
