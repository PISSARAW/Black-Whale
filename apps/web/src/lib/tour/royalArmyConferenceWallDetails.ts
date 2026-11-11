import { floorOf, type TierPlan } from './blueprint'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ARMY_FRAME } from './royalArmyConferenceDetailSurface'
import type { Space } from './types'

export interface WallContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** The shallow lower-wall vertical grille visible on the right in chapter 380, page 1. */
export function dressRoyalArmyConferenceWallDetails({ into, plan, space }: WallContext): void {
  const floor = floorOf(space, plan.tier)
  const right = Math.max(...space.footprint.map(([x]) => x)) - 0.04
  into.box([0.035, 0.85, 2.2], { at: [right, floor + 0.52, -3.3], colour: 0xb6b2a6 })
  for (let z = -4.3; z <= -2.3; z += 0.12)
    into.box([0.04, 0.76, 0.025], { at: [right - 0.025, floor + 0.52, z], colour: ARMY_FRAME })
}
