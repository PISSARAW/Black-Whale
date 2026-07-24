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
			presences: {
				include: { fromEvent: true, untilEvent: true, location: true },
				orderBy: { fromEvent: { sequence: 'asc' } }
			},
			states: {
				include: { fromEvent: true, untilEvent: true },
				orderBy: { fromEvent: { sequence: 'asc' } }
			}
		}
	});

	if (!character) {
		throw error(404, 'Character not found');
	}

	// Spoiler checking
	if (spoilerProfile && character.firstVisibleChapter > spoilerProfile.maxChapter) {
		throw error(404, 'Character not found'); // Hide future characters entirely
	}

	// Filter and mask future presences and states
	let visiblePresences = character.presences;
	let visibleStates = character.states;

	if (spoilerProfile) {
		visiblePresences = filterTemporalRecords(visiblePresences, spoilerProfile) as any;
		visiblePresences = maskFutureEnds(visiblePresences, spoilerProfile) as any;
		
		visibleStates = filterTemporalRecords(visibleStates, spoilerProfile) as any;
		visibleStates = maskFutureEnds(visibleStates, spoilerProfile) as any;
	}

	return { 
		character, 
		presences: visiblePresences, 
		states: visibleStates 
	};
};
