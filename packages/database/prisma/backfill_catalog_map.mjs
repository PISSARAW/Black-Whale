import { PrismaClient } from '@prisma/client'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prisma = new PrismaClient()
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '../../..')

const characters = JSON.parse(
  await readFile(resolve(projectRoot, 'data/characters/characters.json'), 'utf8'),
)
const locationCatalog = JSON.parse(
  await readFile(resolve(projectRoot, 'data/locations/locations.json'), 'utf8'),
)

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
  room: 'ROOM',
}

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
  ['residential units', 'tier-3-residential-units'],
  ['cabines standard', 'tier-5-standard-cabins'],
  ['standard cabins', 'tier-5-standard-cabins'],
  ['recycling & sewage facilities', 'tier-4-recycling-sewage-facilities'],
  ['recycling and sewage facilities', 'tier-4-recycling-sewage-facilities'],
  ['central hospital', 'tier-3-central-hospital'],
  ['cha-r family hideout', 'tier-5-cha-r-family-office'],
  ['justice bureau office', 'tier-2-ministry-of-justice'],
  ['secteur résidentiel royal', 'tier-1-royal-residential-sector'],
  ['secteur residentiel royal', 'tier-1-royal-residential-sector'],
  ['royal residential sector', 'tier-1-royal-residential-sector'],
])

const generatedPassengerDescription =
  'Named passenger aboard Black Whale 1. No precise position is currently documented in the local map data.'

/// Chapter references are `ch-<number>`, optionally pinned to one event of that
/// chapter with `ch-<number>.<sequence>`. Without a sequence the chapter's first
/// event is used, which is all most entries need.
function chapterReference(chapterId) {
  const match = chapterId?.match(/^ch-(\d+)(?:\.(\d+))?$/)
  if (!match) return null
  return { number: Number(match[1]), sequence: match[2] ? Number(match[2]) : null }
}

function chapterNumber(chapterId) {
  return chapterReference(chapterId)?.number ?? null
}

function isDeadStatus(status) {
  return /^(mort|morte|decede|decedee|décédé|décédée|dead|deceased)$/i.test(status || '')
}

/// The chapter a character dies in, read from the catalogue's appearance list.
/// A `death` entry only counts when the character is not present again later:
/// Hisoka "dies" in 356 and is back on panel in 357, so he never leaves the map.
const presentStatuses = new Set(['appears', 'debut', 'disguised', 'death'])

function deathChapter(character) {
  const appearances = character.mangaAppearances || []
  const death = [...appearances].reverse().find((entry) => entry.status === 'death')
  if (!death) return null
  const returnsLater = appearances.some(
    (entry) => entry.chapter > death.chapter && presentStatuses.has(entry.status),
  )
  return returnsLater ? null : death.chapter
}

function narrativeImportance(canonStatus) {
  if (canonStatus === 'canon') return 'PRIMARY'
  if (canonStatus === 'semi-canon') return 'SECONDARY'
  return 'MINOR'
}

function modelingLevel(tier) {
  if (tier === 1) return 1
  if (tier === 2) return 2
  return tier ? 3 : 4
}

async function ensureEvent(number, title = `Chapitre ${number}`, sequence = null) {
  const chapter = await prisma.chapter.upsert({
    where: { number },
    update: {},
    create: { number, title },
  })
  const existing = await prisma.narrativeEvent.findFirst({
    where: { chapterId: chapter.id, ...(sequence === null ? {} : { sequence }) },
    orderBy: { sequence: 'asc' },
  })
  if (existing) return { ...existing, chapter: { number } }
  const created = await prisma.narrativeEvent.create({
    data: {
      chapterId: chapter.id,
      sequence: sequence ?? 1,
      title: `Début du chapitre ${number}`,
      summary: `Événement de référence pour le chapitre ${number}`,
    },
  })
  orderedEventsCache = null
  return { ...created, chapter: { number } }
}

async function resolveEventRef(chapterId) {
  const reference = chapterReference(chapterId)
  if (!reference) return null
  return ensureEvent(reference.number, `Chapitre ${reference.number}`, reference.sequence)
}

/// Presences are half-open: `isActiveAt` stops reporting a record at its
/// `untilEvent`. A character who dies in an event is still standing there when
/// it happens, so the closing bound is the *next* event on the timeline, not
/// the death itself. Without this a victim silently vanishes from the very
/// chapter that kills them.
let orderedEventsCache = null

async function orderedEvents() {
  if (!orderedEventsCache) {
    const events = await prisma.narrativeEvent.findMany({ include: { chapter: true } })
    orderedEventsCache = events.sort(
      (left, right) =>
        (left.ordinal ?? Number.MAX_SAFE_INTEGER) - (right.ordinal ?? Number.MAX_SAFE_INTEGER) ||
        left.chapter.number - right.chapter.number ||
        left.sequence - right.sequence,
    )
  }
  return orderedEventsCache
}

async function eventAfter(event) {
  if (!event) return null
  const events = await orderedEvents()
  const index = events.findIndex((candidate) => candidate.id === event.id)
  if (index === -1 || index + 1 >= events.length) return null
  const next = events[index + 1]
  return { ...next, chapter: { number: next.chapter.number } }
}

function precisionFor(location) {
  if (location.type === 'ROOM') return 'EXACT_ROOM'
  if (location.type === 'TIER') return 'TIER'
  if (location.type === 'UNKNOWN') return 'UNKNOWN'
  return 'ZONE'
}

/// `shipLocation` can only ever describe one position, so a character who moves
/// during the arc declares each leg in `mapTrajectory` instead. A leg ends where
/// the next one begins — deriving the handoff rather than restating it is what
/// keeps consecutive legs from overlapping — and `untilChapterId` is only for a
/// final leg that stops without a successor.
///
/// Ids are deterministic so a rerun updates legs in place, and a trajectory that
/// loses a leg drops the stale presence instead of leaving it behind.
async function syncTrajectory(character, body, locations) {
  const legs = character.mapTrajectory
  const keptIds = []
  let created = 0
  let updated = 0

  for (const [index, leg] of legs.entries()) {
    const location = locations.get(leg.location)
    if (!location) {
      throw new Error(`${character.id}: unknown trajectory location "${leg.location}"`)
    }
    const fromEvent = await resolveEventRef(leg.fromChapterId)
    if (!fromEvent) {
      throw new Error(`${character.id}: unusable trajectory start "${leg.fromChapterId}"`)
    }
    const nextLeg = legs[index + 1]
    const untilEvent = nextLeg
      ? await resolveEventRef(nextLeg.fromChapterId)
      : await eventAfter(await resolveEventRef(leg.untilChapterId))

    const id = `trajectory-${character.id}-${index}`
    const data = {
      entityType: 'BODY',
      entityId: body.id,
      locationId: location.id,
      fromEventId: fromEvent.id,
      untilEventId: untilEvent?.id ?? null,
      precision: precisionFor(location),
      certainty: leg.certainty || 'CONFIRMED',
    }
    const existing = await prisma.presence.findUnique({ where: { id } })
    if (existing) {
      await prisma.presence.update({ where: { id }, data })
      updated += 1
    } else {
      await prisma.presence.create({ data: { id, ...data } })
      created += 1
    }
    keptIds.push(id)
  }

  await prisma.presence.deleteMany({ where: { entityId: body.id, id: { notIn: keptIds } } })
  return { created, updated }
}

/// A body that dies holds one ALIVE record up to the death and one DEAD record
/// from it. The catalogue owns the date, so both bounds are rewritten on every
/// run rather than only filled in when missing.
async function reconcileMortality(body, firstEvent, deathEvent) {
  const states = await prisma.bodyState.findMany({
    where: { bodyId: body.id },
    orderBy: { id: 'asc' },
  })
  const alive = states.find((state) => state.state === 'ALIVE')
  const dead = states.find((state) => state.state === 'DEAD')
  let changed = 0

  if (!alive) {
    await prisma.bodyState.create({
      data: {
        bodyId: body.id,
        state: 'ALIVE',
        fromEventId: firstEvent.id,
        untilEventId: deathEvent.id,
      },
    })
    changed += 1
  } else if (alive.fromEventId !== firstEvent.id || alive.untilEventId !== deathEvent.id) {
    await prisma.bodyState.update({
      where: { id: alive.id },
      data: { fromEventId: firstEvent.id, untilEventId: deathEvent.id },
    })
    changed += 1
  }

  if (!dead) {
    await prisma.bodyState.create({
      data: { bodyId: body.id, state: 'DEAD', fromEventId: deathEvent.id },
    })
    changed += 1
  } else if (dead.fromEventId !== deathEvent.id || dead.untilEventId !== null) {
    await prisma.bodyState.update({
      where: { id: dead.id },
      data: { fromEventId: deathEvent.id, untilEventId: null },
    })
    changed += 1
  }

  return changed
}

async function syncLocations(firstVisibleEventId) {
  const synced = new Map()
  const pending = [...locationCatalog]

  while (pending.length) {
    let progressed = false
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const location = pending[index]
      const parent = location.parentLocationId ? synced.get(location.parentLocationId) : null
      if (location.parentLocationId && !parent) continue

      const record = await prisma.location.upsert({
        where: { slug: location.id },
        update: {
          name: location.name,
          parentLocationId: parent?.id || null,
          type: locationTypeByZone[location.zoneType?.toLowerCase()] || 'UNKNOWN',
        },
        create: {
          slug: location.id,
          name: location.name,
          parentLocationId: parent?.id || null,
          type: locationTypeByZone[location.zoneType?.toLowerCase()] || 'UNKNOWN',
          mapElementId: `${location.id}-svg`,
          firstVisibleEventId,
        },
      })
      synced.set(location.id, record)
      pending.splice(index, 1)
      progressed = true
    }
    if (!progressed) {
      throw new Error(
        `Hiérarchie de lieux non résolue : ${pending.map((item) => item.id).join(', ')}`,
      )
    }
  }

  const ship = synced.get('black-whale-1') || synced.get('black-whale') || null
  const unknown = await prisma.location.upsert({
    where: { slug: 'black-whale-unknown' },
    update: {
      name: 'Position inconnue à bord',
      parentLocationId: ship?.id || null,
      type: 'UNKNOWN',
      mapElementId: null,
    },
    create: {
      slug: 'black-whale-unknown',
      name: 'Position inconnue à bord',
      parentLocationId: ship?.id || null,
      type: 'UNKNOWN',
      mapElementId: null,
      firstVisibleEventId,
    },
  })
  synced.set('black-whale-unknown', unknown)

  return synced
}

function resolveLocation(character, locations) {
  const shipLocation = character.shipLocation
  if (!shipLocation || (shipLocation.tier == null && !shipLocation.room)) {
    return locations.get('black-whale-unknown') || null
  }

  const room = String(shipLocation.room || '').trim()
  const numericRoom = room.match(/^10(?:0[0-9]|1[0-4])$/)
  if (numericRoom) {
    if (room === '1000')
      return locations.get('tier-1-royal-residential-sector') || locations.get('tier-1')
    return locations.get(`tier-1-royal-residential-sector-room-${room}`) || locations.get('tier-1')
  }

  const normalizedRoom = room
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  for (const [label, slug] of namedRoomSlugs) {
    if (normalizedRoom.includes(label.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      return locations.get(slug) || locations.get(`tier-${shipLocation.tier}`)
    }
  }

  // Les cabines scientifiques n'ont pas encore de sous-zone canonique dans le catalogue.
  if (normalizedRoom.includes('scientifique')) return locations.get('tier-3')
  return locations.get(`tier-${shipLocation.tier}`) || null
}

async function mergeDuplicateCharacters(catalogCharacters) {
  const databaseCharacters = await prisma.character.findMany({
    include: { originalBody: true, originalConsciousness: true },
  })
  const catalogByName = new Map(
    catalogCharacters.map((character) => [character.canonicalName, character.id]),
  )
  const groups = new Map()
  for (const character of databaseCharacters) {
    const group = groups.get(character.canonicalName) || []
    group.push(character)
    groups.set(character.canonicalName, group)
  }

  let merged = 0
  for (const [canonicalName, group] of groups) {
    if (group.length < 2) continue
    const catalogSlug = catalogByName.get(canonicalName)
    const primary = group.find((character) => character.slug === catalogSlug)
    if (!primary) continue

    for (const duplicate of group.filter((character) => character.id !== primary.id)) {
      if (primary.originalBody && duplicate.originalBody) {
        console.warn(`Cannot merge ${duplicate.slug}: both duplicate records own a body`)
        continue
      }
      if (primary.originalConsciousness && duplicate.originalConsciousness) {
        console.warn(`Cannot merge ${duplicate.slug}: both duplicate records own a consciousness`)
        continue
      }

      await prisma.$transaction([
        prisma.body.updateMany({
          where: { originalCharacterId: duplicate.id },
          data: { originalCharacterId: primary.id },
        }),
        prisma.consciousness.updateMany({
          where: { originCharacterId: duplicate.id },
          data: { originCharacterId: primary.id },
        }),
        prisma.affiliationMembership.updateMany({
          where: { characterId: duplicate.id },
          data: { characterId: primary.id },
        }),
        prisma.characterRole.updateMany({
          where: { characterId: duplicate.id },
          data: { characterId: primary.id },
        }),
        prisma.characterAssignment.updateMany({
          where: { characterId: duplicate.id },
          data: { characterId: primary.id },
        }),
        prisma.characterAssignment.updateMany({
          where: { assignedPrinceId: duplicate.id },
          data: { assignedPrinceId: primary.id },
        }),
        prisma.nenAbility.updateMany({
          where: { ownerId: duplicate.id },
          data: { ownerId: primary.id },
        }),
        prisma.knowledgeState.updateMany({
          where: { observerCharacterId: duplicate.id },
          data: { observerCharacterId: primary.id },
        }),
        prisma.knowledgeState.updateMany({
          where: { sourceCharacterId: duplicate.id },
          data: { sourceCharacterId: primary.id },
        }),
        prisma.belief.updateMany({
          where: { observerCharacterId: duplicate.id },
          data: { observerCharacterId: primary.id },
        }),
        prisma.belief.updateMany({
          where: { subjectType: 'CHARACTER', subjectId: duplicate.id },
          data: { subjectId: primary.id },
        }),
        prisma.fact.updateMany({
          where: { subjectType: 'CHARACTER', subjectId: duplicate.id },
          data: { subjectId: primary.id },
        }),
        prisma.eventParticipation.updateMany({
          where: { participantType: 'CHARACTER', participantId: duplicate.id },
          data: { participantId: primary.id },
        }),
        prisma.faction.updateMany({
          where: { leaderId: duplicate.id },
          data: { leaderId: primary.id },
        }),
        prisma.character.delete({ where: { id: duplicate.id } }),
      ])
      primary.originalBody ||= duplicate.originalBody
      primary.originalConsciousness ||= duplicate.originalConsciousness
      merged += 1
    }
  }
  return merged
}

async function pruneGeneratedPassengerOrphans(catalogCharacters) {
  const catalogSlugs = new Set(catalogCharacters.map((character) => character.id))
  const generatedCharacters = await prisma.character.findMany({
    where: { description: generatedPassengerDescription },
    include: { originalBody: true, originalConsciousness: true },
  })
  let pruned = 0
  for (const character of generatedCharacters) {
    if (catalogSlugs.has(character.slug)) continue
    await prisma.$transaction([
      ...(character.originalBody
        ? [prisma.presence.deleteMany({ where: { entityId: character.originalBody.id } })]
        : []),
      ...(character.originalBody
        ? [prisma.body.delete({ where: { id: character.originalBody.id } })]
        : []),
      ...(character.originalConsciousness
        ? [prisma.consciousness.delete({ where: { id: character.originalConsciousness.id } })]
        : []),
      prisma.character.delete({ where: { id: character.id } }),
    ])
    pruned += 1
  }
  return pruned
}

async function main() {
  const boardingEvent = await ensureEvent(358, 'Eve')
  const locations = await syncLocations(boardingEvent.id)
  const duplicatesMerged = await mergeDuplicateCharacters(characters)
  const generatedPassengerOrphansPruned = await pruneGeneratedPassengerOrphans(characters)
  const databaseCharacters = await prisma.character.findMany({
    include: {
      firstVisibleEvent: { include: { chapter: true } },
      originalBody: true,
      originalConsciousness: true,
    },
  })
  const bySlug = new Map(databaseCharacters.map((character) => [character.slug, character]))
  const byCanonicalName = new Map()
  for (const character of databaseCharacters) {
    const group = byCanonicalName.get(character.canonicalName) || []
    group.push(character)
    byCanonicalName.set(character.canonicalName, group)
  }

  let charactersCreated = 0
  let bodiesCreated = 0
  let presencesCreated = 0
  let presencesUpdated = 0
  let presencesEnded = 0
  let trajectoriesSynced = 0
  let mortalitiesReconciled = 0
  let positionsAlreadyCovered = 0
  let positionsWithoutLocation = 0

  for (const catalogCharacter of characters) {
    const location = resolveLocation(catalogCharacter, locations)
    if (!location) {
      positionsWithoutLocation += 1
      continue
    }

    const requestedChapter = chapterNumber(catalogCharacter.firstAppearanceChapterId)
    const catalogFirstEvent = requestedChapter ? await ensureEvent(requestedChapter) : boardingEvent
    let databaseCharacter = bySlug.get(catalogCharacter.id)

    if (!databaseCharacter) {
      databaseCharacter = await prisma.character.create({
        data: {
          slug: catalogCharacter.id,
          canonicalName: catalogCharacter.canonicalName,
          aliases: catalogCharacter.aliases || [],
          description: catalogCharacter.description || null,
          narrativeImportance: narrativeImportance(catalogCharacter.canonStatus),
          modelingLevel: modelingLevel(catalogCharacter.shipLocation?.tier),
          firstVisibleEventId: catalogFirstEvent.id,
        },
      })
      databaseCharacter = {
        ...databaseCharacter,
        firstVisibleEvent: catalogFirstEvent,
        originalBody: null,
        originalConsciousness: null,
      }
      bySlug.set(databaseCharacter.slug, databaseCharacter)
      const group = byCanonicalName.get(databaseCharacter.canonicalName) || []
      group.push(databaseCharacter)
      byCanonicalName.set(databaseCharacter.canonicalName, group)
      charactersCreated += 1
    } else {
      const updated = await prisma.character.update({
        where: { id: databaseCharacter.id },
        data: {
          canonicalName: catalogCharacter.canonicalName,
          aliases: catalogCharacter.aliases || [],
          description: catalogCharacter.description || null,
          narrativeImportance: narrativeImportance(catalogCharacter.canonStatus),
          modelingLevel: modelingLevel(catalogCharacter.shipLocation?.tier),
          firstVisibleEventId: catalogFirstEvent.id,
        },
      })
      databaseCharacter = { ...databaseCharacter, ...updated, firstVisibleEvent: catalogFirstEvent }
      bySlug.set(databaseCharacter.slug, databaseCharacter)
    }

    const canonicalBodyOwner = (byCanonicalName.get(catalogCharacter.canonicalName) || []).find(
      (candidate) => candidate.originalBody,
    )
    const bodyOwner = databaseCharacter.originalBody
      ? databaseCharacter
      : canonicalBodyOwner || databaseCharacter
    let body = bodyOwner.originalBody
    const bodyFirstEvent = bodyOwner.firstVisibleEvent || catalogFirstEvent

    if (!body) {
      body = await prisma.body.create({
        data: {
          originalCharacterId: bodyOwner.id,
          label: `${bodyOwner.canonicalName} Body`,
          bodyType: 'ORIGINAL',
          firstVisibleEventId: bodyFirstEvent.id,
        },
      })
      bodyOwner.originalBody = body
      bodiesCreated += 1
    }
    let consciousness = bodyOwner.originalConsciousness
    if (!consciousness) {
      consciousness = await prisma.consciousness.create({
        data: {
          originCharacterId: bodyOwner.id,
          label: `${bodyOwner.canonicalName} Consciousness`,
          consciousnessType: 'ORIGINAL',
          firstVisibleEventId: bodyFirstEvent.id,
        },
      })
      bodyOwner.originalConsciousness = consciousness
    }
    const originalOccupancy = await prisma.bodyOccupancy.findFirst({
      where: {
        bodyId: body.id,
        consciousnessId: consciousness.id,
        occupancyType: 'ORIGINAL',
      },
    })
    if (!originalOccupancy) {
      await prisma.bodyOccupancy.create({
        data: {
          bodyId: body.id,
          consciousnessId: consciousness.id,
          fromEventId: bodyFirstEvent.id,
          occupancyType: 'ORIGINAL',
          certainty: 'CONFIRMED',
        },
      })
    }
    const initialBodyState = await prisma.bodyState.findFirst({ where: { bodyId: body.id } })
    if (!initialBodyState) {
      await prisma.bodyState.create({
        data: {
          bodyId: body.id,
          state: isDeadStatus(catalogCharacter.shipLocation?.status) ? 'DEAD' : 'ALIVE',
          fromEventId: bodyFirstEvent.id,
        },
      })
    }
    if (catalogCharacter.replaceMapPresenceHistory) {
      await prisma.$transaction([
        prisma.body.update({
          where: { id: body.id },
          data: { firstVisibleEventId: catalogFirstEvent.id },
        }),
        prisma.bodyState.updateMany({
          where: { bodyId: body.id },
          data: { fromEventId: catalogFirstEvent.id },
        }),
        prisma.bodyOccupancy.updateMany({
          where: { bodyId: body.id },
          data: { fromEventId: catalogFirstEvent.id },
        }),
        ...(bodyOwner.originalConsciousness
          ? [
              prisma.consciousness.update({
                where: { id: bodyOwner.originalConsciousness.id },
                data: { firstVisibleEventId: catalogFirstEvent.id },
              }),
            ]
          : []),
      ])
    }
    if (catalogCharacter.temporalIdentityManaged) {
      positionsAlreadyCovered += 1
      continue
    }

    const chapterOfDeath = deathChapter(catalogCharacter)
    const deathEvent = chapterOfDeath ? await ensureEvent(chapterOfDeath) : null
    // `mapPresenceUntilChapterId` may pin the exact event, which is finer than
    // the chapter a death status can name — a chapter holds several events and
    // the victim rarely falls in the first one.
    const pinnedLastEvent = await resolveEventRef(catalogCharacter.mapPresenceUntilChapterId)
    if (deathEvent) {
      const diedAt =
        pinnedLastEvent?.chapter?.number === chapterOfDeath ? pinnedLastEvent : deathEvent
      mortalitiesReconciled += await reconcileMortality(body, bodyFirstEvent, diedAt)
    }

    if (catalogCharacter.mapTrajectory?.length) {
      const written = await syncTrajectory(catalogCharacter, body, locations)
      presencesCreated += written.created
      presencesUpdated += written.updated
      trajectoriesSynced += 1
      continue
    }

    const existingPresences = await prisma.presence.findMany({
      where: { entityId: body.id },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
        location: true,
      },
    })
    const requestedPresenceChapter = chapterNumber(catalogCharacter.mapPresenceFromChapterId)
    // Both the catalogue field and the death read as "last chapter still on the
    // map", so the record closes on the event after it: a victim is present in
    // the chapter that kills them.
    const lastPresentEvent = pinnedLastEvent || deathEvent
    const requestedUntilChapter = lastPresentEvent?.chapter?.number ?? null
    const untilEvent = await eventAfter(lastPresentEvent)
    const leavesTheMap = deathEvent !== null || isDeadStatus(catalogCharacter.shipLocation?.status)
    const existingPresence =
      existingPresences
        .sort((left, right) => {
          if (left.untilEventId === null && right.untilEventId !== null) return -1
          if (left.untilEventId !== null && right.untilEventId === null) return 1
          return (
            right.fromEvent.chapter.number - left.fromEvent.chapter.number ||
            right.fromEvent.sequence - left.fromEvent.sequence
          )
        })
        .find((presence) =>
          requestedPresenceChapter !== null
            ? presence.fromEvent.chapter.number === requestedPresenceChapter
            : requestedUntilChapter !== null
              ? presence.location?.type !== 'UNKNOWN' &&
                presence.fromEvent.chapter.number < requestedUntilChapter
              : presence.untilEventId === null,
        ) || existingPresences[0]
    if (existingPresence) {
      const requestedPresenceEvent = requestedPresenceChapter
        ? await ensureEvent(requestedPresenceChapter)
        : null
      const requestedCertainty = /^(inconnu|suspect)$/i.test(
        catalogCharacter.shipLocation?.status || '',
      )
        ? 'PROBABLE'
        : 'CONFIRMED'
      const requestedPrecision = precisionFor(location)
      const requiresUpdate =
        existingPresence.locationId !== location.id ||
        (requestedPresenceEvent && existingPresence.fromEventId !== requestedPresenceEvent.id) ||
        (catalogCharacter.replaceMapPresenceHistory && existingPresence.untilEventId !== null) ||
        existingPresence.precision !== requestedPrecision ||
        existingPresence.certainty !== requestedCertainty
      if (requiresUpdate) {
        await prisma.presence.update({
          where: { id: existingPresence.id },
          data: {
            locationId: location.id,
            ...(requestedPresenceEvent ? { fromEventId: requestedPresenceEvent.id } : {}),
            ...(catalogCharacter.replaceMapPresenceHistory ? { untilEventId: null } : {}),
            precision: requestedPrecision,
            certainty: requestedCertainty,
          },
        })
        presencesUpdated += 1
      }
      if (catalogCharacter.replaceMapPresenceHistory) {
        await prisma.presence.deleteMany({
          where: { entityId: body.id, id: { not: existingPresence.id } },
        })
      }
      if (untilEvent && existingPresence.untilEventId !== untilEvent.id) {
        await prisma.presence.update({
          where: { id: existingPresence.id },
          data: { untilEventId: untilEvent.id },
        })
        presencesEnded += 1
      }
      if (untilEvent && leavesTheMap) {
        // Whoever leaves the map for good keeps exactly one record, closed at
        // the end. Anything else is a last-known continuation from a run made
        // before the death was known, and it would put a corpse back on deck.
        await prisma.presence.deleteMany({
          where: { entityId: body.id, id: { not: existingPresence.id } },
        })
      }
      if (untilEvent && !leavesTheMap) {
        const unknownLocation = locations.get('black-whale-unknown')
        await prisma.presence.deleteMany({
          where: {
            entityId: body.id,
            id: { not: existingPresence.id },
            fromEventId: untilEvent.id,
            untilEventId: untilEvent.id,
            locationId: { not: unknownLocation?.id },
          },
        })
        const continuations = await prisma.presence.findMany({
          where: { entityId: body.id, fromEventId: untilEvent.id, locationId: unknownLocation?.id },
          orderBy: { id: 'asc' },
        })
        const continuation = continuations[0]
        if (!continuation) {
          await prisma.presence.create({
            data: {
              entityType: 'BODY',
              entityId: body.id,
              locationId: unknownLocation?.id || null,
              fromEventId: untilEvent.id,
              precision: 'UNKNOWN',
              certainty: 'LAST_KNOWN',
            },
          })
          presencesCreated += 1
        } else {
          if (
            continuation.untilEventId ||
            continuation.precision !== 'UNKNOWN' ||
            continuation.certainty !== 'LAST_KNOWN'
          ) {
            await prisma.presence.update({
              where: { id: continuation.id },
              data: { untilEventId: null, precision: 'UNKNOWN', certainty: 'LAST_KNOWN' },
            })
            presencesUpdated += 1
          }
        }
        // Moving the bound leaves the continuation from the previous run
        // stranded at the old event, so sweep every "position inconnue" record
        // that is not the one we just settled — matching only the current bound
        // is what let duplicates accumulate.
        const keptContinuation = await prisma.presence.findFirst({
          where: { entityId: body.id, fromEventId: untilEvent.id, locationId: unknownLocation?.id },
          orderBy: { id: 'asc' },
        })
        await prisma.presence.deleteMany({
          where: {
            entityId: body.id,
            locationId: unknownLocation?.id,
            id: { notIn: [existingPresence.id, keptContinuation?.id].filter(Boolean) },
          },
        })
      }
      positionsAlreadyCovered += 1
      continue
    }

    const requestedPresenceEvent = requestedPresenceChapter
      ? await ensureEvent(requestedPresenceChapter)
      : null
    const presenceStartEvent =
      requestedPresenceEvent ||
      (bodyFirstEvent.chapter.number > 358 ? bodyFirstEvent : boardingEvent)
    const existingOccupancy = await prisma.bodyOccupancy.findFirst({ where: { bodyId: body.id } })
    const existingBodyState = await prisma.bodyState.findFirst({ where: { bodyId: body.id } })
    const writes = [
      prisma.presence.create({
        data: {
          entityType: 'BODY',
          entityId: body.id,
          locationId: location.id,
          fromEventId: presenceStartEvent.id,
          untilEventId: untilEvent?.id || null,
          precision: precisionFor(location),
          certainty: /^(inconnu|suspect)$/i.test(catalogCharacter.shipLocation?.status || '')
            ? 'PROBABLE'
            : 'CONFIRMED',
        },
      }),
    ]
    if (!existingOccupancy) {
      writes.push(
        prisma.bodyOccupancy.create({
          data: {
            bodyId: body.id,
            consciousnessId: consciousness.id,
            fromEventId: bodyFirstEvent.id,
            occupancyType: 'ORIGINAL',
            certainty: 'CONFIRMED',
          },
        }),
      )
    }
    if (!existingBodyState) {
      writes.push(
        prisma.bodyState.create({
          data: {
            bodyId: body.id,
            state: isDeadStatus(catalogCharacter.shipLocation?.status) ? 'DEAD' : 'ALIVE',
            fromEventId: presenceStartEvent.id,
          },
        }),
      )
    }
    await prisma.$transaction(writes)
    presencesCreated += 1
  }

  // A catalogue entry may have been created during this run for a legacy seed
  // record (Vincent is the historical example), so perform one final merge.
  const duplicatesMergedAfterCreation = await mergeDuplicateCharacters(characters)

  console.log(
    JSON.stringify(
      {
        locationsSynced: locations.size,
        duplicatesMerged: duplicatesMerged + duplicatesMergedAfterCreation,
        generatedPassengerOrphansPruned,
        charactersCreated,
        bodiesCreated,
        presencesCreated,
        presencesUpdated,
        presencesEnded,
        trajectoriesSynced,
        mortalitiesReconciled,
        positionsAlreadyCovered,
        positionsWithoutLocation,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
