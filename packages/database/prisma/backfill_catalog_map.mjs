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

const generatedPassengerDescription = 'Named passenger aboard Black Whale 1. No precise position is currently documented in the local map data.';

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

	const ship = synced.get('black-whale-1') || synced.get('black-whale') || null;
	const unknown = await prisma.location.upsert({
		where: { slug: 'black-whale-unknown' },
		update: {
			name: 'Position inconnue à bord',
			parentLocationId: ship?.id || null,
			type: 'UNKNOWN',
			mapElementId: null
		},
		create: {
			slug: 'black-whale-unknown',
			name: 'Position inconnue à bord',
			parentLocationId: ship?.id || null,
			type: 'UNKNOWN',
			mapElementId: null,
			firstVisibleEventId
		}
	});
	synced.set('black-whale-unknown', unknown);

	return synced;
}

function resolveLocation(character, locations) {
	const shipLocation = character.shipLocation;
	if (!shipLocation || (shipLocation.tier == null && !shipLocation.room)) {
		return locations.get('black-whale-unknown') || null;
	}

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

async function mergeDuplicateCharacters(catalogCharacters) {
	const databaseCharacters = await prisma.character.findMany({
		include: { originalBody: true, originalConsciousness: true }
	});
	const catalogByName = new Map(catalogCharacters.map((character) => [character.canonicalName, character.id]));
	const groups = new Map();
	for (const character of databaseCharacters) {
		const group = groups.get(character.canonicalName) || [];
		group.push(character);
		groups.set(character.canonicalName, group);
	}

	let merged = 0;
	for (const [canonicalName, group] of groups) {
		if (group.length < 2) continue;
		const catalogSlug = catalogByName.get(canonicalName);
		const primary = group.find((character) => character.slug === catalogSlug);
		if (!primary) continue;

		for (const duplicate of group.filter((character) => character.id !== primary.id)) {
			if (primary.originalBody && duplicate.originalBody) {
				console.warn(`Cannot merge ${duplicate.slug}: both duplicate records own a body`);
				continue;
			}
			if (primary.originalConsciousness && duplicate.originalConsciousness) {
				console.warn(`Cannot merge ${duplicate.slug}: both duplicate records own a consciousness`);
				continue;
			}

			await prisma.$transaction([
				prisma.body.updateMany({ where: { originalCharacterId: duplicate.id }, data: { originalCharacterId: primary.id } }),
				prisma.consciousness.updateMany({ where: { originCharacterId: duplicate.id }, data: { originCharacterId: primary.id } }),
				prisma.affiliationMembership.updateMany({ where: { characterId: duplicate.id }, data: { characterId: primary.id } }),
				prisma.characterRole.updateMany({ where: { characterId: duplicate.id }, data: { characterId: primary.id } }),
				prisma.characterAssignment.updateMany({ where: { characterId: duplicate.id }, data: { characterId: primary.id } }),
				prisma.characterAssignment.updateMany({ where: { assignedPrinceId: duplicate.id }, data: { assignedPrinceId: primary.id } }),
				prisma.nenAbility.updateMany({ where: { ownerId: duplicate.id }, data: { ownerId: primary.id } }),
				prisma.knowledgeState.updateMany({ where: { observerCharacterId: duplicate.id }, data: { observerCharacterId: primary.id } }),
				prisma.knowledgeState.updateMany({ where: { sourceCharacterId: duplicate.id }, data: { sourceCharacterId: primary.id } }),
				prisma.belief.updateMany({ where: { observerCharacterId: duplicate.id }, data: { observerCharacterId: primary.id } }),
				prisma.belief.updateMany({ where: { subjectType: 'CHARACTER', subjectId: duplicate.id }, data: { subjectId: primary.id } }),
				prisma.fact.updateMany({ where: { subjectType: 'CHARACTER', subjectId: duplicate.id }, data: { subjectId: primary.id } }),
				prisma.eventParticipation.updateMany({ where: { participantType: 'CHARACTER', participantId: duplicate.id }, data: { participantId: primary.id } }),
				prisma.faction.updateMany({ where: { leaderId: duplicate.id }, data: { leaderId: primary.id } }),
				prisma.character.delete({ where: { id: duplicate.id } })
			]);
			primary.originalBody ||= duplicate.originalBody;
			primary.originalConsciousness ||= duplicate.originalConsciousness;
			merged += 1;
		}
	}
	return merged;
}

async function pruneGeneratedPassengerOrphans(catalogCharacters) {
	const catalogSlugs = new Set(catalogCharacters.map((character) => character.id));
	const generatedCharacters = await prisma.character.findMany({
		where: { description: generatedPassengerDescription },
		include: { originalBody: true, originalConsciousness: true }
	});
	let pruned = 0;
	for (const character of generatedCharacters) {
		if (catalogSlugs.has(character.slug)) continue;
		await prisma.$transaction([
			...(character.originalBody ? [prisma.presence.deleteMany({ where: { entityId: character.originalBody.id } })] : []),
			...(character.originalBody ? [prisma.body.delete({ where: { id: character.originalBody.id } })] : []),
			...(character.originalConsciousness ? [prisma.consciousness.delete({ where: { id: character.originalConsciousness.id } })] : []),
			prisma.character.delete({ where: { id: character.id } })
		]);
		pruned += 1;
	}
	return pruned;
}

async function main() {
	const boardingEvent = await ensureEvent(358, 'Eve');
	const locations = await syncLocations(boardingEvent.id);
	const duplicatesMerged = await mergeDuplicateCharacters(characters);
	const generatedPassengerOrphansPruned = await pruneGeneratedPassengerOrphans(characters);
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
		} else {
			const updated = await prisma.character.update({
				where: { id: databaseCharacter.id },
				data: {
					canonicalName: catalogCharacter.canonicalName,
					aliases: catalogCharacter.aliases || [],
					description: catalogCharacter.description || null,
					narrativeImportance: narrativeImportance(catalogCharacter.canonStatus),
					modelingLevel: modelingLevel(catalogCharacter.shipLocation?.tier),
					firstVisibleEventId: catalogFirstEvent.id
				}
			});
			databaseCharacter = { ...databaseCharacter, ...updated, firstVisibleEvent: catalogFirstEvent };
			bySlug.set(databaseCharacter.slug, databaseCharacter);
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
		if (catalogCharacter.replaceMapPresenceHistory) {
			await prisma.$transaction([
				prisma.body.update({
					where: { id: body.id },
					data: { firstVisibleEventId: catalogFirstEvent.id }
				}),
				prisma.bodyState.updateMany({
					where: { bodyId: body.id },
					data: { fromEventId: catalogFirstEvent.id }
				}),
				prisma.bodyOccupancy.updateMany({
					where: { bodyId: body.id },
					data: { fromEventId: catalogFirstEvent.id }
				}),
				...(bodyOwner.originalConsciousness ? [prisma.consciousness.update({
					where: { id: bodyOwner.originalConsciousness.id },
					data: { firstVisibleEventId: catalogFirstEvent.id }
				})] : [])
			]);
		}

		const existingPresences = await prisma.presence.findMany({
			where: { entityId: body.id },
			include: {
				fromEvent: { include: { chapter: true } },
				untilEvent: { include: { chapter: true } },
				location: true
			}
		});
		const requestedPresenceChapter = chapterNumber(catalogCharacter.mapPresenceFromChapterId);
		const requestedUntilChapter = chapterNumber(catalogCharacter.mapPresenceUntilChapterId);
		const existingPresence = existingPresences
			.sort((left, right) => {
				if (left.untilEventId === null && right.untilEventId !== null) return -1;
				if (left.untilEventId !== null && right.untilEventId === null) return 1;
				return right.fromEvent.chapter.number - left.fromEvent.chapter.number
					|| right.fromEvent.sequence - left.fromEvent.sequence;
			})
			.find((presence) => requestedPresenceChapter !== null
				? presence.fromEvent.chapter.number === requestedPresenceChapter
				: requestedUntilChapter !== null
					? presence.location?.type !== 'UNKNOWN' && presence.fromEvent.chapter.number < requestedUntilChapter
					: presence.untilEventId === null)
			|| existingPresences[0];
		if (existingPresence) {
			const requestedPresenceEvent = requestedPresenceChapter ? await ensureEvent(requestedPresenceChapter) : null;
			const requestedCertainty = /^(inconnu|suspect)$/i.test(catalogCharacter.shipLocation?.status || '') ? 'PROBABLE' : 'CONFIRMED';
			const requestedPrecision = location.type === 'ROOM'
				? 'EXACT_ROOM'
				: location.type === 'TIER'
					? 'TIER'
					: location.type === 'UNKNOWN' ? 'UNKNOWN' : 'ZONE';
			const requiresUpdate = existingPresence.locationId !== location.id
				|| (requestedPresenceEvent && existingPresence.fromEventId !== requestedPresenceEvent.id)
				|| (catalogCharacter.replaceMapPresenceHistory && existingPresence.untilEventId !== null)
				|| existingPresence.precision !== requestedPrecision
				|| existingPresence.certainty !== requestedCertainty;
			if (requiresUpdate) {
				await prisma.presence.update({
					where: { id: existingPresence.id },
					data: {
						locationId: location.id,
						...(requestedPresenceEvent ? { fromEventId: requestedPresenceEvent.id } : {}),
						...(catalogCharacter.replaceMapPresenceHistory ? { untilEventId: null } : {}),
						precision: requestedPrecision,
						certainty: requestedCertainty
					}
				});
				presencesUpdated += 1;
			}
			if (catalogCharacter.replaceMapPresenceHistory) {
				await prisma.presence.deleteMany({
					where: { entityId: body.id, id: { not: existingPresence.id } }
				});
			}
			const untilEvent = requestedUntilChapter ? await ensureEvent(requestedUntilChapter) : null;
			if (untilEvent && existingPresence.untilEventId !== untilEvent.id) {
				await prisma.presence.update({
					where: { id: existingPresence.id },
					data: { untilEventId: untilEvent.id }
				});
				presencesEnded += 1;
			}
			if (untilEvent && !isDeadStatus(catalogCharacter.shipLocation?.status)) {
				const unknownLocation = locations.get('black-whale-unknown');
				await prisma.presence.deleteMany({
					where: {
						entityId: body.id,
						id: { not: existingPresence.id },
						fromEventId: untilEvent.id,
						untilEventId: untilEvent.id,
						locationId: { not: unknownLocation?.id }
					}
				});
				const continuations = await prisma.presence.findMany({
					where: { entityId: body.id, fromEventId: untilEvent.id, locationId: unknownLocation?.id },
					orderBy: { id: 'asc' }
				});
				const continuation = continuations[0];
				if (!continuation) {
					await prisma.presence.create({
						data: {
							entityType: 'BODY',
							entityId: body.id,
							locationId: unknownLocation?.id || null,
							fromEventId: untilEvent.id,
							precision: 'UNKNOWN',
							certainty: 'LAST_KNOWN'
						}
					});
					presencesCreated += 1;
				} else {
					if (continuation.untilEventId || continuation.precision !== 'UNKNOWN' || continuation.certainty !== 'LAST_KNOWN') {
						await prisma.presence.update({
							where: { id: continuation.id },
							data: { untilEventId: null, precision: 'UNKNOWN', certainty: 'LAST_KNOWN' }
						});
						presencesUpdated += 1;
					}
					if (continuations.length > 1) {
						await prisma.presence.deleteMany({
							where: { id: { in: continuations.slice(1).map((presence) => presence.id) } }
						});
					}
				}
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
					precision: location.type === 'ROOM'
						? 'EXACT_ROOM'
						: location.type === 'TIER'
							? 'TIER'
							: location.type === 'UNKNOWN' ? 'UNKNOWN' : 'ZONE',
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

	// A catalogue entry may have been created during this run for a legacy seed
	// record (Vincent is the historical example), so perform one final merge.
	const duplicatesMergedAfterCreation = await mergeDuplicateCharacters(characters);

	console.log(JSON.stringify({
		locationsSynced: locations.size,
		duplicatesMerged: duplicatesMerged + duplicatesMergedAfterCreation,
		generatedPassengerOrphansPruned,
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
