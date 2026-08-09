import { prisma } from '$lib/server/db'
import { timeline } from '$lib/server/nen'
import { listStrategyScenarios, requireStrategyScenario } from '$lib/strategy/scenario/registry'
import { STRATEGY_ABILITY_IDS_BY_CHARACTER } from '$lib/strategy/hatsu'
import { messagesFor } from '$lib/i18n'
import { parsePathname } from '$lib/i18n/config'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const locale = parsePathname(url.pathname).locale
  const scenarios = listStrategyScenarios()
  try {
    const scenario = requireStrategyScenario(url.searchParams.get('scenario') ?? undefined)
    const cutoff = await prisma.narrativeEvent.findFirst({
      where: {
        occursOnBlackWhale: true,
        ordinal: { not: null },
        chapter: { number: { lte: scenario.chapterNumber } },
      },
      orderBy: { ordinal: 'desc' },
      include: { chapter: { select: { number: true } } },
    })
    if (!cutoff)
      throw new Error(`No canonical event is available through chapter ${scenario.chapterNumber}`)

    const requiredCharacterIds = scenario.playableFactions.flatMap(
      (entry) => entry.requiredCharacterIds,
    )
    const [kernelState, factionRows, locationRows, characterRows] = await Promise.all([
      timeline.getKernelState({ eventId: cutoff.id }),
      prisma.faction.findMany({
        where: { id: { in: scenario.playableFactions.map((entry) => entry.factionId) } },
        select: { id: true, name: true },
      }),
      prisma.location.findMany({ orderBy: { name: 'asc' } }),
      prisma.character.findMany({
        where: { slug: { in: requiredCharacterIds } },
        select: { slug: true, canonicalName: true },
      }),
    ])

    const baseState = structuredClone(kernelState)
    const characterById = new Map(characterRows.map((character) => [character.slug, character]))
    const factionById = new Map(factionRows.map((faction) => [faction.id, faction]))
    const locationById = new Map(locationRows.map((location) => [location.slug, location]))
    const locationSlugById = new Map(locationRows.map((location) => [location.id, location.slug]))
    const missingCharacterIds = requiredCharacterIds.filter((id) => !characterById.has(id))
    if (missingCharacterIds.length > 0)
      throw new Error(`Missing Strategy characters: ${missingCharacterIds.join(', ')}`)
    for (const locationId of scenario.locationIds) {
      const location = locationById.get(locationId)
      if (location && !baseState.entities[locationId])
        baseState.entities[locationId] = { id: locationId, kind: 'LOCATION', label: location.name }
    }
    const factions = scenario.playableFactions.map((entry) => {
      const members = entry.requiredCharacterIds.flatMap((characterId) => {
        const character = characterById.get(characterId)
        if (!character) return []
        if (!baseState.entities[characterId])
          baseState.entities[characterId] = {
            id: characterId,
            kind: 'CHARACTER',
            label: character.canonicalName,
          }
        baseState.abilitiesByOwner[characterId] = [
          ...new Set([
            ...(baseState.abilitiesByOwner[characterId] ?? []),
            ...(STRATEGY_ABILITY_IDS_BY_CHARACTER[characterId] ?? []),
          ]),
        ]
        if (!baseState.presences[characterId])
          baseState.presences[characterId] = {
            entity: { id: characterId, kind: 'CHARACTER' },
            locationId: entry.initialLocationId,
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
            observedAtEventId: cutoff.id,
          }
        return [
          {
            role: 'MEMBER',
            character: { id: character.slug, canonicalName: character.canonicalName },
          },
        ]
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
          location.type !== 'SHIP' && baseState.entities[location.slug]?.kind === 'LOCATION',
      )
      .map((location) => ({
        id: location.slug,
        slug: location.slug,
        name: location.name,
        parentLocationId: location.parentLocationId
          ? locationSlugById.get(location.parentLocationId)
          : undefined,
        type: location.type,
        mapElementId: location.mapElementId ?? undefined,
        firstVisibleEventId: location.firstVisibleEventId,
      }))

    return {
      error: null,
      scenario,
      scenarios,
      cutoff: { chapterNumber: cutoff.chapter.number, eventId: cutoff.id },
      baseState,
      factions,
      locations,
    }
  } catch (error) {
    console.error('[strategy]', error)
    return {
      error: messagesFor(locale).strategy.errors.loadFailed,
      scenario: null,
      scenarios,
      cutoff: null,
      baseState: null,
      factions: [],
      locations: [],
    }
  }
}
