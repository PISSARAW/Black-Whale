import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { Space } from './types'

export interface CeilingContext {
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

/** The room is enclosed; no inspected panel supports the former cameras, projector or luminous displays. */
export function dressRoyalArmyConferenceCeiling({ into, plan, space }: CeilingContext): void {
  const xs = space.footprint.map(([x]) => x),
    zs = space.footprint.map(([, z]) => z)
  into.box([Math.max(...xs) - Math.min(...xs), 0.025, Math.max(...zs) - Math.min(...zs)], {
    at: [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      floorOf(space, plan.tier) + ceilingOf(space, plan.tier) - 0.015,
      (Math.min(...zs) + Math.max(...zs)) / 2,
    ],
    colour: 0xc9c6ba,
  })
}
