import type { PrismaClient } from '@prisma/client'
import type { Character } from '@black-whale/contracts'
import { certaintyFor } from '../characters.js'
import { precisionFor } from '../rooms.js'
import { dropZeroWidthLegs, planTrajectory, type ResolvedLeg } from '../trajectory.js'
import type { EventIndex, EventRef } from './events.js'
import { UNKNOWN_LOCATION_SLUG, type LocationIndex } from './locations.js'
import { pickExistingPresence, type PresenceCandidate } from './presence-choice.js'

/** Counts the run reports, accumulated across characters. */
export interface PresenceTally {
  created: number
  updated: number
  ended: number
}

export const NO_CHANGES: PresenceTally = { created: 0, updated: 0, ended: 0 }

function add(left: PresenceTally, right: Partial<PresenceTally>): PresenceTally {
  return {
    created: left.created + (right.created ?? 0),
    updated: left.updated + (right.updated ?? 0),
    ended: left.ended + (right.ended ?? 0),
  }
}

export interface TrajectoryWrite {
  prisma: PrismaClient
  entry: Character
  world: { events: EventIndex; locations: LocationIndex; bodyId: string }
}

/**
 * A declared route, written leg by leg.
 *
 * Ids are deterministic so a rerun updates legs in place, and a trajectory that
 * loses a leg drops the stale presence instead of leaving it behind.
 */
export async function syncTrajectory({
  prisma,
  entry,
  world,
}: TrajectoryWrite): Promise<PresenceTally> {
  const planned = planTrajectory(entry.mapTrajectory ?? [])
  const resolved: ResolvedLeg[] = []

  for (const leg of planned) {
    const location = world.locations.get(leg.location)
    if (!location) throw new Error(`${entry.id} : lieu de trajet inconnu « ${leg.location} »`)

    const fromEvent = await world.events.resolve(leg.from)
    if (!fromEvent) throw new Error(`${entry.id} : début de trajet inutilisable « ${leg.from} »`)

    // An inclusive bound closes on the *next* event: the catalogue's
    // `untilChapterId` means "still there through this one".
    const namedEnd = leg.until ? await world.events.resolve(leg.until.chapterId) : null
    const untilEvent = leg.until?.exclusive ? await world.events.after(namedEnd) : namedEnd

    resolved.push({
      index: leg.index,
      locationId: location.id,
      locationType: location.type,
      fromEventId: fromEvent.id,
      untilEventId: untilEvent?.id ?? null,
      certainty: leg.certainty,
    })
  }

  const kept = dropZeroWidthLegs(resolved)
  const keptIds: string[] = []
  let tally = NO_CHANGES

  for (const leg of kept) {
    const id = `trajectory-${entry.id}-${leg.index}`
    const data = {
      entityType: 'BODY' as const,
      entityId: world.bodyId,
      locationId: leg.locationId,
      fromEventId: leg.fromEventId,
      untilEventId: leg.untilEventId,
      precision: precisionFor(leg.locationType),
      certainty: leg.certainty,
    }
    const existing = await prisma.presence.findUnique({ where: { id }, select: { id: true } })
    await prisma.presence.upsert({ where: { id }, update: data, create: { id, ...data } })
    tally = add(tally, existing ? { updated: 1 } : { created: 1 })
    keptIds.push(id)
  }

  await prisma.presence.deleteMany({
    where: { entityId: world.bodyId, id: { notIn: keptIds } },
  })
  return tally
}

async function loadCandidates(prisma: PrismaClient, bodyId: string): Promise<PresenceCandidate[]> {
  const rows = await prisma.presence.findMany({
    where: { entityId: bodyId },
    select: {
      id: true,
      locationId: true,
      fromEventId: true,
      untilEventId: true,
      precision: true,
      certainty: true,
      location: { select: { type: true } },
      fromEvent: { select: { sequence: true, chapter: { select: { number: true } } } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    locationId: row.locationId,
    fromEventId: row.fromEventId,
    untilEventId: row.untilEventId,
    precision: row.precision,
    certainty: row.certainty,
    locationType: row.location?.type ?? null,
    from: { chapter: row.fromEvent.chapter.number, sequence: row.fromEvent.sequence },
  }))
}

/** Where the catalogue's single position starts and stops, as real events. */
export interface PositionBounds {
  /** The declared opening event, and the chapter that named it. */
  start: { event: EventRef; chapter: number } | null
  /** Opening used when the body holds no presence yet. */
  fallbackStart: EventRef
  /** The last chapter the body is still on the map, if anything closes it. */
  lastPresentChapter: number | null
  /** First event the body is no longer drawn at, or null while it stays. */
  until: EventRef | null
  /** True when the body leaves for good rather than merely going unreported. */
  leaves: boolean
}

export interface SinglePosition {
  prisma: PrismaClient
  entry: Character
  world: {
    locations: LocationIndex
    bodyId: string
    location: { id: string; type: string }
    bounds: PositionBounds
  }
}

/**
 * A body whose position canon stops reporting stays aboard, at an explicit
 * "position inconnue", rather than vanishing from the map.
 *
 * The sweep at the end is not decoration: moving the closing bound leaves the
 * continuation from the previous run stranded at the old event, and matching
 * only the current bound is what let duplicates accumulate — one passenger
 * standing in four unknown positions at once.
 */
async function settleContinuation({
  prisma,
  world,
  keep,
}: {
  prisma: PrismaClient
  world: SinglePosition['world']
  keep: { presenceId: string; untilEvent: EventRef }
}): Promise<Partial<PresenceTally>> {
  const unknown = world.locations.unknown
  const { presenceId, untilEvent } = keep

  // A zero-width record at the new bound is a leftover, unless it is the
  // continuation itself.
  await prisma.presence.deleteMany({
    where: {
      entityId: world.bodyId,
      id: { not: presenceId },
      fromEventId: untilEvent.id,
      untilEventId: untilEvent.id,
      locationId: { not: unknown?.id },
    },
  })

  const existing = await prisma.presence.findFirst({
    where: { entityId: world.bodyId, fromEventId: untilEvent.id, locationId: unknown?.id },
    orderBy: { id: 'asc' },
  })

  let tally: Partial<PresenceTally> = {}
  if (!existing) {
    const created = await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: world.bodyId,
        locationId: unknown?.id ?? null,
        fromEventId: untilEvent.id,
        precision: 'UNKNOWN',
        certainty: 'LAST_KNOWN',
      },
      select: { id: true },
    })
    tally = { created: 1 }
    await sweepUnknown({ prisma, world, keptIds: [presenceId, created.id] })
    return tally
  }

  if (
    existing.untilEventId ||
    existing.precision !== 'UNKNOWN' ||
    existing.certainty !== 'LAST_KNOWN'
  ) {
    await prisma.presence.update({
      where: { id: existing.id },
      data: { untilEventId: null, precision: 'UNKNOWN', certainty: 'LAST_KNOWN' },
    })
    tally = { updated: 1 }
  }
  await sweepUnknown({ prisma, world, keptIds: [presenceId, existing.id] })
  return tally
}

/** Every other "position inconnue" this body accumulated, dropped. */
async function sweepUnknown({
  prisma,
  world,
  keptIds,
}: {
  prisma: PrismaClient
  world: SinglePosition['world']
  keptIds: readonly string[]
}): Promise<void> {
  const unknown = world.locations.get(UNKNOWN_LOCATION_SLUG)
  if (!unknown) return
  await prisma.presence.deleteMany({
    where: { entityId: world.bodyId, locationId: unknown.id, id: { notIn: [...keptIds] } },
  })
}

/**
 * Reconcile the one position `shipLocation` describes.
 *
 * The catalogue owns the room, the certainty and the closing bound; which
 * existing row holds them is `pickExistingPresence`'s decision.
 */
export async function reconcileSinglePosition({
  prisma,
  entry,
  world,
}: SinglePosition): Promise<PresenceTally> {
  const { bounds } = world
  const candidates = await loadCandidates(prisma, world.bodyId)
  const existing = pickExistingPresence(candidates, {
    fromChapter: bounds.start?.chapter ?? null,
    untilChapter: bounds.lastPresentChapter,
  })

  const precision = precisionFor(world.location.type)
  const certainty = certaintyFor(entry)
  const replace = entry.replaceMapPresenceHistory === true

  if (!existing) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: world.bodyId,
        locationId: world.location.id,
        fromEventId: (bounds.start?.event ?? bounds.fallbackStart).id,
        untilEventId: bounds.until?.id ?? null,
        precision,
        certainty,
      },
    })
    return { created: 1, updated: 0, ended: 0 }
  }

  let tally = NO_CHANGES
  const movesStart = Boolean(bounds.start && bounds.start.event.id !== existing.fromEventId)
  const needsUpdate =
    existing.locationId !== world.location.id ||
    movesStart ||
    (replace && existing.untilEventId !== null) ||
    existing.precision !== precision ||
    existing.certainty !== certainty

  if (needsUpdate) {
    await prisma.presence.update({
      where: { id: existing.id },
      data: {
        locationId: world.location.id,
        ...(bounds.start ? { fromEventId: bounds.start.event.id } : {}),
        ...(replace ? { untilEventId: null } : {}),
        precision,
        certainty,
      },
    })
    tally = add(tally, { updated: 1 })
  }

  // The catalogue owns the whole history for these entries, so anything else
  // the body still holds predates the correction.
  if (replace) {
    await prisma.presence.deleteMany({
      where: { entityId: world.bodyId, id: { not: existing.id } },
    })
  }

  const until = bounds.until
  if (!until) return tally

  if (existing.untilEventId !== until.id) {
    await prisma.presence.update({ where: { id: existing.id }, data: { untilEventId: until.id } })
    tally = add(tally, { ended: 1 })
  }

  if (bounds.leaves) {
    // Whoever leaves the map for good keeps exactly one record, closed at the
    // end. Anything else is a last-known continuation written before the death
    // was known, and it would put a corpse back on deck.
    await prisma.presence.deleteMany({
      where: { entityId: world.bodyId, id: { not: existing.id } },
    })
    return tally
  }

  return add(
    tally,
    await settleContinuation({
      prisma,
      world,
      keep: { presenceId: existing.id, untilEvent: until },
    }),
  )
}
