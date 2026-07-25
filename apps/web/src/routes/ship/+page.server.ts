import { prisma } from '$lib/server/db';
import { TimelineEngine } from '@black-whale/timeline-engine';
import characterCatalog from '../../../../../data/characters/characters.json';
import type { PageServerLoad } from './$types';

type FactionFilterId = 'princes' | 'guards' | 'hunters' | 'spider' | 'mafia';

type CatalogCharacter = {
	id: string;
	canonicalName: string;
	description?: string;
	factionId?: string | null;
	shipLocation?: { role?: string | null } | null;
};

const catalogByName = new Map(
	(characterCatalog as CatalogCharacter[]).map((character) => [character.canonicalName, character])
);

function addFactionType(tags: Set<FactionFilterId>, type: string) {
	if (type === 'KAKIN_ROYAL_ARMY' || type === 'BENJAMIN_PRIVATE_ARMY') tags.add('guards');
	if (type === 'HUNTER_ASSOCIATION') tags.add('hunters');
	if (type === 'PHANTOM_TROUPE') tags.add('spider');
	if (type === 'MAFIA_FAMILY') tags.add('mafia');
}

function resolveFactionTags(character: any, activeFactionTypes: string[]): FactionFilterId[] {
	const tags = new Set<FactionFilterId>();
	activeFactionTypes.forEach((type) => addFactionType(tags, type));

	// The imported canon catalogue remains a fallback while the temporal
	// AffiliationMembership table is progressively populated.
	const catalogCharacter = catalogByName.get(character.canonicalName);
	const factionId = catalogCharacter?.factionId || '';
	const searchableRole = [
		character.slug,
		character.description,
		catalogCharacter?.description,
		catalogCharacter?.shipLocation?.role
	]
		.filter(Boolean)
		.join(' ')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();

	// "Princes" désigne les héritiers eux-mêmes, pas tous les membres de leur camp.
	if (catalogCharacter?.id.startsWith('prince-')) tags.add('princes');
	if (factionId === 'phantom-troupe') tags.add('spider');
	if (factionId.startsWith('mafia-')) tags.add('mafia');
	if (factionId === 'zodiacs' || /\b(hunter|zodiaque)\b/.test(searchableRole)) tags.add('hunters');
	if (/\b(garde|guard|protecteur|soldat|soldier|securite)\b/.test(searchableRole)) tags.add('guards');

	return [...tags];
}

function compareEvents(a: { chapter: { number: number }; sequence: number }, b: { chapter: { number: number }; sequence: number }) {
	return a.chapter.number - b.chapter.number || a.sequence - b.sequence;
}

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

	const visibleCharacterIdsForAffiliations = visibleCharacters.map((character: any) => character.id);
	const memberships = selectedEvent && visibleCharacterIdsForAffiliations.length
		? await prisma.affiliationMembership.findMany({
			where: {
				characterId: { in: visibleCharacterIdsForAffiliations },
				status: 'ACTIVE'
			},
			include: {
				faction: true,
				fromEvent: { include: { chapter: true } },
				untilEvent: { include: { chapter: true } }
			}
		})
		: [];
	const activeFactionTypesByCharacter = new Map<string, string[]>();
	for (const membership of memberships) {
		if (!selectedEvent || compareEvents(membership.fromEvent, selectedEvent) > 0) continue;
		if (membership.untilEvent && compareEvents(selectedEvent, membership.untilEvent) >= 0) continue;
		const types = activeFactionTypesByCharacter.get(membership.characterId) || [];
		types.push(membership.faction.type);
		activeFactionTypesByCharacter.set(membership.characterId, types);
	}
	visibleCharacters = visibleCharacters.map((character: any) => ({
		...character,
		factionTags: resolveFactionTags(character, activeFactionTypesByCharacter.get(character.id) || [])
	}));
		
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
