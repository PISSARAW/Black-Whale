import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'
import { isQueenApartment } from '$lib/tour/queenApartmentProgramme'

const plan = theShip().plans.get('tier-1')!

/** Project the walked footprint and every fixture, including reconstructed internal partitions. */
export function queenApartmentLayout(roomId: string) {
  const room = plan.spaces.find(({ id }) => id === roomId && isQueenApartment(id))
  if (!room) return null
  const xs = room.footprint.map(([x]) => x)
  const minZ = Math.min(...room.footprint.map(([, z]) => z))
  const centreX = (Math.min(...xs) + Math.max(...xs)) / 2
  const point = ([x, z]: Vec2) => ({ x: 250 + (x - centreX) * 32, y: 60 + (z - minZ) * 32 })
  const polygon = (shape: Polygon) =>
    shape
      .map((at) => {
        const p = point(at)
        return `${p.x},${p.y}`
      })
      .join(' ')
  return {
    room,
    outline: polygon(room.footprint),
    fixtures: plan.structures
      .filter(({ spaceId }) => spaceId === roomId)
      .map((item) => ({ ...item, polygon: polygon(structureFootprint(item)) })),
    doors: plan.doorways
      .filter((door) => door.a === roomId || door.b === roomId)
      .map((door) => ({ from: point(door.start), to: point(door.end) })),
    point,
  }
}
