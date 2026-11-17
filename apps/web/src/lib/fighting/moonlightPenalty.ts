import type { ArcadeFighter, FightSide, FightState } from './types'

/** The sanction is one actual simulated week, independent of the duration of the signed terms. */
export const MOONLIGHT_PENALTY_FRAMES = 7 * 24 * 60 * 60 * 60

export function advanceMoonlightPenalty(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advancePenalty(next, side)
  return next
}
function advancePenalty(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!fighter.moonlightZetsu) return state
  const remaining = Math.max(0, (fighter.moonlightPenaltyFrames ?? MOONLIGHT_PENALTY_FRAMES) - 1)
  return {
    ...state,
    [side]: { ...fighter, moonlightPenaltyFrames: remaining, moonlightZetsu: remaining > 0 },
  }
}
export function carryMoonlightPenalty(next: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  return {
    ...next,
    moonlightPenaltyFrames: previous.moonlightPenaltyFrames ?? MOONLIGHT_PENALTY_FRAMES,
  }
}
