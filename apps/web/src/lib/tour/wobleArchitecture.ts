import { dressPrincelyWallPanels, type PrincelyWallContext } from './princelyWallPanels'
import { banquetWallRuns, wallPoint } from './banquetWallLayout'
import { floorOf } from './blueprint'
import { dressApartmentArchitecture } from './apartmentArchitecture'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'

/** Chs. 360, 367 and 371: floral wall fields, striped dado and dark rectangular floor bands. */
export function dressWobleArchitecture(context: PrincelyWallContext): void {
  if (/-kitchen$|-bathroom$/.test(context.space.id)) {
    dressApartmentArchitecture(context)
    return
  }
  dressPrincelyWallPanels(context)
  dressPrincelyRoomGrid(context, false)
  dressPrincelyRoomGrid(context, true)
  const { into, plan, space } = context
  for (const run of banquetWallRuns(plan, space)) {
    for (let along = 0.65; along < run.length - 0.4; along += 1.3) {
      into.box([0.9, 0.37, 0.04], {
        at: wallPoint(run, { along, y: floorOf(space, plan.tier) + 3.62 }),
        rotation: [0, run.angle, 0],
        colour: 0xd3cbb8,
      })
      for (const offset of [-0.2, 0.2])
        into.ring(
          { radius: 0.09, tube: 0.012 },
          {
            at: wallPoint(run, {
              along: along + offset,
              y: floorOf(space, plan.tier) + 3.62,
              inset: 0.12,
            }),
            rotation: [0, run.angle, 0],
            colour: 0x777b69,
          },
        )
    }
  }
}
