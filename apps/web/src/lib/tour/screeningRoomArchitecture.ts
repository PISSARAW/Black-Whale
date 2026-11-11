import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import type { TierPlan } from './blueprint'
import type { Space } from './types'
import {
  SCREENING_STONE,
  SCREENING_GOLD_LEAF,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'

/** Cornices follow real wall runs and stop at real openings. No invented doors or booth. */
export function dressScreeningRoomArchitecture(options: {
  surface: ScreeningRoomSurface
  floor: number
  ceilingHeight: number
  plan: TierPlan
  space: Space
}): void {
  const { surface, floor, ceilingHeight, plan, space } = options
  for (const run of banquetWallRuns(plan, space)) {
    for (const [y, height, depth] of [
      [0.12, 0.2, 0.1],
      [ceilingHeight - 0.55, 0.16, 0.15],
      [ceilingHeight - 0.3, 0.2, 0.2],
    ]) {
      surface.into.box([run.length, height, depth], {
        at: wallPoint(run, { along: run.length / 2, y: floor + y, inset: 0.13 }),
        rotation: [0, run.angle, 0],
        colour: SCREENING_STONE,
      })
    }
    surface.into.box([run.length, 0.05, 0.05], {
      at: wallPoint(run, { along: run.length / 2, y: floor + ceilingHeight - 0.75, inset: 0.13 }),
      rotation: [0, run.angle, 0],
      colour: SCREENING_GOLD_LEAF,
    })
  }
}
