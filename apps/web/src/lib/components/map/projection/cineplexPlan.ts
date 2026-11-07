import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-cineplex')!

export const CINEPLEX_VIEWBOX = { width: 1000, height: 800 }
export const CINEPLEX_SCALE_X = 16
export const CINEPLEX_SCALE_Y = 14

/** Maps local interior coordinates (X: -28..28, Z: -12.5..37.5) into SVG coordinates */
export const cineplexPoint = ([x, z]: Vec2) => ({
  x: 500 + x * CINEPLEX_SCALE_X,
  y: 250 + z * CINEPLEX_SCALE_Y,
})

export const cineplexPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = cineplexPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const cineplexRooms = plan?.spaces ?? []

export const cineplexFixtures = (plan?.structures ?? []).map((structure) => ({
  ...structure,
  polygon: cineplexPolygon(structureFootprint(structure)),
  point: cineplexPoint(structure.at),
}))

export const cineplexDoors = (plan?.doorways ?? []).map((door) => ({
  from: cineplexPoint(door.start),
  to: cineplexPoint(door.end),
}))

function spot(at: Vec2) {
  const point = cineplexPoint(at)
  return {
    x: (point.x / CINEPLEX_VIEWBOX.width) * 100,
    y: (point.y / CINEPLEX_VIEWBOX.height) * 100,
  }
}

const foodCounter = cineplexFixtures.find(({ id }) => id.endsWith('-food-counter'))
const seatingIsland = cineplexFixtures.find(({ id }) => id.endsWith('-seating-island'))
const ticketDesk = cineplexFixtures.find(({ id }) => id.endsWith('-ticket-windows'))
const concoursePillar = cineplexFixtures.find(({ id }) => id.endsWith('-concourse-pillar'))

export const cineplexSpotAnchors = {
  occupants: {
    'bonolenov-ndongo': seatingIsland ? spot(seatingIsland.at) : { x: 22.8, y: 31.2 },
    hisoka: seatingIsland ? spot(seatingIsland.at) : { x: 22.8, y: 31.2 },
    'lynch-fullbokko': { x: 42.0, y: 20.0, inferred: true },
    'zakuro-custard': { x: 45.0, y: 20.0, inferred: true },
    'hinrigh-biganduffno': { x: 28.0, y: 31.2, inferred: true },
  },
  concession: foodCounter ? spot(foodCounter.at) : { x: 12.9, y: 31.2 },
  tickets: ticketDesk ? spot(ticketDesk.at) : { x: 87.1, y: 31.2 },
  seating: seatingIsland ? spot(seatingIsland.at) : { x: 22.8, y: 31.2 },
  ramp: concoursePillar ? spot([concoursePillar.at[0], 2.0]) : { x: 50.0, y: 34.5 },
}
