import { prisma } from '$lib/server/db';
import { TimelineEngine } from '@black-whale/timeline-engine';
import { filterVisible } from '@black-whale/spoiler-engine';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const timelineEngine = new TimelineEngine(prisma);
	const selectedPerspectiveId = url.searchParams.get('perspective') || 'reader';
	const followMode = url.searchParams.get('follow') || 'consciousness';
	
	// Read sequence from URL param, defaulting to the latest event
	let sequence = url.searchParams.get('sequence') ? parseInt(url.searchParams.get('sequence') as string) : undefined;
	
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const spoilerProfile = spoilerLimitCookie ? { maxChapter: parseInt(spoilerLimitCookie) } : undefined;

	// Fetch all events for the timeline slider (filtered by spoilers)
	let events = await prisma.narrativeEvent.findMany({
		orderBy: { sequence: 'asc' }
	});
	
	if (spoilerProfile) {
		events = filterVisible(events as any, spoilerProfile) as any;
	}

	// If no sequence provided, use the last visible event's sequence
	if (sequence === undefined && events.length > 0) {
		sequence = events[events.length - 1].sequence;
	} else if (sequence === undefined) {
		sequence = 0;
	}

	// Load the world state at the requested sequence
	const rawWorldState = await timelineEngine.getWorldState({ sequence });

	// Filter world state characters by spoiler
	const visibleCharacters = spoilerProfile 
		? filterVisible(rawWorldState.characters as any, spoilerProfile) as any
		: rawWorldState.characters;
		
	// Filter presences by spoiler profile and also ensure they belong to visible characters
	const visibleCharacterIds = new Set(visibleCharacters.map((c: any) => c.id));
	const visiblePresences = (rawWorldState.presences as any[]).filter(p => 
		visibleCharacterIds.has(p.entityId)
	);

	// Load locations to match presences to actual SVGs
	const locations = await prisma.location.findMany();
	const visibleLocations = spoilerProfile 
		? filterVisible(locations as any, spoilerProfile) as any
		: locations;

	const selectedEvent = events.find((event) => event.sequence === sequence);
	let perspective: any = null;

	if (selectedEvent?.id && selectedPerspectiveId !== 'reader') {
		try {
			const spoilerQuery = spoilerProfile?.maxChapter ? `&spoilerLimit=${spoilerProfile.maxChapter}` : '';
			const perspectiveResponse = await fetch(`http://localhost:3001/v1/perspectives/${selectedPerspectiveId}?eventId=${selectedEvent.id}${spoilerQuery}`);
			if (perspectiveResponse.ok) {
				perspective = await perspectiveResponse.json();
			}
		} catch (error) {
			console.error('Failed to fetch perspective for ship page', error);
		}
	}

	return {
		sequence,
		events,
		selectedPerspectiveId,
		followMode,
		selectedEventId: selectedEvent?.id || null,
		perspective,
		worldState: {
			characters: visibleCharacters,
			bodies: rawWorldState.bodies,
			consciousnesses: rawWorldState.consciousnesses,
			presences: visiblePresences,
			bodyStates: rawWorldState.bodyStates,
			locations: visibleLocations
		},
		spoilerLimit: spoilerProfile?.maxChapter
	};
};
