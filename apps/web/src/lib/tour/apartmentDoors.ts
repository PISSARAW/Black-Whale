import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { DoorDressContext } from './doorDetailSurface'
import { buildSingleAnimatedLeaf, dressCasing, type LeafBuildOptions } from './doorTierBuilders'

export interface PanelDoorPalette {
  frame: number
  trim: number
  sill: number
  leaf: number
  handle: number
  inset: number
  recess: number
}

export function dressApartmentDoorCasing(
  context: DoorDressContext,
  palette: PanelDoorPalette,
): void {
  dressCasing(context, {
    jambW: 0.14,
    jambD: 0.18,
    frameCol: palette.frame,
    trimCol: palette.trim,
    sillCol: palette.sill,
  })
}

export function buildApartmentDoorLeaves(
  options: Omit<LeafBuildOptions, 'tier'> & { palette: PanelDoorPalette; name: string },
) {
  const { THREE, placement, palette } = options
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
      dir = -hingeSide
    const x = (dir * leafW) / 2,
      h = placement.height
    for (const side of [-1, 1]) {
      for (const [y, height] of [
        [h * 0.23, h * 0.28],
        [h * 0.69, h * 0.49],
      ]) {
        into.box([leafW - 0.2, height, 0.025], { at: [x, y, side * 0.037], colour: palette.inset })
        into.box([leafW - 0.29, height - 0.1, 0.025], {
          at: [x, y, side * 0.05],
          colour: palette.recess,
        })
      }
    }
    leaf.hingeGroup.add(into.finish(options.name))
    return leaf
  })
}
