import { prisma } from '$lib/server/db'
import { timeline } from '$lib/server/nen'
import type { PageServerLoad } from './$types'

const STRATEGY_CHAPTER = 359

type OrderedEvent = {
  ordinal: number | null
  sequence: number
  chapter: { number: number }
}

function comparePosition(left: OrderedEvent, right: OrderedEvent): number {
  if (left.ordinal != null && right.ordinal != null) return left.ordinal - right.ordinal
  return left.chapter.number - right.chapter.number || left.sequence - right.sequence
}

export const load: PageServerLoad = async () => {
  try {
    const cutoff = await prisma.narrativeEvent.findFirst({
      where: {
        occursOnBlackWhale: true,
        ordinal: { not: null },
        chapter: { number: { lte: STRATEGY_CHAPTER } },
      },
      orderBy: { ordinal: 'desc' },
      include: { chapter: { select: { number: true } } },
    })
    if (!cutoff)
      throw new Error(`No canonical event is available through chapter ${STRATEGY_CHAPTER}`)

    const [baseState, factionRows, locationRows] = await Promise.all([
      timeline.getKernelState({ eventId: cutoff.id }),
      prisma.faction.findMany({
        orderBy: { name: 'asc' },
        include: {
          members: {
            include: {
              character: { select: { id: true, canonicalName: true } },
              fromEvent: {
                select: { ordinal: true, sequence: true, chapter: { select: { number: true } } },
              },
              untilEvent: {
                select: { ordinal: true, sequence: true, chapter: { select: { number: true } } },
              },
            },
          },
        },
      }),
      prisma.location.findMany({ orderBy: { name: 'asc' } }),
    ])

    const cutoffPosition: OrderedEvent = cutoff
    const factions = factionRows
      .map((faction) => ({
        id: faction.id,
        name: faction.name,
        members: faction.members
          .filter(
            (member) =>
              comparePosition(member.fromEvent, cutoffPosition) <= 0 &&
              (!member.untilEvent || comparePosition(member.untilEvent, cutoffPosition) > 0) &&
              Boolean(baseState.entities[member.character.id]),
          )
          .map((member) => ({
            role: member.role,
            character: member.character,
          })),
      }))
      .filter((faction) => faction.members.length > 0)

    const locations = locationRows
      .filter(
        (location) =>
          location.type !== 'SHIP' && baseState.entities[location.id]?.kind === 'LOCATION',
      )
      .map((location) => ({
        id: location.id,
        slug: location.slug,
        name: location.name,
        parentLocationId: location.parentLocationId ?? undefined,
        type: location.type,
        mapElementId: location.mapElementId ?? undefined,
        firstVisibleEventId: location.firstVisibleEventId,
      }))

    return {
      error: null,
      cutoff: { chapterNumber: cutoff.chapter.number, eventId: cutoff.id },
      baseState,
      factions,
      locations,
    }
  } catch (error) {
    console.error('[strategy]', error)
    return {
      error: 'Le scénario stratégique n’a pas pu être initialisé.',
      cutoff: null,
      baseState: null,
      factions: [],
      locations: [],
    }
  }
}
