import { BODY_ZONES, type BodyZone, type FighterState } from './types'

export interface RyuDistribution {
  attack: number
  defence: Record<BodyZone, number>
  shifting: boolean
}

/** Resolve the aura actually present in every body zone, including an in-flight shift. */
export function ryuDistribution(fighter: FighterState): RyuDistribution {
  const attack = fighter.ko ? 1 : fighter.attackShare
  const reserve = Math.max(0, 1 - attack)
  const guardedShare = reserve * 0.6
  const exposedShare = (reserve - guardedShare) / (BODY_ZONES.length - 1)
  return {
    attack,
    defence: Object.fromEntries(
      BODY_ZONES.map((zone) => [zone, zone === fighter.guard ? guardedShare : exposedShare]),
    ) as Record<BodyZone, number>,
    shifting: Boolean(fighter.ryuShift),
  }
}
