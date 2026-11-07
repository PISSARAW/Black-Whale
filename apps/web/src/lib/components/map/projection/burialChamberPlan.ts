import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-burial-chamber')!
export const BURIAL_SPACE = 'tier-1-princes-burial-chamber-rotunda'

export const BURIAL_VIEWBOX = { width: 800, height: 800 }
export const BURIAL_SCALE = 34

export const burialPoint = ([x, z]: Vec2) => ({
  x: 400 + x * BURIAL_SCALE,
  y: 400 + z * BURIAL_SCALE,
})

export const burialPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = burialPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const burialRooms = plan.spaces
export const burialFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === BURIAL_SPACE)
  .map((structure) => ({
    ...structure,
    polygon: burialPolygon(structureFootprint(structure)),
    point: burialPoint(structure.at),
  }))

export const burialDoors = plan.doorways.map((door) => ({
  from: burialPoint(door.start),
  to: burialPoint(door.end),
}))

export interface PrinceInfo {
  rank: number
  name: string
  nameFr: string
  closed: boolean
  chapter?: number
  flame?: boolean
}

/** The 14 princes mapped to their corresponding casket number (1 to 14). */
export const PRINCES_BY_NUMBER: Record<number, PrinceInfo> = {
  1: { rank: 1, name: 'Benjamin (1st Prince)', nameFr: 'Benjamin (1er Prince)', closed: false },
  2: { rank: 2, name: 'Camilla (2nd Prince)', nameFr: 'Camilla (2e Princesse)', closed: false },
  3: { rank: 3, name: 'Zhang Lei (3rd Prince)', nameFr: 'Zhang Lei (3e Prince)', closed: false },
  4: { rank: 4, name: 'Tserriednich (4th Prince)', nameFr: 'Tserriednich (4e Prince)', closed: false },
  5: { rank: 5, name: 'Tubeppa (5th Prince)', nameFr: 'Tubeppa (5e Princesse)', closed: false },
  6: { rank: 6, name: 'Tyson (6th Prince)', nameFr: 'Tyson (6e Princesse)', closed: false },
  7: { rank: 7, name: 'Luzurus (7th Prince)', nameFr: 'Luzurus (7e Prince)', closed: false },
  8: { rank: 8, name: 'Salé-salé (8th Prince)', nameFr: 'Salé-salé (8e Prince)', closed: true, chapter: 384, flame: true },
  9: { rank: 9, name: 'Halkenburg (9th Prince)', nameFr: 'Halkenburg (9e Prince)', closed: false },
  10: { rank: 10, name: 'Kacho (10th Prince)', nameFr: 'Kacho (10e Princesse)', closed: true, chapter: 384, flame: true },
  11: { rank: 11, name: 'Fugetsu (11th Prince)', nameFr: 'Fugetsu (11e Princesse)', closed: false },
  12: { rank: 12, name: 'Momoze (12th Prince)', nameFr: 'Momoze (12e Princesse)', closed: true, chapter: 371, flame: true },
  13: { rank: 13, name: 'Marayam (13th Prince)', nameFr: 'Marayam (13e Prince)', closed: false },
  14: { rank: 14, name: 'Woble (14th Prince)', nameFr: 'Woble (14e Prince)', closed: false },
}

export const burialCoffins = burialFixtures
  .filter((fixture) => fixture.id.includes('coffin'))
  .map((fixture) => {
    const match = fixture.id.match(/coffin-(\d+)$/)
    const coffinNumber = match ? parseInt(match[1], 10) : 1
    const index = coffinNumber - 1
    const prince = PRINCES_BY_NUMBER[coffinNumber]
    return {
      ...fixture,
      index,
      coffinNumber,
      closed: prince?.closed ?? false,
      deceased: prince?.closed ? prince : undefined,
      prince,
    }
  })

export const burialReliquary = burialFixtures.find((fixture) => fixture.id.includes('reliquary'))

export const burialCables = burialCoffins.map((coffin) => {
  const center = burialPoint([0, 0])
  const coffinEnd = burialPoint(coffin.at)
  const nodeAt: Vec2 = [coffin.at[0] * 0.52, coffin.at[1] * 0.52]
  const nodePoint = burialPoint(nodeAt)
  const prince = coffin.prince
  return {
    index: coffin.index,
    coffinNumber: coffin.coffinNumber,
    coffinId: coffin.id,
    from: center,
    to: coffinEnd,
    node: nodePoint,
    active: prince?.closed ?? false,
    flame: prince?.flame ?? false,
    prince,
  }
})

function spot(at: Vec2) {
  const point = burialPoint(at)
  return { x: (point.x / BURIAL_VIEWBOX.width) * 100, y: (point.y / BURIAL_VIEWBOX.height) * 100 }
}

export const burialSpotAnchors = {
  occupants: {
    'nasubi-hui-guo-rou': spot([2.75, 7.87]),
  },
}
