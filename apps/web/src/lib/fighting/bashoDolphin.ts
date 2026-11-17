import { withLoanCarrier } from './dolphinBorrowing'
import { withDolphinSupply } from './dolphinSupply'
import { bashoCanWrite } from './bashoPoem'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function hasLoanedBasho(actor: ArcadeFighter): boolean {
  return actor.dolphinLoan?.held.source === 'basho' && actor.dolphinLoan.held.loaded
}
export function loanedBashoCanWrite(state: FightState, side: FightSide): boolean {
  if (!hasLoanedBasho(state[side])) return false
  let ready = false
  withLoanCarrier(state, { side, kurapikaCommand: true }, (prepared) =>
    withDolphinSupply(prepared, side, (supplied) => {
      ready = bashoCanWrite(supplied, side)
      return supplied
    }),
  )
  return ready
}
