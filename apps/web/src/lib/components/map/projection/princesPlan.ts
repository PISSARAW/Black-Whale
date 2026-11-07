import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
const gate = 'tier-1-princes-quarters-gate'

export const PRINCES_GATE_VIEWBOX = { width: 800, height: 600 }
export const PRINCES_GATE_SCALE = 36

export const princesGatePoint = ([x, z]: Vec2) => ({
  x: 400 + (x - 14.75) * PRINCES_GATE_SCALE,
  y: 300 + z * PRINCES_GATE_SCALE,
})

export const princesGatePolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = princesGatePoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const princesGateFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === gate)
  .map((structure) => ({
    ...structure,
    polygon: princesGatePolygon(structureFootprint(structure)),
    point: princesGatePoint(structure.at),
  }))

export const princesGateDoors = plan.doorways
  .filter(({ a, b }) => a === gate || b === gate)
  .map((door) => ({
    from: princesGatePoint(door.start),
    to: princesGatePoint(door.end),
  }))

function spot(at: Vec2) {
  const point = princesGatePoint(at)
  return {
    x: (point.x / PRINCES_GATE_VIEWBOX.width) * 100,
    y: (point.y / PRINCES_GATE_VIEWBOX.height) * 100,
  }
}

export const princesSpotAnchors = {
  occupants: {
    'balsamilco-might': spot([14.75, -4]),
    'prince-halkenburg': spot([15.2, 0]),
  },
}
