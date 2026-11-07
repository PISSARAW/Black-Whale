import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
export const VVIP_RECREATION_HALL = 'tier-1-vvip-recreation-hall'

export const VVIP_RECREATION_VIEWBOX = { width: 900, height: 750 }
export const VVIP_RECREATION_SCALE = 25

/** Maps recreation hall coordinates (X: 26 to 56, Z: -50 to -25) into 2D viewbox. Center: X = 41.0, Z = -37.5 */
export const vvipRecreationPoint = ([x, z]: Vec2) => ({
  x: 450 + (x - 41.0) * VVIP_RECREATION_SCALE,
  y: 375 + (z - -37.5) * VVIP_RECREATION_SCALE,
})

export const vvipRecreationPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = vvipRecreationPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const vvipRecreationRoom = plan.spaces.find(({ id }) => id === VVIP_RECREATION_HALL)

export const vvipRecreationFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === VVIP_RECREATION_HALL)
  .map((structure) => ({
    ...structure,
    polygon: vvipRecreationPolygon(structureFootprint(structure)),
    point: vvipRecreationPoint(structure.at),
  }))

export const vvipRecreationDoors = plan.doorways
  .filter((door) => door.a === VVIP_RECREATION_HALL || door.b === VVIP_RECREATION_HALL)
  .map((door) => ({
    from: vvipRecreationPoint(door.start),
    to: vvipRecreationPoint(door.end),
  }))

function spot(at: Vec2) {
  const point = vvipRecreationPoint(at)
  return {
    x: (point.x / VVIP_RECREATION_VIEWBOX.width) * 100,
    y: (point.y / VVIP_RECREATION_VIEWBOX.height) * 100,
  }
}

export const vvipRecreationSpotAnchors = {
  occupants: {
    'prince-tserriednich': spot([41.0, -43.0]),
  },
  fallback: spot([41.0, -37.5]),
}
