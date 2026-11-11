import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'

/** Ch. 382 pp. 3–4: dense wall fields behind the gallery; original small relief motif. */
export function dressRoyalSalonWallPaper(options: {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}): void {
  const { into, plan, space } = options,
    floor = floorOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    into.box([run.length, 3.24, 0.018], {
      at: wallPoint(run, { along: run.length / 2, y: floor + 2.65, inset: 0.02 }),
      rotation: [0, run.angle, 0],
      colour: 0x77776a,
    })
    for (let row = 0; row < 12; row++)
      for (let along = 0.15 + (row % 2) * 0.15; along < run.length - 0.08; along += 0.3) {
        into.box([0.018, 0.07, 0.012], {
          at: wallPoint(run, { along, y: floor + 1.2 + row * 0.26, inset: 0.038 }),
          rotation: [0, run.angle, 0.5],
          colour: 0x959581,
        })
      }
  }
}
