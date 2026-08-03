import type { Location } from '@black-whale/domain'

import type { MapPresence } from './types'
import { getExactTierCoordinates, locationCoordinates, resolveTierSlug } from './tierAnchors'

function spreadAroundAnchor(
  anchor: { x: number; y: number; isSmallRoom?: boolean },
  index: number,
  count: number,
) {
  if (count <= 1) return { x: anchor.x, y: anchor.y }

  const columns = Math.min(anchor.isSmallRoom ? 2 : 6, Math.ceil(Math.sqrt(count)))
  const rows = Math.ceil(count / columns)
  const column = index % columns
  const row = Math.floor(index / columns)
  const spacingX = anchor.isSmallRoom ? 12 : 24
  const spacingY = anchor.isSmallRoom ? 8 : 20

  return {
    x: anchor.x + (column - (columns - 1) / 2) * spacingX,
    y: anchor.y + (row - (rows - 1) / 2) * spacingY,
  }
}

/** Entity ids sharing `anchorFilter`, sorted, so co-located markers fan out stably. */
function spreadAmong(
  crowd: { presences: MapPresence[]; matches: (candidate: MapPresence) => boolean },
  entityId: string,
  anchor: { x: number; y: number; isSmallRoom?: boolean },
) {
  const peers = crowd.presences
    .filter(crowd.matches)
    .map((candidate) => candidate.entityId)
    .sort()
  return spreadAroundAnchor(anchor, Math.max(0, peers.indexOf(entityId)), peers.length)
}

/**
 * Where a presence goes when the map draws no anchor for its own room: with the
 * block it hangs under, if that block is drawn, and otherwise on the deck's own
 * anchor among everyone else the deck holds.
 */
function fallbackPosition(
  presence: MapPresence,
  place: { loc: Location; tierId: string; locationsById: Map<string, Location> },
  sourcePresences: MapPresence[],
) {
  const { loc, tierId, locationsById } = place

  const parent = loc.parentLocationId ? locationsById.get(loc.parentLocationId) : undefined
  const parentCoords = parent ? getExactTierCoordinates(tierId, parent.slug) : undefined
  if (parentCoords) {
    return spreadAmong(
      {
        presences: sourcePresences,
        matches: (candidate) =>
          locationsById.get(candidate.locationId ?? '')?.parentLocationId === loc.parentLocationId,
      },
      presence.entityId,
      parentCoords,
    )
  }

  // Neither the room nor its parent is drawn: fall back to the tier anchor.
  const tierAnchor = getExactTierCoordinates(tierId, tierId) || { x: 500, y: 300 }
  return spreadAmong(
    {
      presences: sourcePresences,
      matches: (candidate) => {
        const candidateLocation = locationsById.get(candidate.locationId ?? '')
        return Boolean(
          candidateLocation && resolveTierSlug(candidateLocation, locationsById) === tierId,
        )
      },
    },
    presence.entityId,
    tierAnchor,
  )
}

export function calculatePresencePosition(
  presence: MapPresence,
  sourcePresences: MapPresence[],
  sourceLocations: Location[],
) {
  const locationsById = new Map<string, Location>(
    sourceLocations.map((location) => [location.id, location]),
  )
  const loc = sourceLocations.find((location) => location.id === presence.locationId) || null
  const tierId = loc ? resolveTierSlug(loc, locationsById) : null

  if (!loc || !tierId || !locationCoordinates[tierId]) return { x: 500, y: 300, loc, tierId }

  const coords = getExactTierCoordinates(tierId, loc.slug)
  if (coords) {
    const { x, y } = spreadAmong(
      {
        presences: sourcePresences,
        matches: (candidate) => candidate.locationId === presence.locationId,
      },
      presence.entityId,
      coords,
    )
    return { x, y, loc, tierId }
  }

  const { x, y } = fallbackPosition(presence, { loc, tierId, locationsById }, sourcePresences)
  return { x, y, loc, tierId }
}
