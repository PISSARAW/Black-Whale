import type { PrismaClient } from '@prisma/client'
import type { Character } from '@black-whale/contracts'
import { isDeadStatus, modelingLevel, narrativeImportance } from '../characters.js'
import type { EventRef } from './events.js'

/**
 * The identity records a position hangs from.
 *
 * A Presence points at a Body, not at a Character: the arc separates the two —
 * Halkenburg's consciousness leaves his body and drives Balsamilco's — so every
 * catalogue entry needs a body and a consciousness before the map can say where
 * anything is.
 */

export interface CharacterRecord {
  id: string
  slug: string
  canonicalName: string
  originalBody: { id: string } | null
  originalConsciousness: { id: string } | null
  firstVisibleEvent: EventRef | null
}

const RECORD_SELECT = {
  id: true,
  slug: true,
  canonicalName: true,
  originalBody: { select: { id: true } },
  originalConsciousness: { select: { id: true } },
  firstVisibleEvent: {
    select: { id: true, sequence: true, chapter: { select: { number: true } } },
  },
} as const

export async function loadCharacterRecords(prisma: PrismaClient): Promise<CharacterRecord[]> {
  return prisma.character.findMany({ select: RECORD_SELECT })
}

export interface WriteCharacter {
  prisma: PrismaClient
  entry: Character
  firstEvent: EventRef
}

/** The catalogue's fields, written whether the row exists or not. */
export async function upsertCharacter({
  prisma,
  entry,
  firstEvent,
}: WriteCharacter): Promise<CharacterRecord> {
  const shape = {
    canonicalName: entry.canonicalName,
    aliases: entry.aliases ?? [],
    description: entry.description ?? null,
    narrativeImportance: narrativeImportance(entry.canonStatus),
    modelingLevel: modelingLevel(entry.shipLocation?.tier),
    firstVisibleEventId: firstEvent.id,
  }
  return prisma.character.upsert({
    where: { slug: entry.id },
    update: shape,
    create: { ...shape, slug: entry.id },
    select: RECORD_SELECT,
  })
}

export interface Identity {
  bodyId: string
  consciousnessId: string
  /** The event the body's own records start at, which is not always the entry's. */
  firstEvent: EventRef
}

export interface EnsureIdentity {
  prisma: PrismaClient
  owner: CharacterRecord
  fallbackEvent: EventRef
}

/**
 * The body and consciousness a catalogue entry projects onto.
 *
 * `owner` is not always the entry itself: when two rows share a canonical name
 * and only one holds a body, the position belongs on that body — otherwise a
 * rename would strand a passenger on a fresh, empty identity while the old one
 * kept every presence ever written.
 */
export async function ensureIdentity({
  prisma,
  owner,
  fallbackEvent,
}: EnsureIdentity): Promise<Identity> {
  const firstEvent = owner.firstVisibleEvent ?? fallbackEvent

  const body =
    owner.originalBody ??
    (await prisma.body.create({
      data: {
        originalCharacterId: owner.id,
        label: `${owner.canonicalName} Body`,
        bodyType: 'ORIGINAL',
        firstVisibleEventId: firstEvent.id,
      },
      select: { id: true },
    }))
  owner.originalBody = body

  const consciousness =
    owner.originalConsciousness ??
    (await prisma.consciousness.create({
      data: {
        originCharacterId: owner.id,
        label: `${owner.canonicalName} Consciousness`,
        consciousnessType: 'ORIGINAL',
        firstVisibleEventId: firstEvent.id,
      },
      select: { id: true },
    }))
  owner.originalConsciousness = consciousness

  return { bodyId: body.id, consciousnessId: consciousness.id, firstEvent }
}

export interface SeedIdentityHistory {
  prisma: PrismaClient
  identity: Identity
  entry: Character
}

/**
 * The opening occupancy and body state, written once and never rewritten.
 *
 * Whoever the consciousness ends up in later is the identity backfill's
 * business; what this guarantees is that a body is never on the map without a
 * state saying whether it is alive.
 */
export async function seedIdentityHistory({
  prisma,
  identity,
  entry,
}: SeedIdentityHistory): Promise<void> {
  const occupancy = await prisma.bodyOccupancy.findFirst({
    where: {
      bodyId: identity.bodyId,
      consciousnessId: identity.consciousnessId,
      occupancyType: 'ORIGINAL',
    },
    select: { id: true },
  })
  if (!occupancy) {
    await prisma.bodyOccupancy.create({
      data: {
        bodyId: identity.bodyId,
        consciousnessId: identity.consciousnessId,
        fromEventId: identity.firstEvent.id,
        occupancyType: 'ORIGINAL',
        certainty: 'CONFIRMED',
      },
    })
  }

  const state = await prisma.bodyState.findFirst({
    where: { bodyId: identity.bodyId },
    select: { id: true },
  })
  if (!state) {
    await prisma.bodyState.create({
      data: {
        bodyId: identity.bodyId,
        state: isDeadStatus(entry.shipLocation?.status) ? 'DEAD' : 'ALIVE',
        fromEventId: identity.firstEvent.id,
      },
    })
  }
}

export interface RebaseHistory {
  prisma: PrismaClient
  identity: Identity
  event: EventRef
}

/**
 * Move a body's whole history to a new opening event.
 *
 * `replaceMapPresenceHistory` is how the catalogue says a previous run dated an
 * identity wrongly — usually because the entry was merged out of a seed record
 * that boarded at 358. Two entries carry it.
 */
export async function rebaseIdentityHistory({
  prisma,
  identity,
  event,
}: RebaseHistory): Promise<void> {
  await prisma.$transaction([
    prisma.body.update({ where: { id: identity.bodyId }, data: { firstVisibleEventId: event.id } }),
    prisma.bodyState.updateMany({
      where: { bodyId: identity.bodyId },
      data: { fromEventId: event.id },
    }),
    prisma.bodyOccupancy.updateMany({
      where: { bodyId: identity.bodyId },
      data: { fromEventId: event.id },
    }),
    prisma.consciousness.update({
      where: { id: identity.consciousnessId },
      data: { firstVisibleEventId: event.id },
    }),
  ])
}

export interface ReconcileMortality {
  prisma: PrismaClient
  bodyId: string
  bounds: { first: EventRef; death: EventRef }
}

/**
 * A body that dies holds one ALIVE record up to the death and one DEAD record
 * from it. The catalogue owns the date, so both bounds are rewritten on every
 * run rather than only filled in when missing.
 */
export async function reconcileMortality({
  prisma,
  bodyId,
  bounds,
}: ReconcileMortality): Promise<number> {
  const states = await prisma.bodyState.findMany({ where: { bodyId }, orderBy: { id: 'asc' } })
  const alive = states.find((state) => state.state === 'ALIVE')
  const dead = states.find((state) => state.state === 'DEAD')
  let changed = 0

  if (!alive) {
    await prisma.bodyState.create({
      data: {
        bodyId,
        state: 'ALIVE',
        fromEventId: bounds.first.id,
        untilEventId: bounds.death.id,
      },
    })
    changed += 1
  } else if (alive.fromEventId !== bounds.first.id || alive.untilEventId !== bounds.death.id) {
    await prisma.bodyState.update({
      where: { id: alive.id },
      data: { fromEventId: bounds.first.id, untilEventId: bounds.death.id },
    })
    changed += 1
  }

  if (!dead) {
    await prisma.bodyState.create({
      data: { bodyId, state: 'DEAD', fromEventId: bounds.death.id },
    })
    changed += 1
  } else if (dead.fromEventId !== bounds.death.id || dead.untilEventId !== null) {
    await prisma.bodyState.update({
      where: { id: dead.id },
      data: { fromEventId: bounds.death.id, untilEventId: null },
    })
    changed += 1
  }

  return changed
}
