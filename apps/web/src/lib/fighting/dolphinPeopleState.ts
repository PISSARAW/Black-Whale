import { dolphinBody } from './dolphinBodies'
import { liveEntity } from './preparationWorld'
import { changeDolphinPerson } from './dolphinRecipients'
import { restoreDolphinDonor } from './dolphinReturn'
import type { DolphinBodyRef, DolphinLoan } from './dolphinLoanTypes'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightState } from './types'

export function personDolphinAwake(state: FightState, entry: PreparedEntity): boolean {
  const loan = entry.person?.loan
  if (!loan || !recipientAwake(entry, loan)) return false
  const lender = dolphinBody(state, loan.lender)
  return Boolean(lender && lender.health > 0 && lenderAwake(lender))
}
function recipientAwake(entry: PreparedEntity, loan: DolphinLoan): boolean {
  return (
    liveEntity(entry) &&
    !entry.sleepingFrames &&
    !loan.blackoutFrames &&
    !entry.blackVoiceControl?.active
  )
}
function lenderAwake(body: ArcadeFighter): boolean {
  const chain = body.kurapika
  return Boolean(chain && chain.emperorTime && !chain.blackoutFrames)
}
export function personKeepsLittleEye(state: FightState, person: string): boolean {
  const entry = state.battlefield?.entities.find((held) => held.id === person)
  const held = entry?.person?.loan?.held
  return Boolean(
    entry && liveEntity(entry) && held?.used && !held.returned && held.source === 'sayird',
  )
}
export function advanceDolphinPeople(state: FightState): FightState {
  let next = state
  for (const entry of state.battlefield?.entities ?? []) {
    if (!entry.person?.loan) continue
    next = advancePersonLoan(next, entry)
  }
  return next
}
function advancePersonLoan(state: FightState, entry: PreparedEntity): FightState {
  const loan = entry.person!.loan!
  const completed = loan.held.used && !loan.held.returned && !personApplicationBusy(state, entry.id)
  const restored = completed ? restoreDolphinDonor(state, loan.held) : state
  const held = completed ? { ...loan.held, returned: true } : loan.held
  const blackoutFrames = lenderBlackout(state, loan.lender)
  if (held === loan.held && blackoutFrames === (loan.blackoutFrames ?? 0)) return restored
  return changeDolphinPerson(restored, entry.id, { loan: { ...loan, held, blackoutFrames } })
}
function lenderBlackout(state: FightState, lender: DolphinBodyRef): number {
  return dolphinBody(state, lender)?.kurapika?.blackoutFrames ?? 0
}
function personApplicationBusy(state: FightState, id: string): boolean {
  return Boolean(
    state.battlefield?.littleEyeShots?.some((shot) => shot.person === id) ||
    state.battlefield?.entities.some(
      (entry) => liveEntity(entry) && entry.controller?.person === id,
    ),
  )
}
