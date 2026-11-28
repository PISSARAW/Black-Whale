import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import {
  CASINO_LOWER_HALL,
  CASINO_SPACE,
  CASINO_STAIR_LANDING,
  CASINO_STAIR_ROOM,
  isCasinoGamingSurface,
} from '$lib/tour/casinoLayout'
import {
  SPIRAL_CENTRE,
  SPIRAL_OUTER_RADIUS,
  SPIRAL_UPPER,
  isCasinoSpiralLink,
} from '$lib/tour/casinoSpiralLayout'
import type { Polygon, Vec2 } from '$lib/tour/types'

export const CASINO_SCALE = 16
export const CASINO_MAP_WIDTH = 1000
export const CASINO_MAP_HEIGHT = 648
export const casinoPoint = ([x, z]: Vec2) => ({
  x: (z - 3.5) * CASINO_SCALE + 80,
  y: (x + 57.75) * CASINO_SCALE + 70,
})
function projectedPolygon(polygon: Polygon, project: typeof casinoPoint): string {
  return polygon
    .map((v) => {
      const p = project(v)
      return `${p.x},${p.y}`
    })
    .join(' ')
}
export const casinoPolygon = (polygon: Polygon) => projectedPolygon(polygon, casinoPoint)

// The poker seat shown in ch. 405 has no fixed position relative to the machines.
const poker = casinoPoint([-53.5, 30])
export const casinoSpotAnchors = {
  occupants: {
    hisoka: {
      x: (100 * poker.x) / CASINO_MAP_WIDTH,
      y: (100 * poker.y) / CASINO_MAP_HEIGHT,
      inferred: true,
    },
  },
}

const ship = theShip()
const casinoIds = [CASINO_SPACE, CASINO_STAIR_ROOM]
export const casinoRoom = ship.spaces.get(CASINO_SPACE)!
export const casinoStairRoom = ship.spaces.get(CASINO_STAIR_ROOM)!
export const casinoFixtures = ship.structures
  .filter(({ spaceId }) => casinoIds.includes(spaceId))
  .map((s) => ({
    ...s,
    point: casinoPoint(s.at),
    polygon: casinoPolygon(structureFootprint(s)),
  }))
export const casinoGamingSurfaces = casinoFixtures.filter(isCasinoGamingSurface)
export const casinoFurnishings = casinoFixtures.filter(
  (fixture) => !isCasinoGamingSurface(fixture) && fixture.spaceId === CASINO_SPACE,
)
export const casinoSpiral = {
  point: casinoPoint(SPIRAL_CENTRE),
  entry: casinoPoint(SPIRAL_UPPER),
  radius: SPIRAL_OUTER_RADIUS * CASINO_SCALE,
}
export const casinoColumns = ship.plans
  .get(casinoRoom.tierId)!
  .columns.get(CASINO_SPACE)!
  .map(casinoPoint)
export const casinoDoors = ship.plans
  .get(casinoRoom.tierId)!
  .doorways.filter(({ a, b }) => [a, b].includes(CASINO_SPACE))
  .map((door) => ({
    ...door,
    from: casinoPoint(door.start),
    to: casinoPoint(door.end),
  }))

const lowerIds = [CASINO_STAIR_LANDING, CASINO_LOWER_HALL]
const lowerPoint = ([x, z]: Vec2) => ({ x: 358 + (z - 50) * 10, y: 435 + (x + 57) * 10 })
export const casinoLowerRooms = lowerIds.map((id) => {
  const space = ship.spaces.get(id)!
  return { ...space, polygon: projectedPolygon(space.footprint, lowerPoint) }
})
export const casinoLowerFixtures = ship.structures
  .filter(({ spaceId }) => lowerIds.includes(spaceId))
  .map((s) => ({ ...s, polygon: projectedPolygon(structureFootprint(s), lowerPoint) }))
export const casinoLowerDoors = ship.plans
  .get(casinoLowerRooms[0].tierId)!
  .doorways.filter(({ a, b }) => lowerIds.includes(a) || lowerIds.includes(b))
  .map((door) => ({
    ...door,
    from: lowerPoint(door.start),
    to: lowerPoint(door.end),
  }))
export const casinoLowerArrival = lowerPoint(ship.links.find(isCasinoSpiralLink)!.atTo!)
