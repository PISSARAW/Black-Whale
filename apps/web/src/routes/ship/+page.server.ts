import { prisma } from '$lib/server/db'
import type { CatalogCharacter } from '$lib/server/data-files'
import { buildPerspective } from '$lib/server/perspectives'
import { readSpoilerProfile } from '$lib/server/spoiler'
import { trimWorldStateForMap } from '$lib/server/mapPayload'
import {
  activeFactionTypesAt,
  filterPresencesByBodies,
  readLegacySequence,
  resolveVisibleBodyIds,
  selectEvent,
  TimelineEngine,
} from '@black-whale/timeline-engine'
import {
  beyondLineageStatusFor,
  buildCatalogIndex,
  buildHatsuIndex,
  hatsuIdsFor,
  hatsuNamesFor,
  resolveFactionTags,
} from '$lib/roster'
import characterCatalog from '../../../../../data/characters/characters.json'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { PUBLIC_FEATURES } from '$lib/config/features'

const catalogIndex = buildCatalogIndex(characterCatalog as CatalogCharacter[])
const hatsuIndex = buildHatsuIndex(abilityCatalog)

export const load: PageServerLoad = async ({ url, cookies }) => {
  const timelineEngine = new TimelineEngine(prisma)
  const requestedPerspectiveId = PUBLIC_FEATURES.perspectives
    ? url.searchParams.get('perspective') || 'reader'
    : 'reader'
  const followMode = url.searchParams.get('follow') || 'consciousness'
  const requestedEventId = url.searchParams.get('eventId')
  const legacySequence = readLegacySequence(url.searchParams.get('sequence'))

  const spoilerProfile = readSpoilerProfile(cookies)

  // Sequence is local to a chapter. Always order and select through the unique
  // event id, using chapter number as the primary chronological key.
  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(spoilerProfile ? { chapter: { number: { lte: spoilerProfile.maxChapter } } } : {}),
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: true },
  })

  const { event: selectedEvent, index: selectedEventIndex } = selectEvent(events, {
    eventId: requestedEventId,
    sequence: legacySequence,
  })
  const sequence = selectedEvent?.sequence ?? 0

  const rawWorldState = selectedEvent
    ? await timelineEngine.getWorldState({ eventId: selectedEvent.id })
    : {
        characters: [],
        bodies: [],
        consciousnesses: [],
        presences: [],
        occupancies: [],
        appearances: [],
        bodyStates: {},
      }
  const nextChapterNumber = events
    .map((event) => event.chapter.number)
    .filter(
      (chapterNumber) => chapterNumber > (selectedEvent?.chapter.number ?? Number.MAX_SAFE_INTEGER),
    )
    .sort((left, right) => left - right)[0]
  const nextChapterEvent =
    nextChapterNumber === undefined
      ? null
      : [...events].reverse().find((event) => event.chapter.number === nextChapterNumber) || null
  const nextChapterWorldState = nextChapterEvent
    ? await timelineEngine.getWorldState({ eventId: nextChapterEvent.id })
    : null

  // Filter world state characters by spoiler
  let visibleCharacters = rawWorldState.characters
  if (spoilerProfile) {
    const allowedCharacters = await prisma.character.findMany({
      where: { firstVisibleEvent: { chapter: { number: { lte: spoilerProfile.maxChapter } } } },
      select: { id: true },
    })
    const allowedCharacterIds = new Set(allowedCharacters.map((character) => character.id))
    visibleCharacters = rawWorldState.characters.filter((character: any) =>
      allowedCharacterIds.has(character.id),
    )
  }

  const visibleCharacterIdsForAffiliations = visibleCharacters.map((character: any) => character.id)
  const memberships =
    selectedEvent && visibleCharacterIdsForAffiliations.length
      ? await prisma.affiliationMembership.findMany({
          where: {
            characterId: { in: visibleCharacterIdsForAffiliations },
            status: 'ACTIVE',
          },
          include: {
            faction: true,
            fromEvent: { include: { chapter: true } },
            untilEvent: { include: { chapter: true } },
          },
        })
      : []
  const activeFactionTypesByCharacter = activeFactionTypesAt(memberships, selectedEvent)
  visibleCharacters = visibleCharacters.map((character: any) => {
    // Absent rather than null when the reader is capped below the reveal: the
    // map filter reads this field, and an explicit null is still an answer.
    const beyondLineage = beyondLineageStatusFor(
      character,
      catalogIndex,
      spoilerProfile?.maxChapter,
    )
    return {
      ...character,
      factionTags: resolveFactionTags(
        character,
        activeFactionTypesByCharacter.get(character.id) || [],
        catalogIndex,
      ),
      hatsuNames: hatsuNamesFor(character, catalogIndex, hatsuIndex),
      hatsuIds: hatsuIdsFor(character, catalogIndex, hatsuIndex),
      ...(beyondLineage ? { beyondLineage } : {}),
    }
  })

  const perspectiveIsAvailable =
    requestedPerspectiveId === 'reader' ||
    visibleCharacters.some((character: any) => character.id === requestedPerspectiveId)
  if (!perspectiveIsAvailable) {
    const canonicalUrl = new URL(url)
    canonicalUrl.searchParams.set('perspective', 'reader')
    throw redirect(307, `${canonicalUrl.pathname}${canonicalUrl.search}`)
  }
  const selectedPerspectiveId = requestedPerspectiveId

  // Presences reference bodies, not characters. Resolve the body owner before
  // applying the spoiler filter so valid character positions are not discarded.
  const visibleCharacterIds = new Set(visibleCharacters.map((character: any) => character.id))
  const visibleBodyIds = resolveVisibleBodyIds(rawWorldState, visibleCharacterIds)
  const visiblePresences = filterPresencesByBodies(rawWorldState.presences, visibleBodyIds)

  // Load locations to match presences to actual SVGs
  const visibleLocations = await prisma.location.findMany({
    where: spoilerProfile
      ? { firstVisibleEvent: { chapter: { number: { lte: spoilerProfile.maxChapter } } } }
      : undefined,
  })
  let perspective: any = null

  if (selectedEvent?.id && selectedPerspectiveId !== 'reader') {
    try {
      perspective = await buildPerspective(
        selectedPerspectiveId,
        selectedEvent.id,
        spoilerProfile?.maxChapter,
      )
    } catch (error) {
      console.error('Failed to build perspective for ship page', error)
    }
  }

  return {
    sequence,
    selectedEventIndex,
    events,
    selectedPerspectiveId,
    followMode,
    selectedEventId: selectedEvent?.id || null,
    perspective,
    // Trimmed on the way out, not on the way in: everything above still reads
    // the joins the engine attached. What crosses to the browser is only what
    // the map reads there.
    worldState: trimWorldStateForMap({
      characters: visibleCharacters,
      bodies: rawWorldState.bodies,
      consciousnesses: rawWorldState.consciousnesses,
      presences: visiblePresences,
      occupancies: rawWorldState.occupancies,
      appearances: rawWorldState.appearances,
      bodyStates: rawWorldState.bodyStates,
      locations: visibleLocations,
    }),
    nextChapterState: nextChapterWorldState
      ? trimWorldStateForMap({
          chapterNumber: nextChapterNumber,
          characters: nextChapterWorldState.characters.map((character: any) => {
            const beyondLineage = beyondLineageStatusFor(
              character,
              catalogIndex,
              spoilerProfile?.maxChapter,
            )
            return {
              ...character,
              hatsuNames: hatsuNamesFor(character, catalogIndex, hatsuIndex),
              hatsuIds: hatsuIdsFor(character, catalogIndex, hatsuIndex),
              ...(beyondLineage ? { beyondLineage } : {}),
            }
          }),
          bodies: nextChapterWorldState.bodies,
          consciousnesses: nextChapterWorldState.consciousnesses,
          presences: nextChapterWorldState.presences,
          occupancies: nextChapterWorldState.occupancies,
          appearances: nextChapterWorldState.appearances,
          bodyStates: nextChapterWorldState.bodyStates,
          locations: visibleLocations,
        })
      : null,
    spoilerLimit: spoilerProfile?.maxChapter,
  }
}
