import type * as Three from 'three'
import type { AnimatedDoorLeaf } from './doorAnimator'
import { doorBox, type DoorDressContext, type DoorPlacement } from './doorDetailSurface'
import { buildSingleAnimatedLeaf, dressCasing } from './doorTierBuilders'
import {
  TSERRIEDNICH_DARK_WOOD,
  TSERRIEDNICH_GOLD_TRIM,
  TSERRIEDNICH_PANEL_WOOD,
  TSERRIEDNICH_REEDING_GROOVE,
} from './tserriednichRoomDetailSurface'

/** Tall panelled doors in the same wood and gold register as the reeded wall. */
export function dressTserriednichDoorCasing(context: DoorDressContext): void {
  dressCasing(context, {
    jambW: 0.15,
    jambD: 0.19,
    frameCol: TSERRIEDNICH_DARK_WOOD,
    trimCol: TSERRIEDNICH_GOLD_TRIM,
    sillCol: TSERRIEDNICH_GOLD_TRIM,
  })

  doorBox({
    into: context.into,
    placement: context.placement,
    size: [context.placement.width + 0.24, 0.1, 0.2],
    offset: [0, context.placement.height + 0.24, 0],
    colour: TSERRIEDNICH_REEDING_GROOVE,
  })
  doorBox({
    into: context.into,
    placement: context.placement,
    size: [context.placement.width + 0.3, 0.03, 0.22],
    offset: [0, context.placement.height + 0.33, 0],
    colour: TSERRIEDNICH_GOLD_TRIM,
  })
}

/** Leaves in the panel wood, with the generic tall gold inset already carried by tier 1. */
export function buildTserriednichDoorLeaves(options: {
  THREE: typeof Three
  placement: DoorPlacement
}): AnimatedDoorLeaf[] {
  const { THREE, placement } = options
  const isWide = placement.width >= 2.2
  const leafD = 0.06

  const leaf = (hingeSide: 1 | -1, leafW: number) =>
    buildSingleAnimatedLeaf({
      THREE,
      placement,
      leafW,
      leafD,
      leafCol: TSERRIEDNICH_PANEL_WOOD,
      handleCol: TSERRIEDNICH_GOLD_TRIM,
      hingeSide,
      tier: 1,
    })

  if (isWide) {
    const halfLeafW = Math.min(1.2, (placement.width - 0.15) / 2)
    return [leaf(-1, halfLeafW), leaf(1, halfLeafW)]
  }

  return [leaf(-1, Math.min(1.1, placement.width - 0.12))]
}
