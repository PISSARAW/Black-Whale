import { voluntaryNenAvailable } from '../nenAccess'
import { chainAbilitySealed } from '../kurapika'
import { readyCohort } from '../preparationWorld'
import { COHORT_WILL_FRAMES } from '../preparationTuning'
import type { ArcadeFighter, FightState, FightSide } from '../types'

export function gelThrowNenAvailable(actor: ArcadeFighter): boolean {
  return (
    (actor.nenOwner ?? actor.id) === 'gel' &&
    voluntaryNenAvailable(actor, { requireReserve: true }) &&
    !chainAbilitySealed(actor, 'gel:neutralSpecial')
  )
}

export function throwCohortReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    voluntaryNenAvailable(actor, { requireReserve: true }) &&
    !chainAbilitySealed(actor, 'halkenburg:neutralSpecial') &&
    actor.hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES &&
    readyCohort(state, side).length > 0
  )
}
