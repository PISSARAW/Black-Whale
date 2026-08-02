import { prisma } from '$lib/server/db'
import { timeline } from '$lib/server/nen'
import { ACTIVE_SCENARIO } from '$lib/strategy/scenario'
import type { PageServerLoad } from './$types'

const STRATEGY_CHAPTER = 359

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

    const requiredCharacterIds = ACTIVE_SCENARIO.playableFactions.flatMap(
      (entry) => entry.requiredCharacterIds,
    )
    const [kernelState, factionRows, locationRows, characterRows] = await Promise.all([
      timeline.getKernelState({ eventId: cutoff.id }),
      prisma.faction.findMany({
        where: { id: { in: ACTIVE_SCENARIO.playableFactions.map((entry) => entry.factionId) } },
        select: { id: true, name: true },
      }),
      prisma.location.findMany({ orderBy: { name: 'asc' } }),
      prisma.character.findMany({
        where: { id: { in: requiredCharacterIds } },
        select: { id: true, canonicalName: true },
      }),
    ])

    const baseState = structuredClone(kernelState)
    const characterById = new Map(characterRows.map((character) => [character.id, character]))
    const factionById = new Map(factionRows.map((faction) => [faction.id, faction]))
    const locationById = new Map(locationRows.map((location) => [location.id, location]))
    const missingCharacterIds = requiredCharacterIds.filter((id) => !characterById.has(id))
    if (missingCharacterIds.length > 0)
      throw new Error(`Missing Strategy characters: ${missingCharacterIds.join(', ')}`)
    for (const locationId of ACTIVE_SCENARIO.locationIds) {
      const location = locationById.get(locationId)
      if (location && !baseState.entities[locationId])
        baseState.entities[locationId] = { id: locationId, kind: 'LOCATION', label: location.name }
    }
    const factions = ACTIVE_SCENARIO.playableFactions.map((entry) => {
      const members = entry.requiredCharacterIds.flatMap((characterId) => {
        const character = characterById.get(characterId)
        if (!character) return []
        if (!baseState.entities[characterId])
          baseState.entities[characterId] = {
            id: characterId,
            kind: 'CHARACTER',
            label: character.canonicalName,
          }
        if (!baseState.presences[characterId])
          baseState.presences[characterId] = {
            entity: { id: characterId, kind: 'CHARACTER' },
            locationId: entry.initialLocationId,
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
            observedAtEventId: cutoff.id,
          }
        return [{ role: 'MEMBER', character }]
      })
      return {
        id: entry.factionId,
        name: factionById.get(entry.factionId)?.name ?? entry.factionId,
        members,
      }
    })

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
