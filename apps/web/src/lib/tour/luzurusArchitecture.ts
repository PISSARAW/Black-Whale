import { dressPrincelyWallPanels, type PrincelyWallContext } from './princelyWallPanels'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf } from './blueprint'

/** Ch. 386 p. 8: a second, low register of framed cartouches above the floral panels. */
export function dressLuzurusArchitecture(context: PrincelyWallContext): void {
  dressPrincelyWallPanels(context)
  dressPrincelyRoomGrid(context, false)
  dressPrincelyRoomGrid(context, true)
  const { into, plan, space } = context,
    floor = floorOf(space, plan.tier)
  for (const run of banquetWallRuns(plan, space)) {
    const count = Math.max(1, Math.floor(run.length / 1.05)),
      pitch = run.length / count
    for (let i = 0; i < count; i++) {
      const along = (i + 0.5) * pitch,
        w = Math.min(0.74, pitch - 0.15)
      into.box([w, 0.25, 0.035], {
        at: wallPoint(run, { along, y: floor + 3.57, inset: 0.04 }),
        rotation: [0, run.angle, 0],
        colour: 0xb8ad91,
      })
      into.box([w - 0.08, 0.16, 0.015], {
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
  // A flush rug joins the earlier smoking view to the reconstructed metric suite.
  into.box([2.7, 0.012, 2.6], { at: [2.8, floor + 0.025, 2.8], colour: 0x77765e })
  for (const z of [1.58, 4.02])
    into.box([2.55, 0.006, 0.055], { at: [2.8, floor + 0.035, z], colour: 0xb9ad8f })
}
