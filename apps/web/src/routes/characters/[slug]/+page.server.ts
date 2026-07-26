import { prisma } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

type TimelineEntry = {
	chapter: number | null;
	sequence: number;
	kind: 'body-location' | 'body-state' | 'consciousness-state' | 'consciousness-location' | 'appearance';
	label: string;
	detail?: string | null;
	location?: string | null;
	certainty?: string | null;
	untilChapter?: number | null;
};

type ChapterVisit = {
	sequence: number;
	location: string;
	detail?: string | null;
	subject: 'body' | 'consciousness' | 'character';
	certainty?: string | null;
};

type ChapterTrajectory = {
	chapter: number;
	visits: ChapterVisit[];
	events: TimelineEntry[];
	isMovement: boolean;
};

const eventInclude = { include: { chapter: true } } as const;

const bodyInclude = {
	presences: {
		include: { fromEvent: eventInclude, untilEvent: eventInclude, location: true },
		orderBy: { fromEvent: { sequence: 'asc' as const } }
	},
	states: {
		include: { fromEvent: eventInclude, untilEvent: eventInclude },
		orderBy: { fromEvent: { sequence: 'asc' as const } }
	}
};

const characterInclude = {
	firstVisibleEvent: eventInclude,
	roles: {
		include: { fromEvent: eventInclude, untilEvent: eventInclude },
		orderBy: { fromEvent: { sequence: 'asc' as const } }
	},
	assignments: {
		include: { fromEvent: eventInclude, untilEvent: eventInclude },
		orderBy: { fromEvent: { sequence: 'asc' as const } }
	},
	affiliations: {
		include: { faction: true, fromEvent: eventInclude, untilEvent: eventInclude },
		orderBy: { fromEvent: { sequence: 'asc' as const } }
	},
	originalBody: { include: bodyInclude },
	originalConsciousness: {
		include: {
			states: {
				include: { fromEvent: eventInclude, untilEvent: eventInclude },
				orderBy: { fromEvent: { sequence: 'asc' as const } }
			},
			occupancies: {
				include: {
					fromEvent: eventInclude,
					untilEvent: eventInclude,
					body: { include: { character: true, ...bodyInclude } }
				},
				orderBy: { fromEvent: { sequence: 'asc' as const } }
			}
		}
	}
} as const;

const eventDetail = (event: any) => event?.summary || event?.title || null;

function buildLocationPaths(locations: any[]) {
	const byId = new Map(locations.map((location) => [location.id, location]));
	const paths = new Map<string, string>();
	const resolve = (location: any): string => {
		if (!location) return 'Position inconnue';
		if (paths.has(location.id)) return paths.get(location.id)!;
		const parent = location.parentLocationId ? byId.get(location.parentLocationId) : null;
		const path = parent && parent.id !== 'black-whale-1' ? `${resolve(parent)} › ${location.name}` : location.name;
		paths.set(location.id, path);
		return path;
	};
	for (const location of locations) resolve(location);
	return paths;
}

const presenceLocation = (presence: any, paths: Map<string, string>) =>
	presence?.location ? paths.get(presence.location.slug) || presence.location.name : null;

const activeAtChapter = (record: any, chapter: number) => {
	const from = record.fromEvent.chapter.number;
	const until = record.untilEvent?.chapter.number ?? Number.POSITIVE_INFINITY;
	return from <= chapter && chapter <= until;
};

function bodyTimeline(body: any, locationPaths: Map<string, string>, includeLocation = true): TimelineEntry[] {
	if (!body) return [];
	return [
		...(includeLocation ? body.presences.map((presence: any) => ({
			chapter: presence.fromEvent.chapter.number,
			sequence: presence.fromEvent.sequence,
			kind: 'body-location' as const,
			label: presenceLocation(presence, locationPaths) || 'Position inconnue',
			detail: eventDetail(presence.fromEvent),
			location: presenceLocation(presence, locationPaths),
			certainty: presence.certainty,
			untilChapter: presence.untilEvent?.chapter.number || null
		})) : []),
		...body.states.map((state: any) => ({
			chapter: state.fromEvent.chapter.number,
			sequence: state.fromEvent.sequence,
			kind: 'body-state' as const,
			label: state.state,
			detail: eventDetail(state.fromEvent),
			untilChapter: state.untilEvent?.chapter.number || null
		}))
	];
}

function buildTimeline(character: any, jsonCharacter: any, locationPaths: Map<string, string>): TimelineEntry[] {
	const timeline = bodyTimeline(character?.originalBody, locationPaths);
	const consciousness = character?.originalConsciousness;

	for (const state of consciousness?.states || []) {
		timeline.push({
			chapter: state.fromEvent.chapter.number,
			sequence: state.fromEvent.sequence,
			kind: 'consciousness-state',
			label: state.state,
			detail: eventDetail(state.fromEvent),
			untilChapter: state.untilEvent?.chapter.number || null
		});
	}

	for (const occupancy of consciousness?.occupancies || []) {
		const destination = occupancy.body?.character?.canonicalName
			? `Corps de ${occupancy.body.character.canonicalName}`
			: occupancy.body?.label || 'Corps inconnu';
		const presence = occupancy.body?.presences?.findLast?.((item: any) =>
			item.fromEvent.chapter.number < occupancy.fromEvent.chapter.number ||
			(item.fromEvent.chapter.number === occupancy.fromEvent.chapter.number && item.fromEvent.sequence <= occupancy.fromEvent.sequence)
		);
		timeline.push({
			chapter: occupancy.fromEvent.chapter.number,
			sequence: occupancy.fromEvent.sequence,
			kind: 'consciousness-location',
			label: destination,
			detail: eventDetail(occupancy.fromEvent),
			location: presenceLocation(presence, locationPaths),
			certainty: occupancy.certainty,
			untilChapter: occupancy.untilEvent?.chapter.number || null
		});
	}

	// The catalogue covers exceptional states not yet represented by the temporal database.
	const exceptionalStatuses = new Set(['debut', 'appears', 'pictured', 'death', 'corpse', 'soul', 'clone', 'impersonated', 'disguised', 'absent']);
	for (const appearance of jsonCharacter.mangaAppearances || []) {
		if (!exceptionalStatuses.has(appearance.status)) continue;
		const duplicate = timeline.some((entry) => entry.chapter === appearance.chapter &&
			((appearance.status === 'death' && entry.kind === 'body-state') ||
			 (appearance.status === 'soul' && entry.kind === 'consciousness-state')));
		if (!duplicate) timeline.push({
			chapter: appearance.chapter,
			sequence: 999,
			kind: 'appearance',
			label: appearance.status,
			detail: appearance.title
		});
	}

	return timeline.sort((a, b) => (a.chapter ?? Number.MAX_SAFE_INTEGER) - (b.chapter ?? Number.MAX_SAFE_INTEGER) || a.sequence - b.sequence);
}

function buildChapterTrajectory(
	timeline: TimelineEntry[],
	character: any,
	jsonCharacter: any,
	chapters: any[],
	locationPaths: Map<string, string>
): ChapterTrajectory[] {
	const chapterNumbers = new Set(timeline.flatMap((entry) => entry.chapter === null ? [] : [entry.chapter]));
	const identifiers = new Set([jsonCharacter.id, character?.slug].filter(Boolean));
	const catalogueEvents = new Map<number, any[]>();

	for (const chapter of chapters) {
		const matchingEvents = (chapter.timeline || []).filter((event: any) =>
			(event.charactersInvolved || []).some((id: string) => identifiers.has(id))
		);
		if (matchingEvents.length) {
			catalogueEvents.set(chapter.number, matchingEvents);
			chapterNumbers.add(chapter.number);
		}
	}

	const addVisit = (visits: ChapterVisit[], visit: ChapterVisit) => {
		const normalized = visit.location.trim().toLocaleLowerCase();
		const duplicate = visits.find((candidate) =>
			candidate.location.trim().toLocaleLowerCase() === normalized && candidate.subject === visit.subject
		);
		if (!duplicate) visits.push(visit);
	};

	return [...chapterNumbers].sort((a, b) => a - b).map((chapter): ChapterTrajectory => {
		const events = timeline.filter((entry) => entry.chapter === chapter);
		const visits: ChapterVisit[] = [];

		for (const [index, event] of (catalogueEvents.get(chapter) || []).entries()) {
			if (!event.location) continue;
			addVisit(visits, {
				sequence: index + 1,
				location: event.location,
				detail: event.event,
				subject: 'character',
				certainty: 'CONFIRMED'
			});
		}

		for (const entry of events) {
			if (entry.kind === 'body-location') addVisit(visits, {
				sequence: entry.sequence,
				location: entry.location || entry.label,
				detail: entry.detail,
				subject: 'body',
				certainty: entry.certainty
			});
			if (entry.kind === 'consciousness-location') addVisit(visits, {
				sequence: entry.sequence,
				location: entry.location ? `${entry.location} · ${entry.label}` : entry.label,
				detail: entry.detail,
				subject: 'consciousness',
				certainty: entry.certainty
			});
		}

		// A temporal presence covering the whole chapter is a valid position even if no move starts there.
		if (!visits.length) {
			const bodyPresence = character?.originalBody?.presences
				?.filter((presence: any) => activeAtChapter(presence, chapter))
				.sort((a: any, b: any) => b.fromEvent.chapter.number - a.fromEvent.chapter.number || b.fromEvent.sequence - a.fromEvent.sequence)[0];
			const bodyLocation = presenceLocation(bodyPresence, locationPaths);
			if (bodyLocation) addVisit(visits, {
				sequence: 0,
				location: bodyLocation,
				detail: 'Position du corps valable pour ce chapitre.',
				subject: 'body',
				certainty: bodyPresence.certainty
			});

			const activeOccupancy = character?.originalConsciousness?.occupancies
				?.filter((occupancy: any) => activeAtChapter(occupancy, chapter))
				.sort((a: any, b: any) => b.fromEvent.chapter.number - a.fromEvent.chapter.number || b.fromEvent.sequence - a.fromEvent.sequence)[0];
			if (activeOccupancy && activeOccupancy.bodyId !== character?.originalBody?.id) {
				const hostPresence = activeOccupancy.body?.presences
					?.filter((presence: any) => activeAtChapter(presence, chapter))
					.sort((a: any, b: any) => b.fromEvent.chapter.number - a.fromEvent.chapter.number || b.fromEvent.sequence - a.fromEvent.sequence)[0];
				const hostLocation = presenceLocation(hostPresence, locationPaths);
				const hostName = activeOccupancy.body?.character?.canonicalName
					? `corps de ${activeOccupancy.body.character.canonicalName}`
					: activeOccupancy.body?.label;
				if (hostLocation && hostName) addVisit(visits, {
					sequence: 0,
					location: `${hostLocation} · ${hostName}`,
					detail: 'Position de la conscience valable pour ce chapitre.',
					subject: 'consciousness',
					certainty: activeOccupancy.certainty
				});
			}
		}

		if (!visits.length) visits.push({
			sequence: 0,
			location: 'Position inconnue',
			detail: 'Aucune source ne permet de situer précisément le personnage dans ce chapitre.',
			subject: 'character',
			certainty: 'UNKNOWN'
		});

		visits.sort((a, b) => a.sequence - b.sequence);
		const isMovement = visits.some((visit, index) => index > 0 &&
			visit.subject === visits[index - 1].subject && visit.location !== visits[index - 1].location
		);
		return { chapter, visits, events, isMovement };
	});
}

export const load: PageServerLoad = async ({ params, cookies }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const spoilerLimit = spoilerLimitCookie ? Number.parseInt(spoilerLimitCookie) : null;
	const projectRoot = join(__dirname, '../../../../../../');
	const [characters, chapters, locations, abilities] = await Promise.all([
		fs.readFile(join(projectRoot, 'data/characters/characters.json'), 'utf-8').then(JSON.parse),
		fs.readFile(join(projectRoot, 'data/chapters/chapters.json'), 'utf-8').then(JSON.parse),
		fs.readFile(join(projectRoot, 'data/locations/locations.json'), 'utf-8').then(JSON.parse),
		fs.readFile(join(projectRoot, 'data/abilities/abilities.json'), 'utf-8').then(JSON.parse)
	]);
	const locationPaths = buildLocationPaths(locations);
	const jsonCharacter = characters.find((candidate: any) => candidate.id === params.slug);

	if (!jsonCharacter) throw error(404, 'Character not found');

	const chapterMatch = jsonCharacter.firstAppearanceChapterId?.match(/ch-(\d+)/);
	const firstVisibleChapterNumber = chapterMatch ? Number.parseInt(chapterMatch[1]) : null;
	if (spoilerLimit && firstVisibleChapterNumber && firstVisibleChapterNumber > spoilerLimit) {
		throw error(404, 'Character not found');
	}

	let character = await prisma.character.findUnique({ where: { slug: params.slug }, include: characterInclude });

	// Some catalogue entries and legacy seed records use different slugs.
	if (!character?.originalBody) {
		const matches = await prisma.character.findMany({
			where: { canonicalName: jsonCharacter.canonicalName },
			include: characterInclude
		});
		character = matches.find((candidate) => candidate.originalBody) || matches[0] || null;
	}

	let timeline = buildTimeline(character, jsonCharacter, locationPaths);
	if (spoilerLimit) timeline = timeline.filter((entry) => entry.chapter === null || entry.chapter <= spoilerLimit);
	let chapterTrajectory = buildChapterTrajectory(timeline, character, jsonCharacter, chapters, locationPaths);
	if (spoilerLimit) chapterTrajectory = chapterTrajectory.filter((entry) => entry.chapter <= spoilerLimit);

	const roleHistory = [
		...(character?.roles || []).map((role: any) => ({
			label: role.roleName,
			chapter: role.fromEvent.chapter.number,
			untilChapter: role.untilEvent?.chapter.number || null,
			detail: eventDetail(role.fromEvent)
		})),
		...(character?.assignments || []).map((assignment: any) => ({
			label: assignment.officialRole,
			chapter: assignment.fromEvent.chapter.number,
			untilChapter: assignment.untilEvent?.chapter.number || null,
			detail: eventDetail(assignment.fromEvent)
		}))
	];

	return {
		character: {
			id: jsonCharacter.id,
			slug: jsonCharacter.id,
			canonicalName: jsonCharacter.canonicalName,
			aliases: jsonCharacter.aliases || [],
			identity: jsonCharacter.identity || null,
			shipLocation: jsonCharacter.shipLocation || null,
			factionId: jsonCharacter.factionId || null,
			firstVisibleChapter: firstVisibleChapterNumber,
			description: jsonCharacter.description || null,
			biography: jsonCharacter.biography || [],
			abilitiesAndPowers: jsonCharacter.abilitiesAndPowers || null,
			equipment: jsonCharacter.equipment || [],
			nen: jsonCharacter.nen || null,
			mangaAppearances: jsonCharacter.mangaAppearances || [],
			battles: jsonCharacter.battles || [],
			competitions: jsonCharacter.competitions || [],
			abilities: abilities.filter((ability: any) => ability.ownerId === jsonCharacter.id)
		},
		roleHistory,
		affiliations: (character?.affiliations || []).map((membership: any) => ({
			name: membership.faction.name,
			role: membership.role,
			status: membership.status,
			chapter: membership.fromEvent.chapter.number,
			untilChapter: membership.untilEvent?.chapter.number || null
		})),
		timeline,
		chapterTrajectory
	};
};
