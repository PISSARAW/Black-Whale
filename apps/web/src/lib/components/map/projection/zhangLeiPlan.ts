import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-room-1003')!
export const ZHANG_LEI_DINING = 'tier-1-royal-residential-sector-room-1003-dining'

export const ZHANG_LEI_VIEWBOX = { width: 900, height: 600 }
export const ZHANG_LEI_SCALE = 80

/** Maps dining room coordinates (X: 1.5 to 10.5, Z: -5.7 to 0.3) into 2D viewbox. Center: X = 6.0, Z = -2.7 */
export const zhangLeiPoint = ([x, z]: Vec2) => ({
  x: 450 + (x - 6.0) * ZHANG_LEI_SCALE,
  y: 300 + (z - -2.7) * ZHANG_LEI_SCALE,
})

export const zhangLeiPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const point = zhangLeiPoint(at)
      return `${point.x},${point.y}`
    })
    .join(' ')

export const zhangLeiDiningRoom = plan.spaces.find(({ id }) => id === ZHANG_LEI_DINING)

export const zhangLeiFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === ZHANG_LEI_DINING)
  .map((structure) => ({
    ...structure,
    polygon: zhangLeiPolygon(structureFootprint(structure)),
    point: zhangLeiPoint(structure.at),
  }))

export const zhangLeiDoors = plan.doorways
  .filter((door) => door.a === ZHANG_LEI_DINING || door.b === ZHANG_LEI_DINING)
  .map((door) => ({
    from: zhangLeiPoint(door.start),
    to: zhangLeiPoint(door.end),
  }))

function spot(at: Vec2) {
  const point = zhangLeiPoint(at)
  return {
    x: (point.x / ZHANG_LEI_VIEWBOX.width) * 100,
    y: (point.y / ZHANG_LEI_VIEWBOX.height) * 100,
  }
}

const chairHead = zhangLeiFixtures.find(({ id }) => id.includes('chair-head'))!
const chairFoot = zhangLeiFixtures.find(({ id }) => id.includes('chair-foot'))!

export const zhangLeiSpotAnchors = {
  occupants: {
    'prince-zhanglei': spot(chairHead.at),
    'queen-oito': spot(chairFoot.at),
    kurapika: spot([8.8, -1.9]),
  },
}
