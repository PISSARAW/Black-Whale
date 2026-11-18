import { equippedDolphin, dolphinLoanActive } from './dolphinBorrowing'
import { gumAnchorNenAvailable, gumAnchorCommandScope } from './gumObjectAnchorAccess'
import { ownsBungeeGum } from './bungeeAccess'
import type { GumObjectAnchor } from './gumObjectAnchors'
import type { ArcadeFighter, FightSide, FightState } from './types'

export type GumSource = Pick<GumObjectAnchor, 'source' | 'theftId'>
export function newGumSource(actor: ArcadeFighter): GumSource {
  const held = equippedDolphin(actor)
  const borrowed = borrowedGumContext(actor)
  return {
    source: borrowed ? 'dolphin' : (actor.nenOwner ?? actor.id) === 'chrollo' ? 'book' : 'personal',
    theftId: borrowed ? held?.theftId : undefined,
  }
}
function borrowedGumContext(actor: ArcadeFighter): boolean {
  return Boolean(actor.dolphinExecution || (actor.nenOwner ?? actor.id) === 'kurapika')
}
export function gumSourceAvailable(state: FightState, side: FightSide, origin: GumSource): boolean {
  if (origin.source === 'dolphin' && state[side].dolphinLoan && !dolphinLoanActive(state, side))
    return false
  if (!origin.source) return state.pvpSeat ? state[side].health > 0 : ownsBungeeGum(state[side])
  return gumAnchorNenAvailable(state[side], origin)
}
export function gumSourceCommandAllowed(actor: ArcadeFighter, origin: GumSource): boolean {
  return !origin.source || gumAnchorCommandScope(actor, origin)
}
export function sameGumSource(origin: GumSource, scope: GumSource): boolean {
  return (
    origin.source === scope.source &&
    (scope.source !== 'dolphin' || origin.theftId === scope.theftId)
  )
}
