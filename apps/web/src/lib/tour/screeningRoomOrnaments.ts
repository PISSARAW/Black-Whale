import type { Structure } from './types'
import {
  SCREENING_STONE,
  SCREENING_GOLD_LEAF,
  SCREENING_RECESS,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

/** Simplified original scrollwork, in the face of a wall or the proscenium. */
export function screeningScroll(
  surface: ScreeningRoomSurface,
  at: [number, number, number],
  options: { scale: number; side: number; front: boolean },
): void {
  const [x, y, z] = at,
    { scale, side, front } = options
  const points = Array.from({ length: 20 }, (_, i): readonly [number, number, number] => {
    const angle = (i / 19) * Math.PI * 3.1,
      radius = scale * (0.08 + (i / 19) * 0.5)
    const a = Math.cos(angle) * radius * side,
      b = Math.sin(angle) * radius
    return front ? [x, y + b, z + a] : [x + a, y + b, z]
  })
  surface.into.curve(points, scale * 0.035, { at: [0, 0, 0], colour: SCREENING_GOLD_LEAF })
}

export function screeningProscenium(options: {
  surface: ScreeningRoomSurface
  floor: number
  structures: Structure[]
}): void {
  const { surface, floor, structures } = options
  const piers = structures
    .filter((s) => s.id.includes('-proscenium-'))
    .sort((a, b) => a.at[1] - b.at[1])
  if (piers.length !== 2) return
  const [a, b] = piers,
    x = a.at[0] + a.size[0] / 2
  const low = a.at[1] + a.size[1] / 2,
    high = b.at[1] - b.size[1] / 2
  const top = floor + Math.min(a.height, b.height) - 0.28,
    radius = 2.1
  surface.box([0.3, 0.25, high - low], [x - 0.15, top - 0.125, (low + high) / 2], SCREENING_STONE)
  for (const [z, side] of [
    [low, 1],
    [high, -1],
  ]) {
    for (const offset of [0, 0.13, 0.26]) {
      const points = Array.from({ length: 20 }, (_, i): readonly [number, number, number] => {
        const angle = ((i / 19) * Math.PI) / 2
        return [
          x + 0.025,
          top - radius - offset + (radius + offset) * Math.sin(angle),
          z + side * (radius - (radius + offset) * Math.cos(angle)),
        ]
      })
      surface.into.curve(points, 0.045, { at: [0, 0, 0], colour: SCREENING_GOLD_LEAF })
    }
    for (const n of [0, 1, 2])
      screeningScroll(surface, [x + 0.07, top - 0.65 - n * 0.45, z + side * (0.6 + n * 0.5)], {
        scale: 0.65,
        side,
        front: true,
      })
  }
  for (let z = low + 0.4; z < high; z += 0.5)
    surface.box([0.1, 0.12, 0.14], [x + 0.03, top - 0.34, z], SCREENING_RECESS)
}
