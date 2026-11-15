import type { Location } from '@black-whale/domain'

import type { MapMarker, MapPresence, MapWorldState, ZoomLevel } from './types'
import { tierOverviewY } from './overview'
import { packMarkersForZoom } from './packing'
import { calculatePresencePosition } from './position'
import { belongsToLocation, resolveTierSlug } from './tierAnchors'

export type EventDeltaVisual = 'route' | 'arrival' | 'departure' | 'status'

export interface EventDeltaChange {
  entityId: string
  kind: 'moved' | 'appeared' | 'disappeared' | 'dead'
  fromLocationId: string | null
  toLocationId: string | null
}

export interface EventDeltaPoint {
  x: number
  y: number
}

export interface EventDeltaProjectionContext {
  world: MapWorldState
  zoom: ZoomLevel
  selectedTier: string | null
  selectedLocationSlug: string | null
  currentEventTitle?: string | null
  useCurrentEvent?: boolean
}

export type ProjectedEventDelta<T extends EventDeltaChange = EventDeltaChange> = T & {
  from: EventDeltaPoint | null
  to: EventDeltaPoint | null
  visual: EventDeltaVisual
}

function deltaPresence(entityId: string, locationId: string): MapPresence {
  return {
    id: `delta:${entityId}:${locationId}`,
    entityType: 'BODY',
    entityId,
    locationId,
    fromEventId: '',
    precision: 'EXACT_ROOM',
    certainty: 'CONFIRMED',
  }
}

function characterSlug(entityId: string, world: MapWorldState) {
  const characterId = world.bodies.find(({ id }) => id === entityId)?.originalCharacterId
  return world.characters.find(({ id }) => id === characterId)?.slug
}

function localMarker(
  presence: MapPresence,
  options: {
    world: MapWorldState
    locationsById: Map<string, Location>
    currentEventTitle?: string | null
  },
): MapMarker | null {
  const { world, locationsById, currentEventTitle } = options
  const location = presence.locationId ? locationsById.get(presence.locationId) : null
  const tierId = resolveTierSlug(location, locationsById)
  if (!location || !tierId) return null
  const crowd = [
    ...world.presences.filter(({ entityId }) => entityId !== presence.entityId),
    presence,
  ]
  const position = calculatePresencePosition(presence, crowd, world.locations)

  return {
    id: presence.entityId,
    tierId,
    locationId: location.slug,
    characterSlug: characterSlug(presence.entityId, world),
    currentEventTitle,
    location,
    x: position.x / 10,
    y: position.y / 6,
    overviewX: 50,
    overviewY: tierOverviewY[tierId] ?? 46,
    body: '',
    consciousness: '',
    appearance: '',
    perceivedIdentity: '',
    knowledgeState: 'unknown',
  }
}

function localPoint(
  presence: MapPresence,
  context: EventDeltaProjectionContext,
  options: { locationsById: Map<string, Location>; currentEventTitle?: string | null },
) {
  const { locationsById, currentEventTitle } = options
  const target = context.selectedLocationSlug
  const location = presence.locationId ? locationsById.get(presence.locationId) : null
  if (!target || !belongsToLocation(location, target, locationsById)) return null

  const subject = localMarker(presence, {
    world: context.world,
    locationsById,
    currentEventTitle,
  })
  if (!subject) return null
  const peers = context.world.presences.flatMap((candidate) => {
    if (candidate.entityId === presence.entityId) return []
    const candidateLocation = candidate.locationId ? locationsById.get(candidate.locationId) : null
    if (!belongsToLocation(candidateLocation, target, locationsById)) return []
    const marker = localMarker(candidate, {
      world: context.world,
      locationsById,
      currentEventTitle,
    })
    return marker ? [marker] : []
  })
  const projected = packMarkersForZoom([...peers, subject], 'LOCAL').find(
    ({ id }) => id === presence.entityId,
  )
  return projected ? { x: projected.x, y: projected.y } : null
}

export function projectEventDeltaPoint(
  entityId: string,
  locationId: string | null,
  context: EventDeltaProjectionContext,
): EventDeltaPoint | null {
  if (!locationId) return null
  const locationsById = new Map(context.world.locations.map((location) => [location.id, location]))
  const presence = deltaPresence(entityId, locationId)
  const location = locationsById.get(locationId)
  const tierId = resolveTierSlug(location, locationsById)
  if (!tierId) return null

  if (context.zoom === 'OVERVIEW') return { x: 50, y: tierOverviewY[tierId] ?? 46 }
  if (context.zoom === 'TIER') {
    if (tierId !== context.selectedTier) return null
    const crowd = [
      ...context.world.presences.filter(({ entityId: candidate }) => candidate !== entityId),
      presence,
    ]
    const point = calculatePresencePosition(presence, crowd, context.world.locations)
    return { x: point.x / 10, y: point.y / 6 }
  }
  return localPoint(presence, context, {
    locationsById,
    currentEventTitle: context.useCurrentEvent ? context.currentEventTitle : null,
  })
}

function visualFor(from: EventDeltaPoint | null, to: EventDeltaPoint | null, kind: string) {
  if (kind === 'moved' && from && to) return 'route' as const
  if (!from && to) return 'arrival' as const
  if (from && !to) return 'departure' as const
  return 'status' as const
}

export function projectEventDelta<T extends EventDeltaChange>(
  change: T,
  context: EventDeltaProjectionContext,
): ProjectedEventDelta<T> {
  const from = projectEventDeltaPoint(change.entityId, change.fromLocationId, {
    ...context,
    useCurrentEvent: true,
  })
  const to = projectEventDeltaPoint(change.entityId, change.toLocationId, context)
  return { ...change, from, to, visual: visualFor(from, to, change.kind) }
}
