import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf } from './blueprint'
import type { PrincelyWallContext } from './princelyWallPanels'

/** Ch. 382 p. 11: horizontal ornamental frames above the tall floral panels. */
export function dressHalkenburgCartouches({ into, plan, space }: PrincelyWallContext): void {
  const floor = floorOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    const count = Math.max(1, Math.floor(run.length / 1.6)),
      pitch = run.length / count
    for (let i = 0; i < count; i++) {
      const along = (i + 0.5) * pitch,
        w = Math.min(1.28, pitch - 0.15)
      into.box([w, 0.38, 0.035], {
        at: wallPoint(run, { along, y: floor + 3.57, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: 0xb8ad91,
      })
      into.box([w - 0.08, 0.27, 0.015], {
        at: wallPoint(run, { along, y: floor + 3.57, inset: 0.065 }),
        rotation: [0, run.angle, 0],
        colour: 0x7a7b63,
      })
      for (const side of [-1, 1])
        into.sphere([0.08, 0.03, 0.012], {
          at: wallPoint(run, { along: along + side * w * 0.22, y: floor + 3.57, inset: 0.08 }),
          rotation: [0, run.angle, 0],
          colour: 0xc5bfa4,
        })
    }
  }
}
