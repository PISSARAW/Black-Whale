import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-justice-bureau')!

export const JUSTICE_VIEWBOX = { width: 1000, height: 700 }
export const JUSTICE_SCALE = 20

/** Maps local interior coordinates (X: -22..22, Z: -13.75..13.75) into 1000x700 SVG */
export const justicePoint = ([x, z]: Vec2) => ({
  x: 500 + x * JUSTICE_SCALE,
  y: 365 + z * JUSTICE_SCALE,
})

export const justicePolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = justicePoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const justiceRooms = plan?.spaces ?? []

export const justiceFixtures = (plan?.structures ?? []).map((structure) => ({
  ...structure,
  polygon: justicePolygon(structureFootprint(structure)),
  point: justicePoint(structure.at),
}))

export const justiceDoors = (plan?.doorways ?? []).map((door) => ({
  from: justicePoint(door.start),
  to: justicePoint(door.end),
}))

function spot(at: Vec2) {
  const point = justicePoint(at)
  return {
    x: (point.x / JUSTICE_VIEWBOX.width) * 100,
    y: (point.y / JUSTICE_VIEWBOX.height) * 100,
  }
}

const desk = justiceFixtures.find(({ id }) => id.endsWith('-deputy-desk'))
const chair1 = justiceFixtures.find(({ id }) => id.endsWith('-deputy-visitor-chair-01'))
const chair2 = justiceFixtures.find(({ id }) => id.endsWith('-deputy-visitor-chair-02'))
const lobbyDesk = justiceFixtures.find(({ id }) => id.endsWith('-lobby-desk'))
const partition = justiceFixtures.find(({ id }) => id.endsWith('-visitation-partition'))

export const justiceSpotAnchors = {
  occupants: {
    melody: chair1 ? spot(chair1.at) : { x: 45.8, y: 35.6 },
    kaiser: chair2 ? spot(chair2.at) : { x: 52.2, y: 35.6 },
  },
  magistrate: desk ? spot(desk.at) : { x: 49, y: 30.7 },
  reception: lobbyDesk ? spot(lobbyDesk.at) : { x: 21, y: 14.5 },
  transferDrawer: partition ? spot(partition.at) : { x: 71, y: 47.5 },
}
