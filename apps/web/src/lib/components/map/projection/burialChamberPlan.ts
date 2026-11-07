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

export const burialCoffins = burialFixtures.filter((fixture) => fixture.id.includes('coffin'))
export const burialReliquary = burialFixtures.find((fixture) => fixture.id.includes('reliquary'))

export const burialCables = burialCoffins.map((coffin, index) => {
  const center = burialPoint([0, 0])
  const coffinEnd = burialPoint(coffin.at)
  const nodeAt: Vec2 = [coffin.at[0] * 0.52, coffin.at[1] * 0.52]
  const nodePoint = burialPoint(nodeAt)
  return {
    index,
    coffinId: coffin.id,
    from: center,
    to: coffinEnd,
    node: nodePoint,
    active: index === 0, // Coffin 1 (Momoze) is active
  }
})

function spot(at: Vec2) {
  const point = burialPoint(at)
  return { x: (point.x / BURIAL_VIEWBOX.width) * 100, y: (point.y / BURIAL_VIEWBOX.height) * 100 }
}

const momozeCoffin = burialCoffins.find((c) => c.id.endsWith('coffin-01'))

export const burialSpotAnchors = {
  occupants: {
    'nasubi-hui-guo-rou': momozeCoffin
      ? spot([momozeCoffin.at[0] + 0.95, momozeCoffin.at[1]])
      : spot([2.75, 7.87]),
  },
}
