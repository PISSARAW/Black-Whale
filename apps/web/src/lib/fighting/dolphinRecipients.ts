import { changeDolphinBody, dolphinBody } from './dolphinBodies'
import { updateEntity } from './preparationWorld'
import type { DolphinBodyRef, DolphinLoan } from './dolphinLoanTypes'
import type { FightState } from './types'
import type { DolphinPerson } from './dolphinPeopleTypes'

export type DolphinRecipientRef = DolphinBodyRef | { person: string }
export function dolphinRecipientLoan(
  state: FightState,
  ref: DolphinRecipientRef,
): DolphinLoan | undefined {
  return 'person' in ref
    ? state.battlefield?.entities.find((entry) => entry.id === ref.person)?.person?.loan
    : dolphinBody(state, ref)?.dolphinLoan
}
export function clearDolphinRecipient(state: FightState, ref: DolphinRecipientRef): FightState {
  if (!('person' in ref))
    return changeDolphinBody(state, ref, (body) => ({ ...body, dolphinLoan: undefined }))
  const entity = state.battlefield?.entities.find((entry) => entry.id === ref.person)
  return entity?.person
    ? updateEntity(state, ref.person, { person: { ...entity.person, loan: undefined } })
    : state
}
export function changeDolphinPerson(
  state: FightState,
  id: string,
  change: Partial<DolphinPerson>,
): FightState {
  const entity = state.battlefield?.entities.find((entry) => entry.id === id)
  return entity?.person
    ? updateEntity(state, id, { person: { ...entity.person, ...change } })
    : state
}
