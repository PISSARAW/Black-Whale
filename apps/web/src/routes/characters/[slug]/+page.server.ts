import { prisma } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { filterVisible, filterTemporalRecords, maskFutureEnds } from '@black-whale/spoiler-engine';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const spoilerProfile = spoilerLimitCookie ? { maxChapter: parseInt(spoilerLimitCookie) } : undefined;

	const character = await prisma.character.findUnique({
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

	if (!character) {
		throw error(404, 'Character not found');
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
