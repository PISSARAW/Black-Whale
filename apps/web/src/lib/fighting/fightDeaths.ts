import { beginGumResuscitation } from './gumResuscitation'
import { resolveDeathHatsu } from './hatsu'
import type { FightSide, FightState } from './types'

export type FightDeathCause =
  | 'strike'
  | 'projectile'
  | 'heat'
  | 'transfer'
  | 'judgment'
  | 'vow'
  | 'blood'
  | 'asphyxia'
  | 'toxin'
export interface FightDeath {
  victimSide: FightSide
  killerSide: FightSide | null
  cause: FightDeathCause
  fatalCondition?: boolean
}

/** Record the actual fatal source before judging; never infer a murderer from score or position. */
export function recordFightDeath(state: FightState, death: FightDeath): FightState {
  if (state[death.victimSide].health > 0) return state
  if (state.deaths?.some((pending) => pending.victimSide === death.victimSide)) return state
  return { ...state, deaths: [...(state.deaths ?? []), death] }
}

export function explicitDeath(death: FightDeath): boolean {
  return death.cause === 'judgment' || death.cause === 'vow' || death.fatalCondition === true
}

/** All casualties of a batch are known before post-mortem Nen is asked to act. */
export function resolvePostMortemDeaths(state: FightState): FightState {
  for (const death of state.deaths ?? []) {
    const pumping = beginGumResuscitation(state, death)
    if (pumping) return pumping
    if (!hasLivingKiller(state, death)) continue
    const triggered = resolveDeathHatsu(state, death.killerSide!, death.victimSide)
    if (triggered) return { ...triggered, deaths: undefined }
  }
  return state
}

function hasLivingKiller(state: FightState, death: FightDeath): boolean {
  return (
    death.killerSide !== null &&
    death.killerSide !== death.victimSide &&
    state[death.victimSide].health <= 0 &&
    state[death.killerSide].health > 0
  )
}
