import type { PrismaClient } from '@prisma/client'
import type { VerifyWorld } from './coverage.js'

/** Everything `verifyMapCoverage` reads, in four queries. */
export async function loadVerifyWorld(prisma: PrismaClient): Promise<VerifyWorld> {
  const eventShape = {
    id: true,
    sequence: true,
    ordinal: true,
    occursOnBlackWhale: true,
    chapter: { select: { number: true } },
  } as const

  const [events, bodies, characters, presences, bodyStates] = await Promise.all([
    prisma.narrativeEvent.findMany({ select: eventShape }),
    prisma.body.findMany({
      where: { originalCharacterId: { not: null } },
      select: { id: true, originalCharacterId: true },
    }),
    prisma.character.findMany({ select: { id: true, slug: true } }),
    prisma.presence.findMany({
      select: {
        id: true,
        entityId: true,
        location: { select: { slug: true, type: true } },
        fromEvent: { select: eventShape },
        untilEvent: { select: eventShape },
      },
    }),
    prisma.bodyState.findMany({
      select: {
        bodyId: true,
        state: true,
        fromEvent: { select: { chapter: { select: { number: true } } } },
      },
    }),
  ])

  const slugById = new Map(characters.map((character) => [character.id, character.slug]))
  const bodyBySlug = new Map<string, { id: string }>()
  for (const body of bodies) {
    const slug = body.originalCharacterId ? slugById.get(body.originalCharacterId) : undefined
    if (slug) bodyBySlug.set(slug, { id: body.id })
  }

  return {
    events,
    bodyStates,
    bodyBySlug,
    presences: presences.map((presence) => ({
      id: presence.id,
      entityId: presence.entityId,
      locationSlug: presence.location?.slug ?? null,
      locationType: presence.location?.type ?? null,
      fromEvent: presence.fromEvent,
      untilEvent: presence.untilEvent,
    })),
  }
}
