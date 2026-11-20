import { blinkyPathClear, blinkyState, inBlinkyNozzle } from './blinky'
import type { FightProjectile, FightSide, FightState } from './types'

/**
 * The one object Blinky swallows: real non-living matter of the named kind, in the
 * nozzle, nearest first. A Nen construct or emitted aura is never a candidate, and
 * the other objects of that kind stay where they are: no indiscriminate suction.
 */
export function blinkyNamedObject(state: FightState, side: FightSide): FightProjectile | null {
  const fighter = state[side]
  const named = blinkyState(fighter).target
  const candidates = state.projectiles
    .filter(
      (shot) =>
        shot.matter === 'object' &&
        !shot.living &&
        shot.shape === named &&
        inBlinkyNozzle(fighter, shot) &&
        blinkyPathClear(state, side, shot),
    )
    .sort((a, b) => Math.abs(a.x - fighter.x) - Math.abs(b.x - fighter.x) || a.id - b.id)
  return candidates[0] ?? null
}
