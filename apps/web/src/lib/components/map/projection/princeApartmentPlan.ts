import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

const ship = theShip()

const bounds = (polygon: Polygon) => ({
  x0: Math.min(...polygon.map(([x]) => x)),
  x1: Math.max(...polygon.map(([x]) => x)),
  z0: Math.min(...polygon.map(([, z]) => z)),
  z1: Math.max(...polygon.map(([, z]) => z)),
})

/** The `/ship` local plan is a projection of the exact plan walked by `/tour`. */
export function princeApartmentPlan(roomNumber: number) {
  const plan = ship.plans.get(`interior-room-${roomNumber}`)
  if (!plan) return null
  const frame = bounds(plan.tier.hull)
  const project = ([x, z]: Vec2) =>
    [
      50 + ((x - frame.x0) * 700) / (frame.x1 - frame.x0),
      100 + ((z - frame.z0) * 600) / (frame.z1 - frame.z0),
    ] as const

  return {
    walls: plan.walls
      .filter((wall) => !wall.structureId && !wall.jambOf)
      .map((wall, id) => {
        const a = project(wall.start)
        const b = project(wall.end)
        return { id, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }
      }),
    fixtures: plan.structures.map((structure) => ({
      ...structure,
      polygon: structureFootprint(structure)
        .map((point) => project(point).join(','))
        .join(' '),
    })),
    labels: plan.spaces.map((space) => {
      const box = bounds(space.footprint)
      const [x, y] = project([(box.x0 + box.x1) / 2, (box.z0 + box.z1) / 2])
      return {
        id: space.id,
        x,
        y,
        name: space.name.split(' —')[0],
        nameFr: space.nameFr.split(' —')[0],
      }
    }),
  }
}
