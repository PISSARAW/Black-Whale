import { prisma } from '$lib/server/db';
import { TimelineEngine } from '@black-whale/timeline-engine';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const timelineEngine = new TimelineEngine(prisma);
	const selectedPerspectiveId = url.searchParams.get('perspective') || 'reader';
	const followMode = url.searchParams.get('follow') || 'consciousness';
	const requestedEventId = url.searchParams.get('eventId');
	const legacySequence = url.searchParams.get('sequence') ? parseInt(url.searchParams.get('sequence') as string) : undefined;
	
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const spoilerProfile = spoilerLimitCookie ? { maxChapter: parseInt(spoilerLimitCookie) } : undefined;

	// Sequence is local to a chapter. Always order and select through the unique
	// event id, using chapter number as the primary chronological key.
	const events = await prisma.narrativeEvent.findMany({
		where: spoilerProfile ? { chapter: { number: { lte: spoilerProfile.maxChapter } } } : undefined,
		orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
		include: { chapter: true }
	});

	const selectedEvent =
		events.find((event) => event.id === requestedEventId) ||
		(legacySequence !== undefined ? [...events].reverse().find((event) => event.sequence === legacySequence) : undefined) ||
		events[events.length - 1];
	const selectedEventIndex = selectedEvent ? events.findIndex((event) => event.id === selectedEvent.id) : 0;
	const sequence = selectedEvent?.sequence ?? 0;

	const rawWorldState = selectedEvent
		? await timelineEngine.getWorldState({ eventId: selectedEvent.id })
		: { characters: [], bodies: [], consciousnesses: [], presences: [], bodyStates: {} };

	// Filter world state characters by spoiler
	let visibleCharacters = rawWorldState.characters;
	if (spoilerProfile) {
		const allowedCharacters = await prisma.character.findMany({
			where: { firstVisibleEvent: { chapter: { number: { lte: spoilerProfile.maxChapter } } } },
			select: { id: true }
		});
		const allowedCharacterIds = new Set(allowedCharacters.map((character) => character.id));
		visibleCharacters = rawWorldState.characters.filter((character: any) => allowedCharacterIds.has(character.id));
	}
		
	// Presences reference bodies, not characters. Resolve the body owner before
	// applying the spoiler filter so valid character positions are not discarded.
	const visibleCharacterIds = new Set(visibleCharacters.map((character: any) => character.id));
	const visibleBodyIds = new Set(
		(rawWorldState.bodies as any[])
			.filter((body) => visibleCharacterIds.has(body.originalCharacterId))
			.map((body) => body.id)
	);
	const visiblePresences = (rawWorldState.presences as any[]).filter((presence) =>
		visibleBodyIds.has(presence.entityId)
	);

	// Load locations to match presences to actual SVGs
	const visibleLocations = await prisma.location.findMany({
		where: spoilerProfile ? { firstVisibleEvent: { chapter: { number: { lte: spoilerProfile.maxChapter } } } } : undefined
	});
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
		selectedEventIndex,
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
