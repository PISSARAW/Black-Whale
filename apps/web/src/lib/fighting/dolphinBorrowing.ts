import { dolphinRecipientLoan } from './dolphinRecipients'
import { createKurapika } from './kurapika'
import { dolphinBody, changeDolphinBody } from './dolphinBodies'
import type { StolenChainAbility } from './kurapika'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function equippedDolphin(actor: ArcadeFighter): StolenChainAbility | null | undefined {
  if (actor.dolphinLoanChannel) return actor.kurapika?.held
  return actor.dolphinLoan?.held ?? actor.kurapika?.held
}
/** Compatibility channel for an external Hatsu; never save its temporary Kurapika state. */
export function loanCarrier(actor: ArcadeFighter): ArcadeFighter {
  const loan = actor.dolphinLoan
  if (!loan || actor.dolphinLoanChannel) return actor
  return {
    ...actor,
    dolphinLoanChannel: { emperorTime: actor.kurapika?.emperorTime ?? false },
    hatsuEffects: { ...actor.hatsuEffects, hatsuStolen: 0 },
    kurapika: { ...(actor.kurapika ?? createKurapika()), emperorTime: true, held: loan.held },
  }
}
export function restoreLoanCarrier(original: ArcadeFighter, after: ArcadeFighter): ArcadeFighter {
  const loan = original.dolphinLoan
  if (!loan || original.dolphinLoanChannel) return after
  const held = after.kurapika?.held
  return {
    ...after,
    dolphinLoanChannel: original.dolphinLoanChannel,
    id: original.id,
    nenOwner: original.nenOwner,
    hatsuEffects: { ...after.hatsuEffects, hatsuStolen: original.hatsuEffects.hatsuStolen },
    kurapika: original.kurapika,
    dolphinLoan: held ? { ...loan, held } : undefined,
  }
}
export function dolphinLoanActive(state: FightState, side: FightSide): boolean {
  const loan = state[side].dolphinLoan
  if (!loan) return false
  const lender = dolphinBody(state, loan.lender)
  return Boolean(lender && lender.health > 0 && lender.kurapika?.emperorTime)
}
export function withLoanCarrier(
  state: FightState,
  options: { side: FightSide; kurapikaCommand?: boolean },
  run: (state: FightState) => FightState,
): FightState {
  const { side } = options
  const body = state[side]
  if (!body.dolphinLoan) return run(state)
  if (!dolphinLoanActive(state, side)) return state
  let actor = loanCarrier(body)
  if (options.kurapikaCommand)
    actor = { ...actor, id: 'kurapika', nenOwner: body.nenOwner ?? body.id }
  const prepared = { ...state, [side]: actor }
  const next = run(prepared)
  if (next === prepared) return state
  return reconcileLoanLinks({ ...next, [side]: restoreLoanCarrier(body, next[side]) })
}
export function reconcileLoanLinks(state: FightState): FightState {
  let next = state
  for (const owner of ['player', 'opponent'] as const) {
    const count = state.teamMatch?.seats[owner].members.length ?? 1
    for (let member = 0; member < count; member++)
      next = changeDolphinBody(next, { owner, member }, (body) => {
        const refs = body.kurapika?.dolphinLoans
        if (!refs?.length) return body
        const present = refs.filter((ref) => {
          const loan = dolphinRecipientLoan(next, ref)
          return loan?.lender.owner === owner && loan.lender.member === member
        })
        return present.length === refs.length
          ? body
          : {
              ...body,
              kurapika: { ...body.kurapika!, dolphinLoans: present.length ? present : undefined },
            }
      })
  }
  return next
}
