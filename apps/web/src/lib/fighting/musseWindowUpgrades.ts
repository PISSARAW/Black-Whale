import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

export const MUSSE_OWL_UPKEEP = 1.5

export interface MusseOwlState {
  owner: FightSide
  target: FightSide
  active: boolean
}

declare module './types' {
  interface FightState {
    musseOwl?: MusseOwlState
  }
  interface ArcadeFighter {
    musseOwlActive?: boolean
  }
}

const isMusse = (fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>) =>
  (fighter.nenOwner ?? fighter.id) === 'musse'

/** Attaches Musse's invisible surveillance owl to the opponent (on 6S or Throw contact). */
export function attachMusseOwl(state: FightState, side: FightSide): FightState {
  if (!isMusse(state[side])) return state
  const target: FightSide = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    musseOwl: { owner: side, target, active: true },
    [side]: { ...state[side], musseOwlActive: true },
  }
}

export function clearMusseOwl(state: FightState): FightState {
  const owl = state.musseOwl
  if (!owl) return state
  return {
    ...state,
    musseOwl: undefined,
    [owl.owner]: { ...state[owl.owner], musseOwlActive: undefined },
  }
}

/** The owl is invisible to its target unless the target activates full ocular Gyo. */
export function musseOwlVisibleTo(state: FightState, observer: FightSide): boolean {
  const owl = state.musseOwl
  if (!owl?.active) return false
  if (observer === owl.owner) return true
  const viewer = state[observer]
  return Boolean(viewer.nen.gyo && !viewer.gyoLow)
}

/** Secret Window observes bodily actions; it does not cancel In or reveal aura. */
export function musseCancelsIn(state: FightState, targetSide: FightSide): boolean {
  void state
  void targetSide
  return false
}

/** Secret Window records gestures and words; it never predicts a charged Ko zone. */
export function musseKoWarningZone(state: FightState, musseSide: FightSide): FightNenZone | null {
  void state
  void musseSide
  return null
}

export function musseOwlDrain(fighter: ArcadeFighter): number {
  return fighter.musseOwlActive ? MUSSE_OWL_UPKEEP : 0
}

/** Advances upkeep; the owl records bodily actions without exposing Nen or book pages. */
export function advanceMusseOwl(state: FightState): FightState {
  const owl = state.musseOwl
  if (!owl?.active) return state
  const owner = state[owl.owner]
  if (owner.auraExhausted || owner.nen.mode === 'zetsu') {
    return clearMusseOwl(state)
  }
  return state
}
