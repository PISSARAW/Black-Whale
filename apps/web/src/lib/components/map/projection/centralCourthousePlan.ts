import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-courthouse')!

export const COURTHOUSE_VIEWBOX = { width: 800, height: 700 }
export const COURTHOUSE_SCALE = 48
export const courthouseRoom = plan.spaces.find(
  ({ id }) => id === 'tier-3-central-courthouse-courtroom',
)!

/** One scale on both axes: the plan and walk share the same estimated envelope. */
export const courthousePoint = ([x, z]: Vec2) => ({
  x: 400 + x * COURTHOUSE_SCALE,
  y: 365 + z * COURTHOUSE_SCALE,
})

export const courthousePolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = courthousePoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const courthouseFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === courthouseRoom.id)
  .map((structure) => ({
    ...structure,
    polygon: courthousePolygon(structureFootprint(structure)),
    point: courthousePoint(structure.at),
  }))

const entry = ship.links.find(({ to }) => to === courthouseRoom.id)!
export const courthouseEntry = courthousePoint(entry.atTo!)
