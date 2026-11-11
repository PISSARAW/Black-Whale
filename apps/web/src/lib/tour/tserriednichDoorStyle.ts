import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { buildSingleAnimatedLeaf, type LeafBuildOptions } from './doorTierBuilders'
import { dressApartmentDoorCasing } from './apartmentDoors'
import type { DoorDressContext } from './doorDetailSurface'

const palette = {
  frame: 0x9b927b,
  trim: 0xc8c1ad,
  sill: 0x8a806a,
  leaf: 0xc8bfaa,
  handle: 0x93815c,
  inset: 0x827866,
  recess: 0xdad1b9,
}
export function dressTserriednichDoorCasing(context: DoorDressContext): void {
  dressApartmentDoorCasing(context, palette)
}

/** Ch. 385 p. 1: two bevelled panels and a narrow middle rail in each leaf. */
export function buildTserriednichDoorLeaves(options: Omit<LeafBuildOptions, 'tier'>) {
  const { THREE, placement } = options
  const sides: (1 | -1)[] = placement.width >= 2.2 ? [-1, 1] : [-1]
  const leafW = (placement.width - 0.12) / sides.length
  return sides.map((hingeSide) => {
    const leaf = buildSingleAnimatedLeaf({
      THREE,
      placement,
      leafW,
      leafD: 0.06,
      leafCol: palette.leaf,
      handleCol: palette.handle,
      hingeSide,
      tier: 2,
    })
    const into = new BanquetDetailBuilder(THREE),
      x = (-hingeSide * leafW) / 2,
      h = placement.height
    for (const face of [-1, 1]) {
      for (const [centre, height] of [
        [h * 0.23, h * 0.3],
        [h * 0.72, h * 0.4],
      ]) {
        const w = leafW - 0.22,
          z = face * 0.045
        into.box([w, height, 0.02], { at: [x, centre, z], colour: palette.inset })
        into.box([w * 0.44, height * 0.46, 0.025], {
          at: [x, centre, z + face * 0.01],
          colour: palette.recess,
        })
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            into.curve(
              [
                [x + (sx * w) / 2, centre + (sy * height) / 2, z + face * 0.012],
                [x + sx * w * 0.22, centre + sy * height * 0.23, z + face * 0.025],
              ],
              0.012,
              { at: [0, 0, 0], colour: palette.recess },
            )
          }
        }
      }
      into.box([leafW - 0.15, h * 0.055, 0.025], {
        at: [x, h * 0.46, face * 0.05],
        colour: palette.inset,
      })
    }
    leaf.hingeGroup.add(into.finish('tserriednich-bevelled-door-panels'))
    return leaf
  })
}
