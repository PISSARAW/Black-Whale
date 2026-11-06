import { theShip } from '$lib/tour/blueprint'
import { grilleBars, structureFootprint } from '$lib/tour/geometry'
import { BEYOND_CELL, BEYOND_SPACES, BEYOND_WATCH } from '$lib/tour/prisonView'
import type { Polygon, Vec2 } from '$lib/tour/types'

export const PRISON_VIEWBOX = { width: 800, height: 600 }
export const PRISON_SCALE = 80
export const prisonPoint = ([x, z]: Vec2) => ({
  x: 400 + x * PRISON_SCALE,
  y: 300 + z * PRISON_SCALE,
})
export const prisonPolygon = (polygon: Polygon) =>
  polygon
    .map((point) => {
      const p = prisonPoint(point)
      return `${p.x},${p.y}`
    })
    .join(' ')

const ship = theShip()
export const prisonRooms = BEYOND_SPACES.map((id) => ship.spaces.get(id)!)
export const prisonFixtures = ship.structures
  .filter(({ spaceId }) => BEYOND_SPACES.includes(spaceId))
  .map((structure) => ({
    ...structure,
    point: prisonPoint(structure.at),
    polygon: prisonPolygon(structureFootprint(structure)),
    bars: structure.kind === 'bars' ? grilleBars(structure).map(prisonPolygon) : [],
  }))

function spot(point: Vec2) {
  const p = prisonPoint(point)
  return { x: (p.x / PRISON_VIEWBOX.width) * 100, y: (p.y / PRISON_VIEWBOX.height) * 100 }
}

const bunk = prisonFixtures.find(({ spaceId, kind }) => spaceId === BEYOND_CELL && kind === 'bed')!
export const prisonSpotAnchors = {
  occupants: { 'beyond-netero': spot(bunk.at) },
  fallback: { ...spot([2.8, 0]), inferred: true },
}
export const prisonEntrance = ship.blueprint.links.find(({ to }) => to === BEYOND_WATCH)!
