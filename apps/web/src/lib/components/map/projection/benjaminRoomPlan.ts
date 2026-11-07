import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-room-1001')!
export const BENJAMIN_ROOM_SPACE = 'tier-1-royal-residential-sector-room-1001-living'

export const BENJAMIN_VIEWBOX = { width: 800, height: 800 }
export const BENJAMIN_SCALE_X = 700 / 21
export const BENJAMIN_SCALE_Y = 680 / 20.4

/** Maps room coordinates (X: -10.5 to 10.5, Z: -10.2 to 10.2) into local SVG viewbox. */
export const benjaminPoint = ([x, z]: Vec2) => ({
  x: 50 + (x + 10.5) * BENJAMIN_SCALE_X,
  y: 82 + (z + 10.2) * BENJAMIN_SCALE_Y,
})

export const benjaminPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = benjaminPoint(at)
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
    })
    .join(' ')

export const benjaminRoom = plan.spaces.find(({ id }) => id === BENJAMIN_ROOM_SPACE)

export const benjaminFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === BENJAMIN_ROOM_SPACE)
  .map((structure) => ({
    ...structure,
    polygon: benjaminPolygon(structureFootprint(structure)),
    point: benjaminPoint(structure.at),
  }))

export const benjaminDoors = plan.doorways
  .filter((door) => door.a === BENJAMIN_ROOM_SPACE || door.b === BENJAMIN_ROOM_SPACE)
  .map((door) => ({
    from: benjaminPoint(door.start),
    to: benjaminPoint(door.end),
  }))

export function benjaminSpot(at: Vec2) {
  const point = benjaminPoint(at)
  return {
    x: Number(((point.x / BENJAMIN_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((point.y / BENJAMIN_VIEWBOX.height) * 100).toFixed(2)),
  }
}

const painting = benjaminFixtures.find(({ id }) => id.endsWith('-reception-painting'))!
const telephone = benjaminFixtures.find(({ id }) => id.endsWith('-telephone'))!

export const benjaminSpotAnchors = {
  occupants: {
    'prince-benjamin': benjaminSpot([-6.0, 0.5]),
    'balsamilco-might': benjaminSpot(telephone ? telephone.at : [1.2, -1.5]),
    furykov: benjaminSpot([-1.5, 2.0]),
  },
  painting: painting ? benjaminSpot(painting.at) : benjaminSpot([-8.4, -2.58]),
  telephone: telephone ? benjaminSpot(telephone.at) : benjaminSpot([1.2, -1.5]),
}
