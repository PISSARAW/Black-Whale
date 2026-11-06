import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

export const BANQUET_VIEWBOX = { width: 1000, height: 520 }
export const BANQUET_SCALE = 14
export const banquetPoint = ([x, z]: Vec2) => ({
  x: 80 + (z + 30) * BANQUET_SCALE,
  y: 68 + (x + 15) * BANQUET_SCALE,
})
export const banquetPolygon = (polygon: Polygon) =>
  polygon
    .map((point) => {
      const p = banquetPoint(point)
      return `${p.x},${p.y}`
    })
    .join(' ')

const ship = theShip()
const prefix = 'tier-1-banquet-hall'
export const banquetRooms = ship.blueprint.spaces.filter(({ id }) => id.startsWith(prefix))
export const banquetFixtures = ship.structures
  .filter(({ spaceId }) => [prefix, `${prefix}-service-end`].includes(spaceId))
  .map((structure) => ({
    ...structure,
    point: banquetPoint(structure.at),
    polygon: banquetPolygon(structureFootprint(structure)),
  }))
export const banquetDoors = ship.plans
  .get('tier-1')!
  .doorways.filter(({ a, b }) => a.startsWith(prefix) || b.startsWith(prefix))
  .map((door) => ({ ...door, from: banquetPoint(door.start), to: banquetPoint(door.end) }))

function spot(id: string, offset = 0, inferred = true) {
  const fixture = banquetFixtures.find((fixture) => fixture.id === `${prefix}-${id}`)!
  return {
    x: ((fixture.point.x + offset) / BANQUET_VIEWBOX.width) * 100,
    y: (fixture.point.y / BANQUET_VIEWBOX.height) * 100,
    inferred,
  }
}

/** Only Nasubi's chair is located precisely; table choices remain approximate. */
export const banquetSpotAnchors = {
  occupants: {
    'nasubi-hui-guo-rou': spot('throne-dais', 0, false),
    'prince-benjamin': spot('table-20'),
    'prince-tserriednich': spot('table-40', -8),
    'prince-tubeppa': spot('table-40', 8),
    'prince-camilla': spot('table-50'),
    'prince-zhanglei': spot('table-51'),
    'prince-halkenburg': spot('table-18'),
    'prince-kacho': spot('table-24', -8),
    'prince-fugetsu': spot('table-24', 8),
    'queen-oito': spot('table-45', -8),
    'oito-nephew-fake-woble': spot('table-45', 8),
    'sevanti-hui-guo-rou': spot('table-01', -8),
    'prince-marayam': spot('table-01'),
    'prince-momoze': spot('table-01', 8),
  },
  fallback: spot('table-27'),
}
