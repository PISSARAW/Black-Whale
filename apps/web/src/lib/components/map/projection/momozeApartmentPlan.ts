import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { hasMomozeModel } from '$lib/tour/momozeView'
import type { Vec2 } from '$lib/tour/types'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1012')!
const project = ([x, z]: Vec2) =>
  [50 + ((x + 10.5) * 700) / 21, 100 + ((z + 10.2) * 600) / 20.4] as const

/** The 2D view follows the explicitly reconstructed walked plan, rather than an unrelated cutaway tracing. */
export const momozeApartmentFixtures = plan.structures.filter(hasMomozeModel).map((item) => ({
  ...item,
  polygon: structureFootprint(item)
    .map((point) => project(point).join(','))
    .join(' '),
}))
export const momozeApartmentWalls = plan.walls
  .filter((w) => !w.structureId && !w.jambOf)
  .map((wall, id) => {
    const a = project(wall.start),
      b = project(wall.end)
    return { id, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }
  })
export const momozeApartmentLabels = plan.spaces.map((space) => {
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const [x, y] = project([
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...zs) + Math.max(...zs)) / 2,
  ])
  return {
    id: space.id,
    x,
    y,
    name: space.name.split(' —')[0],
    nameFr: space.nameFr.split(' —')[0],
  }
})
