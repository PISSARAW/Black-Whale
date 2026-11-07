import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const DINING_HALL = 'tier-5-central-dining-hall'
export const DINING_HALL_VIEWBOX = { width: 1000, height: 950 }
export const DINING_HALL_SCALE = 25

export const diningHallPoint = ([x, z]: Vec2) => ({
  x: (x - 14) * DINING_HALL_SCALE + 106.25,
  y: (z - 10.5) * DINING_HALL_SCALE + 81.25,
})

export const diningHallPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = diningHallPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const diningHallRooms = ship.blueprint.spaces.filter(({ id }) => id === DINING_HALL)

export const diningHallFixtures = ship.structures
  .filter(({ spaceId }) => spaceId === DINING_HALL)
  .map((structure) => ({
    ...structure,
    polygon: diningHallPolygon(structureFootprint(structure)),
    point: diningHallPoint(structure.at),
  }))

export const diningHallDoors = (ship.plans.get('tier-5')?.doorways ?? [])
  .filter((door) => door.a === DINING_HALL || door.b === DINING_HALL)
  .map((door) => ({
    from: diningHallPoint(door.start),
    to: diningHallPoint(door.end),
  }))

function spot(at: Vec2) {
  const point = diningHallPoint(at)
  return {
    x: (point.x / DINING_HALL_VIEWBOX.width) * 100,
    y: (point.y / DINING_HALL_VIEWBOX.height) * 100,
  }
}

const franklinTable = diningHallFixtures.find(({ id }) => id.endsWith('-franklin-table'))!
const platformSouth = diningHallFixtures.find(({ id }) => id.endsWith('-platform-south'))!

export const diningHallColumns = (ship.plans.get('tier-5')?.columns.get(DINING_HALL) ?? []).map(
  ([x, z]) => diningHallPoint([x, z]),
)

export const diningHallSpotAnchors = {
  occupants: {
    'franklin-bordeau': spot(franklinTable.at),
    'chrollo-lucilfer': spot(platformSouth.at),
  },
  fallback: { ...spot(platformSouth.at), inferred: true },
}

