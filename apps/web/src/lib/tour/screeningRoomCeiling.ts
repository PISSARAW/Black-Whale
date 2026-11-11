import {
  SCREENING_STONE,
  SCREENING_GOLD_LEAF,
  SCREENING_RECESS,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'
import type { Space } from './types'

/** The reference shows recessed framed squares, with a smaller square inside each. */
export function dressScreeningRoomCeiling(options: {
  surface: ScreeningRoomSurface
  floor: number
  ceilingHeight: number
  space: Space
}): void {
  const { surface, floor, ceilingHeight, space } = options,
    y = floor + ceilingHeight
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  const x0 = Math.min(...xs),
    z0 = Math.min(...zs),
    width = Math.max(...xs) - x0,
    depth = Math.max(...zs) - z0
  const nx = Math.ceil(width / 4.2),
    nz = Math.ceil(depth / 4.2),
    dx = width / nx,
    dz = depth / nz
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const x = x0 + (i + 0.5) * dx,
        z = z0 + (j + 0.5) * dz
      surface.box([dx - 0.2, 0.035, dz - 0.2], [x, y - 0.045, z], SCREENING_RECESS)
      for (const sign of [-1, 1]) {
        surface.box(
          [dx - 0.1, 0.13, 0.08],
          [x, y - 0.12, z + sign * (dz / 2 - 0.09)],
          SCREENING_STONE,
        )
        surface.box(
          [0.08, 0.13, dz - 0.1],
          [x + sign * (dx / 2 - 0.09), y - 0.12, z],
          SCREENING_STONE,
        )
        surface.box(
          [dx * 0.54, 0.065, 0.045],
          [x, y - 0.1, z + sign * dz * 0.27],
          SCREENING_GOLD_LEAF,
        )
        surface.box(
          [0.045, 0.065, dz * 0.54],
          [x + sign * dx * 0.27, y - 0.1, z],
          SCREENING_GOLD_LEAF,
        )
      }
    }
}
