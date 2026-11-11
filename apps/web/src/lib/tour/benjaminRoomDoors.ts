import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { DoorDressContext } from './doorDetailSurface'
import { buildSingleAnimatedLeaf, dressCasing, type LeafBuildOptions } from './doorTierBuilders'

/** Ch. 366 p. 16: two recessed rectangular panels in a plain moulded timber frame. */
export function dressBenjaminDoorCasing(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.14,
    jambD: 0.18,
    frameCol: 0x746b5a,
    trimCol: 0xaea38c,
    sillCol: 0x7d7768,
  })
}

export function buildBenjaminDoorLeaves(options: Omit<LeafBuildOptions, 'tier'>) {
  const { THREE, placement } = options
  const sides: (1 | -1)[] = placement.width >= 2.2 ? [-1, 1] : [-1]
  const leafW = (placement.width - 0.12) / sides.length
  return sides.map((hingeSide) => {
    const leaf = buildSingleAnimatedLeaf({
      THREE,
      placement,
      leafW,
      leafD: 0.06,
      leafCol: 0x998e79,
      handleCol: 0x554e40,
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
        into.box([leafW - 0.2, height, 0.025], { at: [x, y, side * 0.037], colour: 0x5c574c })
        into.box([leafW - 0.29, height - 0.1, 0.025], { at: [x, y, side * 0.05], colour: 0xb7ad96 })
      }
    }
    leaf.hingeGroup.add(into.finish('benjamin-door-panels'))
    return leaf
  })
}
