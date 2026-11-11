import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { SOLDIERS_QUARTERS } from '$lib/tour/royalArmyRoomsStyle'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const point = ([x, z]: Vec2) => ({ x: 50 + (x - 25) * 20, y: 125 + (z - 19.5) * 20 })
export const soldiersQuartersPolygon = (shape: Polygon): string =>
  shape.map((at) => `${point(at).x},${point(at).y}`).join(' ')

export const soldiersQuartersRooms = [...ship.spaces.values()]
  .filter(({ locationId }) => locationId === SOLDIERS_QUARTERS)
  .map((space) => ({ ...space, polygon: soldiersQuartersPolygon(space.footprint) }))

const roomIds = new Set(soldiersQuartersRooms.map(({ id }) => id))
export const soldiersQuartersBeds = ship.structures
  .filter(({ spaceId }) => roomIds.has(spaceId))
  .map((item) => ({ ...item, polygon: soldiersQuartersPolygon(structureFootprint(item)) }))
