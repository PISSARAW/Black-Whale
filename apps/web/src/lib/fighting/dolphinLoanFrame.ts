import { dolphinBody } from './dolphinBodies'
import { reconcileLoanLinks } from './dolphinBorrowing'
import { mapPhysicalBodies } from './physicalBodyMap'
import { forceZetsu } from './nen'
import type { FightState } from './types'

export function advanceDolphinLoanClocks(state: FightState): FightState {
  return mapPhysicalBodies(state, (body) => {
    const loan = body.dolphinLoan
    if (!loan) return body
    const lender = dolphinBody(state, loan.lender)
    const blackoutFrames = lender?.kurapika?.blackoutFrames ?? 0
    const unconscious =
      blackoutFrames > 0
        ? {
            ...forceZetsu(body),
            attack: null,
            bufferedAttack: null,
            blocking: false,
            motion: undefined,
          }
        : body
    if (unconscious === body && (loan.blackoutFrames ?? 0) === blackoutFrames) return body
    return { ...unconscious, dolphinLoan: { ...loan, blackoutFrames } }
  })
}
/** The recipient explicitly orders dismissal after the single application is finished. */
export function settleDolphinLoans(state: FightState): FightState {
  return reconcileLoanLinks(state)
}
