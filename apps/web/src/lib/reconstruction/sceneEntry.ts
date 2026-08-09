import { spaceForLocation, type Ship } from '$lib/tour/blueprint'
import { polygonArea } from '$lib/tour/geometry'
import type { Space } from '$lib/tour/types'

/**
 * The room in which an event should open in the living reconstruction.
 *
 * A catalogued apartment exists twice in the walk: once as its box on the deck
 * and again as a detailed interior. `spaceForLocation` intentionally returns
 * the box because it is the right destination when walking there from `/ship`.
 * Entering an event is different: the visitor belongs in the room where the
 * scene is staged. Prefer its authored living room, then its largest usable
 * interior room, and finally the ordinary deck-level space.
 */
export function mainSceneSpace(ship: Ship, locationId: string | null): Space | null {
  const entrance = spaceForLocation(ship, locationId)
  if (!entrance) return null

  const interior = ship.tiers.find((tier) => tier.parentSpaceId === entrance.id)
  if (!interior) return entrance

  const rooms = ship.blueprint.spaces.filter((space) => space.tierId === interior.id)
  if (rooms.length === 0) return entrance

  const living = rooms.find(
    (space) =>
      /(?:^|-)(?:living|salon)$/.test(space.id) ||
      /\b(?:living room|salon)\b/i.test(`${space.name} ${space.nameFr}`),
  )
  if (living) return living

  const usable = rooms.filter(
    (space) =>
      space.category !== 'corridor' &&
      !/(?:bathroom|toilet|\bwc\b|kitchen|servants?)/i.test(
        `${space.id} ${space.name} ${space.nameFr}`,
      ),
  )
  const pool = usable.length > 0 ? usable : rooms
  return pool.reduce((largest, space) =>
    polygonArea(space.footprint) > polygonArea(largest.footprint) ? space : largest,
  )
}
