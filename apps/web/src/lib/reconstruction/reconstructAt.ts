import {
  createEmptyWorld,
  reduceWorld,
  type StoryCursor,
  type WorldEvent,
} from '@black-whale/canon-engine'
import { floorOf, spaceForLocation, type Ship } from '$lib/tour/blueprint'
import { AVATAR, type Apparition } from '$lib/tour/apparitions'
import { stationIn } from '$lib/tour/cast/stations'
import { mainSceneSpace } from './sceneEntry'
import type { DisplayPresence } from './workspaceTypes'

interface NarrativePosition {
  id: string
  ordinal: number | null
  sequence: number
  chapter: { number: number }
}

interface ChronologicalEntry {
  chapter: { number: number }
  event: {
    id: string
    ordinal: number | null
    sequence: number
    locationId: string | null
  }
}

interface ReconstructionPresence {
  entityId: string
  locationId: string | null
  precision: string
  certainty: string
  fromEvent: NarrativePosition
  untilEvent: NarrativePosition | null
}

interface ReconstructionLocation {
  id: string
  slug: string
  name: string
  parentLocationId: string | null
}

interface ReconstructionWorldEvent {
  id: string
  type: string
  schemaVersion: number
  branchId: string
  ordinal: number
  chapterNumber: number
  localSequence: number
  payload: unknown
  sourceIds: string[]
  revealedAtChapter: number | null
}

interface SceneCharacter {
  eventId: string
  bodyId: string
}

export interface ReconstructAtOptions {
  index: number
  chronologicalEvents: readonly ChronologicalEntry[]
  worldEvents: readonly ReconstructionWorldEvent[]
  presences: readonly ReconstructionPresence[]
  sceneCharacters: readonly SceneCharacter[]
  locations: readonly ReconstructionLocation[]
  locationSlugs: Readonly<Record<string, string>>
  ship: Ship
  nameOf: (entityId: string) => string
}

export interface ReconstructedMoment {
  extras: Apparition[]
  presences: DisplayPresence[]
}

function comparePosition(left: NarrativePosition, right: NarrativePosition): number {
  if (left.ordinal !== null && right.ordinal !== null) return left.ordinal - right.ordinal
  return left.chapter.number - right.chapter.number || left.sequence - right.sequence
}

function isPresenceActive(presence: ReconstructionPresence, event: NarrativePosition): boolean {
  return (
    comparePosition(presence.fromEvent, event) <= 0 &&
    (!presence.untilEvent || comparePosition(event, presence.untilEvent) < 0)
  )
}

function isWorldEventVisible(event: ReconstructionWorldEvent, target: ChronologicalEntry): boolean {
  return (
    event.chapterNumber < target.chapter.number ||
    (event.chapterNumber === target.chapter.number && event.localSequence <= target.event.sequence)
  )
}

export function worldEventsThrough(
  records: readonly ReconstructionWorldEvent[],
  target: ChronologicalEntry,
): ReconstructionWorldEvent[] {
  return records.filter((event) => isWorldEventVisible(event, target))
}

function engineEvent(record: ReconstructionWorldEvent): WorldEvent {
  return {
    id: record.id,
    type: record.type,
    schemaVersion: record.schemaVersion,
    branchId: record.branchId,
    cursor: {
      branchId: record.branchId,
      ordinal: record.ordinal,
      chapterNumber: record.chapterNumber,
      localSequence: record.localSequence,
      eventId: record.id,
    },
    payload: record.payload,
    sourceIds: record.sourceIds,
    revealedAtChapter: record.revealedAtChapter ?? undefined,
  } as WorldEvent
}

function initialCursor(first: WorldEvent | undefined): StoryCursor {
  if (!first) {
    return {
      branchId: 'canon',
      ordinal: -1,
      eventId: 'reconstruction-origin',
      chapterNumber: 0,
      localSequence: -1,
    }
  }
  return {
    branchId: first.cursor.branchId,
    ordinal: first.cursor.ordinal - 1,
    eventId: 'reconstruction-origin',
    chapterNumber: first.cursor.chapterNumber,
    localSequence: first.cursor.localSequence - 1,
  }
}

function applyWorldEvent(state: ReturnType<typeof createEmptyWorld>, event: WorldEvent) {
  try {
    return reduceWorld(state, event)
  } catch (error) {
    console.warn('Failed to reduce world event', event.id, error)
    return state
  }
}

function reduceWorldAt(records: readonly ReconstructionWorldEvent[], target: ChronologicalEntry) {
  const events = worldEventsThrough(records, target).map(engineEvent)
  let state = createEmptyWorld(initialCursor(events[0]))
  for (const event of events) state = applyWorldEvent(state, event)
  return state
}

interface DisplayContext {
  locationsById: ReadonlyMap<string, ReconstructionLocation>
  locationSlugs: Readonly<Record<string, string>>
  ship: Ship
  nameOf: (entityId: string) => string
}

function tierForLocation(
  location: ReconstructionLocation | null,
  context: DisplayContext,
): string | null {
  let cursor = location
  for (let depth = 0; cursor && depth < 8; depth += 1) {
    const slug = context.locationSlugs[cursor.id] || cursor.slug
    const space = spaceForLocation(context.ship, slug)
    const tier = space ? space.tierId : cursor.slug.match(/^(tier-[1-5])(?:-|$)/)?.[1]
    if (tier) return tier
    cursor = cursor.parentLocationId
      ? (context.locationsById.get(cursor.parentLocationId) ?? null)
      : null
  }
  return null
}

function displayPresence(
  entityId: string,
  presence: { locationId?: string | null; precision: string; certainty: string },
  context: DisplayContext,
): DisplayPresence {
  const location = context.locationsById.get(presence.locationId ?? '') ?? null
  return {
    entityId,
    locationId: presence.locationId ?? null,
    locationLabel: location?.name ?? null,
    precision: presence.precision as DisplayPresence['precision'],
    certainty: presence.certainty as DisplayPresence['certainty'],
    tierId: tierForLocation(location, context),
    name: context.nameOf(entityId),
  }
}

interface AvatarOptions {
  entityId: string
  locationId: string
  event: { id: string; locationId: string | null }
  locationSlugs: Readonly<Record<string, string>>
  ship: Ship
}

function avatar(options: AvatarOptions): Apparition | null {
  const locationSlug = options.locationSlugs[options.locationId] ?? options.locationId
  const eventLocationSlug = options.event.locationId
    ? (options.locationSlugs[options.event.locationId] ?? options.event.locationId)
    : null
  const space =
    options.locationId === options.event.locationId
      ? mainSceneSpace(options.ship, eventLocationSlug)
      : spaceForLocation(options.ship, locationSlug)
  if (!space) return null
  const plan = options.ship.plans.get(space.tierId)
  if (!plan) return null
  const station = stationIn(space, `${options.event.id}:${options.entityId}`)
  return {
    id: `avatar-${options.entityId}`,
    kind: 'avatar',
    spaceId: space.id,
    tierId: space.tierId,
    at: station.at,
    heading: station.heading,
    y: floorOf(space, plan.tier),
    colour: AVATAR,
    size: 0.9,
    stage: 0,
    hidden: false,
  }
}

function exactLocations(
  options: ReconstructAtOptions,
  target: NarrativePosition,
  statePresences: Readonly<Record<string, { locationId?: string | null; precision: string }>>,
): Record<string, string> {
  const exactByEntity: Record<string, string> = {}
  for (const presence of options.presences) {
    if (
      isPresenceActive(presence, target) &&
      presence.precision === 'EXACT_ROOM' &&
      presence.locationId
    )
      exactByEntity[presence.entityId] = presence.locationId
  }
  for (const [entityId, presence] of Object.entries(statePresences)) {
    if (presence.precision === 'EXACT_ROOM' && presence.locationId)
      exactByEntity[entityId] = presence.locationId
    else delete exactByEntity[entityId]
  }
  return exactByEntity
}

function inferredSceneLocation(
  options: ReconstructAtOptions,
  target: NarrativePosition,
  statePresences: Readonly<Record<string, { locationId?: string | null; precision: string }>>,
): string | null {
  const exactByEntity = exactLocations(options, target, statePresences)
  const counts: Record<string, number> = {}
  for (const character of options.sceneCharacters) {
    if (character.eventId !== target.id) continue
    const locationId = exactByEntity[character.bodyId]
    if (locationId) counts[locationId] = (counts[locationId] ?? 0) + 1
  }
  return Object.entries(counts).reduce<string | null>(
    (best, [locationId, count]) => (!best || count > counts[best]! ? locationId : best),
    null,
  )
}

export function reconstructAt(options: ReconstructAtOptions): ReconstructedMoment {
  const selected = options.chronologicalEvents[options.index]
  if (!selected) return { extras: [], presences: [] }
  const target: NarrativePosition = {
    id: selected.event.id,
    ordinal: selected.event.ordinal,
    sequence: selected.event.sequence,
    chapter: { number: selected.chapter.number },
  }
  const state = reduceWorldAt(options.worldEvents, selected)
  const sceneLocationId =
    selected.event.locationId ?? inferredSceneLocation(options, target, state.presences)
  const byEntity: Record<string, Apparition> = {}
  const presenceByEntity: Record<string, DisplayPresence> = {}
  const context: DisplayContext = {
    locationsById: new Map(options.locations.map((location) => [location.id, location])),
    locationSlugs: options.locationSlugs,
    ship: options.ship,
    nameOf: options.nameOf,
  }
  const show = (entityId: string, presence: { locationId?: string | null; precision: string }) => {
    if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) return
    const shown = avatar({
      entityId,
      locationId: presence.locationId,
      event: { id: target.id, locationId: sceneLocationId },
      locationSlugs: options.locationSlugs,
      ship: options.ship,
    })
    if (shown) byEntity[entityId] = shown
  }

  for (const presence of options.presences) {
    if (!isPresenceActive(presence, target)) continue
    presenceByEntity[presence.entityId] = displayPresence(presence.entityId, presence, context)
    show(presence.entityId, presence)
  }
  for (const [entityId, presence] of Object.entries(state.presences)) {
    presenceByEntity[entityId] = displayPresence(entityId, presence, context)
    if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) delete byEntity[entityId]
    else show(entityId, presence)
  }
  return {
    extras: Object.values(byEntity),
    presences: Object.values(presenceByEntity).sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
  }
}
