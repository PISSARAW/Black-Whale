import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { Space } from './types'

export interface PrincelyWallContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** Ch. 365 p. 16: pale framing, dark floral infills and narrow fluted lower panelling. */
export function dressPrincelyWallPanels({ into, plan, space }: PrincelyWallContext): void {
  const floor = floorOf(space, plan.tier),
    top = ceilingOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    const box = (
      size: readonly [number, number, number],
      p: { along: number; y: number; inset?: number },
      colour: number,
    ) =>
      into.box(size, {
        at: wallPoint(run, { ...p, y: floor + p.y }),
        rotation: [0, run.angle, 0],
        colour,
      })
    for (const [y, h] of [
      [0.1, 0.17],
      [1.1, 0.08],
      [3.35, 0.06],
      [top - 0.15, 0.12],
    ])
      box([run.length, h, 0.11], { along: run.length / 2, y, inset: 0.06 }, 0xc5bca5)
    for (let along = 0.1; along < run.length; along += 0.15)
      box([0.014, 0.85, 0.035], { along, y: 0.6, inset: 0.045 }, 0x867c68)
    const count = Math.max(1, Math.floor(run.length / 1.05)),
      pitch = run.length / count
    for (let i = 0; i < count; i++) {
      const along = (i + 0.5) * pitch,
        width = Math.min(0.7, pitch - 0.22)
      box([width, 1.95, 0.025], { along, y: 2.2, inset: 0.03 }, 0x3f443a)
      for (const side of [-1, 1])
        box(
          [0.045, 2.07, 0.05],
          { along: along + side * (width / 2 + 0.04), y: 2.2, inset: 0.055 },
          0xd0c6ad,
        )
      for (const y of [1.17, 3.23])
        box([width + 0.14, 0.045, 0.05], { along, y, inset: 0.055 }, 0xd0c6ad)
      // Original foliage silhouettes evoke the ink density, without copying the printed pattern.
      for (let row = 0; row < 7; row++) {
        const y = 1.38 + row * 0.25
        for (const side of [-1, 1]) {
          into.sphere([0.075, 0.045, 0.012], {
            at: wallPoint(run, {
              along: along + side * width * 0.22,
              y: floor + y + 0.03,
              inset: 0.07,
            }),
            rotation: [0, run.angle, 0],
            colour: 0xc2bfa0,
          })
          into.curve(
            [
              wallPoint(run, { along, y: floor + y - 0.1, inset: 0.055 }),
              wallPoint(run, { along: along + side * width * 0.28, y: floor + y, inset: 0.055 }),
              wallPoint(run, {
                along: along + side * width * 0.2,
                y: floor + y + 0.12,
                inset: 0.055,
              }),
            ],
            0.022,
            { at: [0, 0, 0], colour: 0xaaa98d },
          )
        }
      }
    }
  }
}
