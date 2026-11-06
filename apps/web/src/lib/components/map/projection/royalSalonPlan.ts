import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-king-quarters')!
const salon = 'tier-1-king-living-quarters-living'
export const SALON_VIEWBOX = { width: 900, height: 650 }
export const SALON_SCALE = 24
export const salonPoint = ([x, z]: Vec2) => ({
  x: 450 + x * SALON_SCALE,
  y: 276 + z * SALON_SCALE,
})
export const salonPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = salonPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')
export const salonRooms = plan.spaces
export const salonFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === salon)
  .map((structure) => ({
    ...structure,
    polygon: salonPolygon(structureFootprint(structure)),
    point: salonPoint(structure.at),
  }))
export const salonDoors = plan.doorways.map((door) => ({
  from: salonPoint(door.start),
  to: salonPoint(door.end),
}))
function spot(at: Vec2) {
  const point = salonPoint(at)
  return { x: (point.x / SALON_VIEWBOX.width) * 100, y: (point.y / SALON_VIEWBOX.height) * 100 }
}
const chaise = salonFixtures.find(({ id }) => id.endsWith('-royal-chaise'))!
const bier = salonFixtures.find(({ id }) => id.endsWith('-bier'))!

export const salonSpotAnchors = {
  occupants: {
    'nasubi-hui-guo-rou': spot(chaise.at),
    'prince-halkenburg': spot(bier.at),
  },
}
