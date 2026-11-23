import { revealBookSlot } from './chrolloDeck'
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

/** While Musse's owl watches a target, In cannot hide HUD info, Ryu, or Chrollo's open page. */
export function musseCancelsIn(state: FightState, targetSide: FightSide): boolean {
  return Boolean(state.musseOwl?.active && state.musseOwl.target === targetSide)
}

/** Reads an incoming charged Ko zone 3-4 frames early for Musse's HUD. */
export function musseKoWarningZone(state: FightState, musseSide: FightSide): FightNenZone | null {
  const owl = state.musseOwl
  if (!owl?.active || owl.owner !== musseSide) return null
  const target = state[owl.target]
  if (!target.attack?.auraCharged || target.attack.impacted) return null
  return target.attack.kind === 'heavy' ? 'feet' : 'hands'
}

export function musseOwlDrain(fighter: ArcadeFighter): number {
  return fighter.musseOwlActive ? MUSSE_OWL_UPKEEP : 0
}

/** Advances owl effects: reveals Chrollo's open page and dispels on Burst or exhaustion. */
export function advanceMusseOwl(state: FightState): FightState {
  const owl = state.musseOwl
  if (!owl?.active) return state
  const owner = state[owl.owner]
  const target = state[owl.target]
  if (owner.auraExhausted || owner.nen.mode === 'zetsu' || (target.burstZetsuFrames ?? 0) > 0) {
    return clearMusseOwl(state)
  }
  const book = target.chrolloBook
  if (book?.open && book.openSlot !== null && book.openSlot !== undefined) {
    const revealed = revealBookSlot(book, book.openSlot)
    if (revealed !== book) {
      return { ...state, [owl.target]: { ...target, chrolloBook: revealed } }
    }
  }
  return state
}
