import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-5')

export const WAREHOUSE_VIEWBOX = { width: 1000, height: 540 }

/** Maps metric warehouse coordinates (X: -35..77, Z: -45.5..3.5) to SVG box */
export const warehousePoint = ([x, z]: Vec2) => ({
  x: (x + 35.0) * 8.0 + 55.0,
  y: (z + 45.5) * 8.0 + 85.0,
})

export function warehouseSpot(at: Vec2) {
  const pt = warehousePoint(at)
  return {
    x: Number(((pt.x / WAREHOUSE_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((pt.y / WAREHOUSE_VIEWBOX.height) * 100).toFixed(2)),
  }
}

export const warehouseStructures = (plan?.structures ?? []).filter(
  (s) => s.spaceId === 'tier-5-warehouse',
)

export const warehouseFixtures = warehouseStructures.map((structure) => {
  const footprint = structureFootprint(structure)
  const polygon = footprint
    .map((p) => {
      const pt = warehousePoint(p)
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    })
    .join(' ')
  return {
    ...structure,
    polygon,
    point: warehousePoint(structure.at),
  }
})

const camera = warehouseFixtures.find(({ id }) => id === 'tier-5-warehouse-camera')
const post1 = warehouseFixtures.find(({ id }) => id.endsWith('-guard-post-01'))
const post2 = warehouseFixtures.find(({ id }) => id.endsWith('-guard-post-02'))

export const warehouseSpotAnchors = {
  occupants: {
    nobunaga: warehouseSpot([19.8, 0.2]),
    phinks: warehouseSpot([22.4, -0.2]),
    feitan: warehouseSpot([21.0, -1.2]),
    luini: warehouseSpot([21.0, 3.2]),
    guard: post1 ? warehouseSpot(post1.at) : warehouseSpot([17.0, 1.7]),
    escort: post2 ? warehouseSpot(post2.at) : warehouseSpot([25.0, 1.7]),
  },
  camera: camera ? warehouseSpot(camera.at) : warehouseSpot([35.8, 3.28]),
  entrance: warehouseSpot([21.0, 3.5]),
  guardPost1: post1 ? warehouseSpot(post1.at) : warehouseSpot([17.0, 1.7]),
  guardPost2: post2 ? warehouseSpot(post2.at) : warehouseSpot([25.0, 1.7]),
}
