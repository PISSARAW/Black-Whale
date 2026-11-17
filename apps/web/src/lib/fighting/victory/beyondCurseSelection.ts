import type { FightState, FighterId } from '../types'

export const BEYOND_CURSE_CARRIERS = ['furykov', 'longhi'] as const
export const BEYOND_CURSE_PRINCES = ['benjamin', 'camilla', 'tserriednich', 'halkenburg'] as const
export type BeyondCurseCarrier = (typeof BEYOND_CURSE_CARRIERS)[number]
export type BeyondCurseVariant = `beyond-curse-${BeyondCurseCarrier}`

export function isBeyondCurse(variant: string | undefined): variant is BeyondCurseVariant {
  return variant === 'beyond-curse-furykov' || variant === 'beyond-curse-longhi'
}

/**
 * Optional post-verdict fiction: the matchup's prince was designated before the duel.
 * This is not a claim about either carrier's undisclosed canonical target.
 * A points/time/technical victory never supplies the cinematic death trigger.
 */
export function beyondCurseVariant(state: FightState): BeyondCurseVariant | undefined {
  if (state.winner !== 'player' && state.winner !== 'opponent') return
  const loser = state.winner === 'player' ? 'opponent' : 'player'
  const carrier = state[loser]
  if (state.finishReason !== 'knockout' || carrier.health !== 0) return
  if (!(BEYOND_CURSE_PRINCES as readonly FighterId[]).includes(state[state.winner].id)) return
  if (!(BEYOND_CURSE_CARRIERS as readonly FighterId[]).includes(carrier.id)) return
  return `beyond-curse-${carrier.id as BeyondCurseCarrier}`
}
