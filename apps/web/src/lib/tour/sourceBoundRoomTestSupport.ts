import { buildShip } from './blueprint'

const ship = buildShip()

/** Blueprint evidence attached to one catalogue location. */
export const evidenceFor = (locationId: string) => {
  const spaces = ship.blueprint.spaces.filter((space) => space.locationId === locationId)
  const spaceIds = new Set(spaces.map((space) => space.id))
  const structures = ship.structures.filter((structure) => spaceIds.has(structure.spaceId))

  return { spaces, structures }
}
