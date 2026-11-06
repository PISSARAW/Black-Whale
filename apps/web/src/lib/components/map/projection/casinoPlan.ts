import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { CASINO_SPACE } from '$lib/tour/casinoLayout'
import type { Polygon, Vec2 } from '$lib/tour/types'

export const CASINO_SCALE = 16
export const casinoPoint = ([x, z]: Vec2) => ({
  x: (z - 3.5) * CASINO_SCALE + 80,
  y: (x + 57.75) * CASINO_SCALE + 70,
})
export const casinoPolygon = (polygon: Polygon) =>
  polygon
    .map((v) => {
      const p = casinoPoint(v)
      return `${p.x},${p.y}`
    })
    .join(' ')

const ship = theShip()
export const casinoRoom = ship.spaces.get(CASINO_SPACE)!
export const casinoFixtures = ship.structures
  .filter(({ spaceId }) => spaceId === CASINO_SPACE)
  .map((s) => ({
    ...s,
    point: casinoPoint(s.at),
    polygon: casinoPolygon(structureFootprint(s)),
  }))
export const casinoColumns = ship.plans
  .get(casinoRoom.tierId)!
  .columns.get(CASINO_SPACE)!
  .map(casinoPoint)
export const casinoDoors = ship.plans
  .get(casinoRoom.tierId)!
  .doorways.filter(({ a, b }) => [a, b].includes(CASINO_SPACE))
  .map((door) => ({
    ...door,
    from: casinoPoint(door.start),
    to: casinoPoint(door.end),
  }))
export const casinoEmergency = casinoPoint(
  ship.blueprint.links.find(
    ({ from, to }) => from === CASINO_SPACE && to.endsWith('-emergency-stair'),
  )!.at,
)
