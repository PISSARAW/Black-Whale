import { dolphinRecipientLoan, clearDolphinRecipient } from './dolphinRecipients'
import { changeDolphinBody } from './dolphinBodies'
import type { StolenChainAbility } from './kurapika'
import type { FightSide, FightState } from './types'

/** Returning the single Hatsu and dismissing the Dolphin are separate events. */
export function restoreDolphinDonor(state: FightState, held: StolenChainAbility): FightState {
  if (held.returned) return state
  const member = held.victimMember ?? state.teamMatch?.seats[held.victim].active ?? 0
  return changeDolphinBody(state, { owner: held.victim, member }, (body) => {
    const seal = body.stolenChainAbility
    if (!seal || seal.theftId !== held.theftId) return body
    return { ...body, stolenChainAbility: undefined }
  })
}
export function returnLoanedHatsu(state: FightState, side: FightSide): FightState {
  const loan = state[side].dolphinLoan
  if (!loan || loan.held.returned) return state
  const restored = restoreDolphinDonor(state, loan.held)
  return {
    ...restored,
    [side]: { ...restored[side], dolphinLoan: { ...loan, held: { ...loan.held, returned: true } } },
  }
}
/** Both minds are connected; the lender can dismiss a finished loan as well as its recipient. */
export function dismissReturnedLoans(state: FightState, side: FightSide): FightState {
  const refs = state[side].kurapika?.dolphinLoans
  if (!refs?.length) return state
  const member = state.teamMatch?.seats[side].active ?? 0
  const done = refs.every((ref) => {
    const loan = dolphinRecipientLoan(state, ref)
    return loan?.held.returned && loan.lender.owner === side && loan.lender.member === member
  })
  if (!done) return state
  let next = state
  for (const ref of refs) next = clearDolphinRecipient(next, ref)
  return {
    ...next,
    [side]: { ...next[side], kurapika: { ...next[side].kurapika!, dolphinLoans: undefined } },
  }
}
