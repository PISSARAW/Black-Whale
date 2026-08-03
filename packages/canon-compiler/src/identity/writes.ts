import type {
  BodyStateType,
  Certainty,
  ConsciousnessStateType,
  OccupancyType,
  PresenceCertainty,
  PresencePrecision,
  PrismaClient,
} from '@prisma/client'

/**
 * The writes the identity episodes are made of.
 *
 * Every one of them is keyed by a hand-chosen id — `occupancy-shikaku-in-sumidori`
 * — so a rerun updates the same row rather than laying a second copy of the
 * same event beside it. That is what makes the pass idempotent, and the deploy
 * replays it on every release.
 */

export interface CharacterIdentity {
  id: string
  slug: string
  originalBody: { id: string }
  originalConsciousness: { id: string }
}

export interface EventRow {
  id: string
  title: string
}

export interface LocationRow {
  id: string
  slug: string
}

export async function requiredCharacter(
  prisma: PrismaClient,
  slug: string,
): Promise<CharacterIdentity> {
  const character = await prisma.character.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      originalBody: { select: { id: true } },
      originalConsciousness: { select: { id: true } },
    },
  })
  if (!character?.originalBody || !character.originalConsciousness) {
    throw new Error(`Identité incomplète pour ${slug}`)
  }
  return {
    ...character,
    originalBody: character.originalBody,
    originalConsciousness: character.originalConsciousness,
  }
}

export async function requiredEvent(prisma: PrismaClient, title: string): Promise<EventRow> {
  const event = await prisma.narrativeEvent.findFirst({
    where: { title },
    select: { id: true, title: true },
  })
  if (!event) throw new Error(`Événement absent : ${title}`)
  return event
}

export async function requiredLocation(prisma: PrismaClient, slug: string): Promise<LocationRow> {
  const location = await prisma.location.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  })
  if (!location) throw new Error(`Lieu absent : ${slug}`)
  return location
}

/**
 * Close the occupancy that ties a character to their own body.
 *
 * Called on both sides of a swap: the one leaving and the one arriving each
 * stop occupying what they were born in.
 */
export async function endOriginalOccupancy({
  prisma,
  character,
  untilEventId,
}: {
  prisma: PrismaClient
  character: CharacterIdentity
  untilEventId: string
}): Promise<void> {
  const occupancy = await prisma.bodyOccupancy.findFirst({
    where: {
      bodyId: character.originalBody.id,
      consciousnessId: character.originalConsciousness.id,
      occupancyType: 'ORIGINAL',
    },
    orderBy: { id: 'asc' },
    select: { id: true },
  })
  if (!occupancy) throw new Error(`Occupation d'origine absente pour ${character.slug}`)
  await prisma.bodyOccupancy.update({ where: { id: occupancy.id }, data: { untilEventId } })
}

export interface OccupancyWrite {
  id: string
  bodyId: string
  consciousnessId: string
  fromEventId: string
  occupancyType?: OccupancyType
  certainty?: Certainty
}

export async function upsertOccupancy(
  prisma: PrismaClient,
  { id, occupancyType = 'TRANSFERRED', certainty = 'CONFIRMED', ...rest }: OccupancyWrite,
): Promise<void> {
  const shape = { ...rest, occupancyType, certainty }
  await prisma.bodyOccupancy.upsert({
    where: { id },
    update: { ...shape, untilEventId: null },
    create: { id, ...shape },
  })
}

export interface StateWrite {
  id: string
  fromEventId: string
}

export async function upsertConsciousnessState(
  prisma: PrismaClient,
  write: StateWrite & { consciousnessId: string; state: ConsciousnessStateType },
): Promise<void> {
  const { id, ...shape } = write
  await prisma.consciousnessState.upsert({
    where: { id },
    update: { ...shape, untilEventId: null },
    create: { id, ...shape },
  })
}

export async function upsertBodyState(
  prisma: PrismaClient,
  write: StateWrite & { bodyId: string; state: BodyStateType },
): Promise<void> {
  const { id, ...shape } = write
  await prisma.bodyState.upsert({
    where: { id },
    update: { ...shape, untilEventId: null },
    create: { id, ...shape },
  })
}

/** Close every ALIVE record a body holds, which is how a death is recorded. */
export async function endAliveState({
  prisma,
  bodyId,
  untilEventId,
}: {
  prisma: PrismaClient
  bodyId: string
  untilEventId: string
}): Promise<void> {
  await prisma.bodyState.updateMany({
    where: { bodyId, state: 'ALIVE' },
    data: { untilEventId },
  })
}

export interface PresenceWrite {
  id: string
  bodyId: string
  locationId: string
  fromEventId: string
  untilEventId?: string | null
  precision: PresencePrecision
  certainty: PresenceCertainty
}

export async function upsertPresence(
  prisma: PrismaClient,
  { id, bodyId, untilEventId = null, ...rest }: PresenceWrite,
): Promise<void> {
  const shape = { ...rest, entityType: 'BODY' as const, entityId: bodyId, untilEventId }
  await prisma.presence.upsert({ where: { id }, update: shape, create: { id, ...shape } })
}

/**
 * Whether a presence still runs past the moment a body changes hands.
 *
 * Capping every earlier presence at that moment assumes they all reach it. Once
 * the catalogue can route a managed character through several rooms, some close
 * earlier — and rewriting their end to the later event resurrects the body in a
 * room it had left, overlapping the leg that followed.
 */
export function closesAfter(
  presence: { untilEventId: string | null },
  cutEventId: string,
  ordinals: ReadonlyMap<string, number>,
): boolean {
  if (!presence.untilEventId) return true
  const end = ordinals.get(presence.untilEventId) ?? Number.MAX_SAFE_INTEGER
  const cut = ordinals.get(cutEventId) ?? Number.MAX_SAFE_INTEGER
  return end > cut
}
