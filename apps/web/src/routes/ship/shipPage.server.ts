import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { prisma } from '$lib/server/db'
import type { CatalogCharacter } from '$lib/server/data-files'
import { buildPerspective } from '$lib/server/perspectives'
import { readSpoilerProfile } from '$lib/server/spoiler'
import { trimWorldStateForMap, type TimelineEvent } from '$lib/server/mapPayload'
import { timeline } from '$lib/server/timeline'
import { applySpoilerFilters, type SpoilerFilteredWorld } from '$lib/server/spoilerWorld'
import {
  activeFactionTypesAt,
  readLegacySequence,
  selectEvent,
  type WorldSnapshot,
} from '@black-whale/canon-engine'
import {
  beyondLineageStatusFor,
  buildCatalogIndex,
  buildHatsuIndex,
  hatsuIdsFor,
  hatsuNamesFor,
  resolveFactionTags,
} from '$lib/roster'
import { PUBLIC_FEATURES } from '$lib/config/features'
import { log, describeError } from '$lib/server/log'
import { objectSnapshotsAt, type ImportantObject } from '$lib/importantObjects'
import type { BeyondLineageStatus } from '$lib/beyondLineage'
import { buildShipEventDelta } from './shipDelta'
import type { ShipCatalogData } from './shipData'
import characterCatalog from '../../../../../data/characters/characters.json'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import importantObjectCatalog from '../../../../../data/objects/objects.json'

const catalogIndex = buildCatalogIndex(characterCatalog as CatalogCharacter[])
const hatsuIndex = buildHatsuIndex(abilityCatalog)

type WorldCharacter = WorldSnapshot['characters'][number]
type VisibleCharacter = WorldCharacter & {
  factionTags?: string[]
  hatsuNames?: string[]
  hatsuIds?: string[]
  beyondLineage?: BeyondLineageStatus
}

const EMPTY_WORLD: WorldSnapshot = {
  atEventId: '',
  characters: [],
  bodies: [],
  consciousnesses: [],
  presences: [],
  occupancies: [],
  appearances: [],
  locations: [],
  activeAbilities: [],
  knownFacts: [],
  bodyStates: {},
}

function requestFrom(url: URL) {
  return {
    perspectiveId: PUBLIC_FEATURES.perspectives
      ? url.searchParams.get('perspective') || 'reader'
      : 'reader',
    followMode: url.searchParams.get('follow') || 'consciousness',
    eventId: url.searchParams.get('eventId'),
    trackingTarget: url.searchParams.get('target'),
    legacySequence: readLegacySequence(url.searchParams.get('sequence')),
  }
}

function nextChapter(events: TimelineEvent[], selected: TimelineEvent | null) {
  const number = events
    .map((event) => event.chapter.number)
    .filter((chapter) => chapter > (selected?.chapter.number ?? Number.MAX_SAFE_INTEGER))
    .sort((left, right) => left - right)[0]
  const event =
    number === undefined
      ? null
      : [...events].reverse().find((candidate) => candidate.chapter.number === number) || null
  return { number, event }
}

async function loadWorld(event: TimelineEvent | null) {
  return event ? timeline.getWorldState({ eventId: event.id }) : null
}

async function loadWorlds(
  selected: TimelineEvent | null,
  adjacent: TimelineEvent | null,
  chapter: TimelineEvent | null,
) {
  const currentPromise = loadWorld(selected)
  const adjacentPromise = loadWorld(adjacent)
  const chapterPromise = chapter?.id === adjacent?.id ? adjacentPromise : loadWorld(chapter)
  const [current, nextEvent, nextChapter] = await Promise.all([
    currentPromise,
    adjacentPromise,
    chapterPromise,
  ])
  return { current: current || EMPTY_WORLD, nextEvent, nextChapter }
}

async function allowedCharacterIds(maxChapter: number | undefined) {
  if (maxChapter === undefined) return null
  const rows = await prisma.character.findMany({
    where: { firstVisibleEvent: { chapter: { number: { lte: maxChapter } } } },
    select: { id: true },
  })
  return new Set(rows.map(({ id }) => id))
}

async function factionTypes(characters: VisibleCharacter[], event: TimelineEvent | null) {
  if (!event || !characters.length) return new Map<string, string[]>()
  const memberships = await prisma.affiliationMembership.findMany({
    where: { characterId: { in: characters.map(({ id }) => id) }, status: 'ACTIVE' },
    include: {
      faction: true,
      fromEvent: { include: { chapter: true } },
      untilEvent: { include: { chapter: true } },
    },
  })
  return activeFactionTypesAt(memberships, event)
}

function enrichCharacter(
  character: WorldCharacter,
  factions: Map<string, string[]>,
  maxChapter: number | undefined,
): VisibleCharacter {
  const beyondLineage = beyondLineageStatusFor(character, catalogIndex, maxChapter)
  return {
    ...character,
    factionTags: resolveFactionTags(character, factions.get(character.id) || [], catalogIndex),
    hatsuNames: hatsuNamesFor(character, catalogIndex, hatsuIndex),
    hatsuIds: hatsuIdsFor(character, catalogIndex, hatsuIndex),
    ...(beyondLineage ? { beyondLineage } : {}),
  }
}

function ensurePerspective(url: URL, requested: string, characters: VisibleCharacter[]) {
  if (requested === 'reader' || characters.some(({ id }) => id === requested)) return requested
  const canonicalUrl = new URL(url)
  canonicalUrl.searchParams.set('perspective', 'reader')
  throw redirect(307, `${canonicalUrl.pathname}${canonicalUrl.search}`)
}

interface TrackingOptions {
  requested: string | null
  perspectiveId: string
  characters: VisibleCharacter[]
  objects: ReturnType<typeof objectSnapshotsAt>
}

function trackingTarget(options: TrackingOptions) {
  const { requested, perspectiveId, characters, objects } = options
  if (requested?.startsWith('object:')) {
    if (objects.some(({ id }) => `object:${id}` === requested)) return requested
  }
  if (requested?.startsWith('character:')) {
    if (characters.some(({ id }) => `character:${id}` === requested)) return requested
  }
  return perspectiveId === 'reader' ? 'reader' : `character:${perspectiveId}`
}

async function perspectiveFor(id: string, eventId: string | undefined, maxChapter?: number) {
  if (!eventId || id === 'reader') return null
  try {
    return await buildPerspective(id, eventId, maxChapter)
  } catch (error) {
    log.error('Failed to build perspective for ship page', describeError(error))
    return null
  }
}

function currentPayload(world: SpoilerFilteredWorld, characters: VisibleCharacter[]) {
  return trimWorldStateForMap({
    characters,
    bodies: world.bodies,
    consciousnesses: world.consciousnesses,
    presences: world.presences,
    occupancies: world.occupancies,
    appearances: world.appearances,
    bodyStates: world.bodyStates,
    locations: [],
  })
}

function futurePayload(
  world: SpoilerFilteredWorld | null,
  chapterNumber: number | undefined,
  max?: number,
) {
  if (!world) return null
  return trimWorldStateForMap({
    chapterNumber,
    characters: world.characters.map((character) => enrichCharacter(character, new Map(), max)),
    bodies: world.bodies,
    consciousnesses: world.consciousnesses,
    presences: world.presences,
    occupancies: world.occupancies,
    appearances: world.appearances,
    bodyStates: world.bodyStates,
    locations: [],
  })
}

function filteredWorld(world: WorldSnapshot | null, allowed: Set<string> | null) {
  return world ? applySpoilerFilters(world, allowed) : null
}

function eventAfter(events: TimelineEvent[], index: number) {
  return events[index + 1] || null
}

function selectedMetadata(selected: TimelineEvent | null) {
  return {
    sequence: selected?.sequence ?? 0,
    id: selected?.id || null,
    eventId: selected?.id,
    chapter: selected?.chapter.number ?? 0,
  }
}

export async function loadShipPage(event: Parameters<PageServerLoad>[0]) {
  const { url, cookies, parent } = event
  const request = requestFrom(url)
  const spoilerProfile = readSpoilerProfile(cookies)
  const catalog = (await parent()) as ShipCatalogData & {
    localizedContent?: Record<string, string>
  }
  const events = catalog.events
  const selection = selectEvent(events, {
    eventId: request.eventId,
    sequence: request.legacySequence,
  })
  const selected = selection.event
  const adjacent = eventAfter(events, selection.index)
  const chapter = nextChapter(events, selected)
  const worlds = await loadWorlds(selected, adjacent, chapter.event)
  const maxChapter = spoilerProfile?.maxChapter
  const allowed = await allowedCharacterIds(maxChapter)
  const present = applySpoilerFilters(worlds.current, allowed)
  const nextEvent = filteredWorld(worlds.nextEvent, allowed)
  const nextChapterWorld = filteredWorld(worlds.nextChapter, allowed)
  const factions = await factionTypes(present.characters, selected)
  const characters = present.characters.map((character) =>
    enrichCharacter(character, factions, maxChapter),
  )
  const perspectiveId = ensurePerspective(url, request.perspectiveId, characters)
  const metadata = selectedMetadata(selected)
  const objects = objectSnapshotsAt(importantObjectCatalog as ImportantObject[], {
    chapter: metadata.chapter,
    locations: catalog.locations,
    spoilerLimit: maxChapter,
  })

  return {
    localizedContent: catalog.localizedContent,
    sequence: metadata.sequence,
    selectedEventIndex: selection.index,
    selectedPerspectiveId: perspectiveId,
    selectedTrackingTarget: trackingTarget({
      requested: request.trackingTarget,
      perspectiveId,
      characters,
      objects,
    }),
    importantObjects: objects,
    followMode: request.followMode,
    selectedEventId: metadata.id,
    perspective: await perspectiveFor(perspectiveId, metadata.eventId, maxChapter),
    worldState: currentPayload(present, characters),
    nextEventDelta: buildShipEventDelta(present, nextEvent),
    nextChapterState: futurePayload(nextChapterWorld, chapter.number, maxChapter),
  }
}
