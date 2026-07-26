import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '../../..');

const characters = JSON.parse(
	await readFile(resolve(projectRoot, 'data/characters/characters.json'), 'utf8')
);
const locationCatalog = JSON.parse(
	await readFile(resolve(projectRoot, 'data/locations/locations.json'), 'utf8')
);

const locationTypeByZone = {
	ship: 'SHIP',
	tier: 'TIER',
	public: 'ZONE',
	administrative: 'ZONE',
	residential: 'ZONE',
	quarters: 'ROOM',
	infrastructure: 'CORRIDOR',
	mafia: 'ZONE',
	medical: 'ZONE',
	prison: 'ROOM',
	military: 'ZONE',
	corridor: 'CORRIDOR',
	zone: 'ZONE',
	room: 'ROOM'
};

const namedRoomSlugs = new Map([
	['heil-ly secret hideout', 'tier-2-heilly-secret-hideout'],
	['heilly secret hideout', 'tier-2-heilly-secret-hideout'],
	['vvip living quarters', 'tier-1-vvip-living-quarters'],
	['vip living quarters', 'tier-1-vvip-living-quarters'],
	['vip area', 'tier-1-vvip-living-quarters'],
	['casino vip', 'tier-1-vip-casino'],
	['vip casino', 'tier-1-vip-casino'],
	['vip jail', 'tier-1-vip-jail'],
	['vvip prison', 'tier-1-vvip-prison-beyond'],
	['commissariat central', 'tier-3-central-police-station'],
	['tribunal central', 'tier-3-central-courthouse'],
	['clinique', 'tier-3-central-hospital'],
	['hopital', 'tier-3-central-hospital'],
	['hôpital', 'tier-3-central-hospital'],
	['passage central tier 4–5', 'tier-4-central-passage'],
	['passage central tier 4-5', 'tier-4-central-passage'],
	['réfectoire central', 'tier-5-central-dining-hall'],
	['refectoire central', 'tier-5-central-dining-hall'],
	['central dining hall', 'tier-5-central-dining-hall'],
	['installations de recyclage et d’épuration', 'tier-4-recycling-sewage-facilities'],
	["installations de recyclage et d'epuration", 'tier-4-recycling-sewage-facilities'],
	['unités résidentielles', 'tier-3-residential-units'],
	['unites residentielles', 'tier-3-residential-units'],
	['cabines standard', 'tier-5-standard-cabins'],
	['standard cabins', 'tier-5-standard-cabins']
]);

function chapterNumber(chapterId) {
	const match = chapterId?.match(/^ch-(\d+)$/);
	return match ? Number(match[1]) : null;
}

function isDeadStatus(status) {
	return /^(mort|morte|decede|decedee|décédé|décédée)$/i.test(status || '');
}

function narrativeImportance(canonStatus) {
	if (canonStatus === 'canon') return 'PRIMARY';
	if (canonStatus === 'semi-canon') return 'SECONDARY';
	return 'MINOR';
}

function modelingLevel(tier) {
	if (tier === 1) return 1;
	if (tier === 2) return 2;
	return tier ? 3 : 4;
}

async function ensureEvent(number, title = `Chapitre ${number}`) {
	const chapter = await prisma.chapter.upsert({
		where: { number },
		update: {},
		create: { number, title }
	});
	const existing = await prisma.narrativeEvent.findFirst({
		where: { chapterId: chapter.id },
		orderBy: { sequence: 'asc' }
	});
	if (existing) return { ...existing, chapter: { number } };
	const created = await prisma.narrativeEvent.create({
		data: {
			chapterId: chapter.id,
			sequence: 1,
			title: `Début du chapitre ${number}`,
			summary: `Événement de référence pour le chapitre ${number}`
		}
	});
	return { ...created, chapter: { number } };
}

async function syncLocations(firstVisibleEventId) {
	const synced = new Map();
	const pending = [...locationCatalog];

	while (pending.length) {
		let progressed = false;
		for (let index = pending.length - 1; index >= 0; index -= 1) {
			const location = pending[index];
			const parent = location.parentLocationId ? synced.get(location.parentLocationId) : null;
			if (location.parentLocationId && !parent) continue;

			const record = await prisma.location.upsert({
				where: { slug: location.id },
				update: {
					name: location.name,
					parentLocationId: parent?.id || null,
					type: locationTypeByZone[location.zoneType?.toLowerCase()] || 'UNKNOWN'
				},
				create: {
					slug: location.id,
					name: location.name,
					parentLocationId: parent?.id || null,
					type: locationTypeByZone[location.zoneType?.toLowerCase()] || 'UNKNOWN',
					mapElementId: `${location.id}-svg`,
					firstVisibleEventId
				}
			});
			synced.set(location.id, record);
			pending.splice(index, 1);
			progressed = true;
		}
		if (!progressed) {
			throw new Error(`Hiérarchie de lieux non résolue : ${pending.map((item) => item.id).join(', ')}`);
		}
	}

	return synced;
}

function resolveLocation(character, locations) {
	const shipLocation = character.shipLocation;
	if (!shipLocation || (shipLocation.tier == null && !shipLocation.room)) return null;

	const room = String(shipLocation.room || '').trim();
	const numericRoom = room.match(/^10(?:0[0-9]|1[0-4])$/);
	if (numericRoom) {
		if (room === '1000') return locations.get('tier-1-royal-residential-sector') || locations.get('tier-1');
		return locations.get(`tier-1-royal-residential-sector-room-${room}`) || locations.get('tier-1');
	}

	const normalizedRoom = room.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	for (const [label, slug] of namedRoomSlugs) {
		if (normalizedRoom.includes(label.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
			return locations.get(slug) || locations.get(`tier-${shipLocation.tier}`);
		}
	}

	// Les cabines scientifiques n'ont pas encore de sous-zone canonique dans le catalogue.
	if (normalizedRoom.includes('scientifique')) return locations.get('tier-3');
	return locations.get(`tier-${shipLocation.tier}`) || null;
}

async function main() {
	const boardingEvent = await ensureEvent(358, 'Eve');
	const locations = await syncLocations(boardingEvent.id);
	const databaseCharacters = await prisma.character.findMany({
		include: {
			firstVisibleEvent: { include: { chapter: true } },
			originalBody: true,
			originalConsciousness: true
		}
	});
	const bySlug = new Map(databaseCharacters.map((character) => [character.slug, character]));
	const byCanonicalName = new Map();
	for (const character of databaseCharacters) {
		const group = byCanonicalName.get(character.canonicalName) || [];
		group.push(character);
		byCanonicalName.set(character.canonicalName, group);
	}

	let charactersCreated = 0;
	let bodiesCreated = 0;
	let presencesCreated = 0;
	let presencesUpdated = 0;
	let presencesEnded = 0;
	let positionsAlreadyCovered = 0;
	let positionsWithoutLocation = 0;

	for (const catalogCharacter of characters) {
		const existingDatabaseCharacter = bySlug.get(catalogCharacter.id);
		if (catalogCharacter.mapPresenceUntilChapterId && existingDatabaseCharacter?.originalBody) {
			const untilChapter = chapterNumber(catalogCharacter.mapPresenceUntilChapterId);
			const untilEvent = untilChapter ? await ensureEvent(untilChapter) : null;
			if (untilEvent) {
				const result = await prisma.presence.updateMany({
					where: { entityId: existingDatabaseCharacter.originalBody.id, untilEventId: null },
					data: { untilEventId: untilEvent.id }
				});
				presencesEnded += result.count;
			}
		}

		const location = resolveLocation(catalogCharacter, locations);
		if (!location) {
			positionsWithoutLocation += 1;
			continue;
		}

		const requestedChapter = chapterNumber(catalogCharacter.firstAppearanceChapterId);
		const catalogFirstEvent = requestedChapter ? await ensureEvent(requestedChapter) : boardingEvent;
		let databaseCharacter = bySlug.get(catalogCharacter.id);

		if (!databaseCharacter) {
			databaseCharacter = await prisma.character.create({
				data: {
					slug: catalogCharacter.id,
					canonicalName: catalogCharacter.canonicalName,
					aliases: catalogCharacter.aliases || [],
					description: catalogCharacter.description || null,
					narrativeImportance: narrativeImportance(catalogCharacter.canonStatus),
					modelingLevel: modelingLevel(catalogCharacter.shipLocation?.tier),
					firstVisibleEventId: catalogFirstEvent.id
				}
			});
			databaseCharacter = {
				...databaseCharacter,
				firstVisibleEvent: catalogFirstEvent,
				originalBody: null,
				originalConsciousness: null
			};
			bySlug.set(databaseCharacter.slug, databaseCharacter);
			const group = byCanonicalName.get(databaseCharacter.canonicalName) || [];
			group.push(databaseCharacter);
			byCanonicalName.set(databaseCharacter.canonicalName, group);
			charactersCreated += 1;
		}

		const canonicalBodyOwner = (byCanonicalName.get(catalogCharacter.canonicalName) || [])
			.find((candidate) => candidate.originalBody);
		const bodyOwner = databaseCharacter.originalBody ? databaseCharacter : (canonicalBodyOwner || databaseCharacter);
		let body = bodyOwner.originalBody;
		const bodyFirstEvent = bodyOwner.firstVisibleEvent || catalogFirstEvent;

		if (!body) {
			body = await prisma.body.create({
				data: {
					originalCharacterId: bodyOwner.id,
					label: `${bodyOwner.canonicalName} Body`,
					bodyType: 'ORIGINAL',
					firstVisibleEventId: bodyFirstEvent.id
				}
			});
			bodyOwner.originalBody = body;
			bodiesCreated += 1;
		}

		const existingPresences = await prisma.presence.findMany({
			where: { entityId: body.id },
			include: { fromEvent: { include: { chapter: true } } }
		});
		const requestedPresenceChapter = chapterNumber(catalogCharacter.mapPresenceFromChapterId);
		const existingPresence = existingPresences
			.sort((left, right) => {
				if (left.untilEventId === null && right.untilEventId !== null) return -1;
				if (left.untilEventId !== null && right.untilEventId === null) return 1;
				return right.fromEvent.chapter.number - left.fromEvent.chapter.number
					|| right.fromEvent.sequence - left.fromEvent.sequence;
			})
			.find((presence) => requestedPresenceChapter === null
				|| presence.fromEvent.chapter.number === requestedPresenceChapter)
			|| existingPresences[0];
		if (existingPresence) {
			const requestedPresenceEvent = requestedPresenceChapter ? await ensureEvent(requestedPresenceChapter) : null;
			const requestedCertainty = /^(inconnu|suspect)$/i.test(catalogCharacter.shipLocation?.status || '') ? 'PROBABLE' : 'CONFIRMED';
			const requestedPrecision = location.type === 'ROOM' ? 'EXACT_ROOM' : location.type === 'TIER' ? 'TIER' : 'ZONE';
			const requiresUpdate = existingPresence.locationId !== location.id
				|| (requestedPresenceEvent && existingPresence.fromEventId !== requestedPresenceEvent.id)
				|| existingPresence.precision !== requestedPrecision
				|| existingPresence.certainty !== requestedCertainty;
			if (requiresUpdate) {
				await prisma.presence.update({
					where: { id: existingPresence.id },
					data: {
						locationId: location.id,
						...(requestedPresenceEvent ? { fromEventId: requestedPresenceEvent.id } : {}),
						precision: requestedPrecision,
						certainty: requestedCertainty
					}
				});
				presencesUpdated += 1;
			}
			const untilChapter = chapterNumber(catalogCharacter.mapPresenceUntilChapterId);
			const untilEvent = untilChapter ? await ensureEvent(untilChapter) : null;
			if (untilEvent && !existingPresence.untilEventId) {
				await prisma.presence.update({
					where: { id: existingPresence.id },
					data: { untilEventId: untilEvent.id }
				});
				presencesEnded += 1;
			}
			positionsAlreadyCovered += 1;
			continue;
		}

		let consciousness = bodyOwner.originalConsciousness;
		if (!consciousness) {
			consciousness = await prisma.consciousness.create({
				data: {
					originCharacterId: bodyOwner.id,
					label: `${bodyOwner.canonicalName} Consciousness`,
					consciousnessType: 'ORIGINAL',
					firstVisibleEventId: bodyFirstEvent.id
				}
			});
			bodyOwner.originalConsciousness = consciousness;
		}

		const requestedPresenceEvent = requestedPresenceChapter ? await ensureEvent(requestedPresenceChapter) : null;
		const requestedUntilChapter = chapterNumber(catalogCharacter.mapPresenceUntilChapterId);
		const requestedUntilEvent = requestedUntilChapter ? await ensureEvent(requestedUntilChapter) : null;
		const presenceStartEvent = requestedPresenceEvent || (bodyFirstEvent.chapter.number > 358 ? bodyFirstEvent : boardingEvent);
		const existingOccupancy = await prisma.bodyOccupancy.findFirst({ where: { bodyId: body.id } });
		const existingBodyState = await prisma.bodyState.findFirst({ where: { bodyId: body.id } });
		const writes = [
			prisma.presence.create({
				data: {
					entityType: 'BODY',
					entityId: body.id,
					locationId: location.id,
					fromEventId: presenceStartEvent.id,
					untilEventId: requestedUntilEvent?.id || null,
					precision: location.type === 'ROOM' ? 'EXACT_ROOM' : location.type === 'TIER' ? 'TIER' : 'ZONE',
					certainty: /^(inconnu|suspect)$/i.test(catalogCharacter.shipLocation?.status || '') ? 'PROBABLE' : 'CONFIRMED'
				}
			})
		];
		if (!existingOccupancy) {
			writes.push(prisma.bodyOccupancy.create({
				data: {
					bodyId: body.id,
					consciousnessId: consciousness.id,
					fromEventId: bodyFirstEvent.id,
					occupancyType: 'ORIGINAL',
					certainty: 'CONFIRMED'
				}
			}));
		}
		if (!existingBodyState) {
			writes.push(prisma.bodyState.create({
				data: {
					bodyId: body.id,
					state: isDeadStatus(catalogCharacter.shipLocation?.status) ? 'DEAD' : 'ALIVE',
					fromEventId: presenceStartEvent.id
				}
			}));
		}
		await prisma.$transaction(writes);
		presencesCreated += 1;
	}

	console.log(JSON.stringify({
		locationsSynced: locations.size,
		charactersCreated,
		bodiesCreated,
		presencesCreated,
		presencesUpdated,
		presencesEnded,
		positionsAlreadyCovered,
		positionsWithoutLocation
	}, null, 2));
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
