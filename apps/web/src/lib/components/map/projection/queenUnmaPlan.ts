import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
export const QUEEN_UNMA_ROOM = 'tier-1-queens-living-quarters-room-01'

export const QUEEN_UNMA_VIEWBOX = { width: 500, height: 1100 }
export const UNMA_SCALE = 32

/** Maps room coordinates (X: -72 to -61, Z: -50 to -20) into 2D viewbox. */
export const queenUnmaPoint = ([x, z]: Vec2) => ({
  x: 250 + (x - -66.5) * UNMA_SCALE,
  y: 1020 + (z - -20) * UNMA_SCALE,
})

export const queenUnmaPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = queenUnmaPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const unmaRoom = plan.spaces.find(({ id }) => id === QUEEN_UNMA_ROOM)

export const unmaFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === QUEEN_UNMA_ROOM)
  .map((structure) => ({
    ...structure,
    polygon: queenUnmaPolygon(structureFootprint(structure)),
    point: queenUnmaPoint(structure.at),
  }))

export const unmaDoors = plan.doorways
  .filter((door) => door.a === QUEEN_UNMA_ROOM || door.b === QUEEN_UNMA_ROOM)
  .map((door) => ({
    from: queenUnmaPoint(door.start),
    to: queenUnmaPoint(door.end),
  }))

function spot(at: Vec2) {
  const point = queenUnmaPoint(at)
  return {
    x: (point.x / QUEEN_UNMA_VIEWBOX.width) * 100,
    y: (point.y / QUEEN_UNMA_VIEWBOX.height) * 100,
  }
}

const armchair = unmaFixtures.find(({ id }) => id === `${QUEEN_UNMA_ROOM}-armchair`)!
const crib = unmaFixtures.find(({ id }) => id.includes('crib'))!

export const queenUnmaSpotAnchors = {
  occupants: {
    'unma-hui-guo-rou': spot(armchair.at),
  },
  nursery: spot(crib.at),
}

/** The block embeds the same 500 × 1100 projection in its 135 × 150 Room 01 inset. */
export const queenUnmaBlockSpotAnchors = {
  occupants: {
    'unma-hui-guo-rou': {
      x: ((110 + (queenUnmaPoint(armchair.at).x / 500) * 135) / 800) * 100,
      y: ((110 + (queenUnmaPoint(armchair.at).y / 1100) * 150) / 600) * 100,
    },
  },
}
