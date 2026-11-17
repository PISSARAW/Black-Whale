import { dolphinLenderReady } from './dolphinLoanAction'
import { historicalHandsReady } from './historicalHands'
import { changeDolphinPerson } from './dolphinRecipients'
import { reconcileLoanLinks } from './dolphinBorrowing'
import { personDolphinAwake } from './dolphinPeopleState'
import { liveEntity, updateEntity } from './preparationWorld'
import { completePreparation } from './preparationActions'
import { PREPARED_COSTS } from './preparationTuning'
import { littleEyeTarget } from './littleEyeTypes'
import { emitLittleEyeBall } from './littleEyeBall'
import { restoreDolphinDonor } from './dolphinReturn'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function personDolphinCanLend(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  return Boolean(
    entry.person &&
    liveEntity(entry) &&
    !entry.person.loan &&
    dolphinLenderReady(state, side) &&
    historicalHandsReady(state, side, ['right']) &&
    Math.hypot(entry.x - state[side].x, entry.y - state[side].y) <= 6,
  )
}
export function lendDolphinToPerson(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): FightState {
  if (!personDolphinCanLend(state, side, entry)) return state
  const actor = state[side],
    chain = actor.kurapika!
  const member = state.teamMatch?.seats[side].active ?? 0
  const next = changeDolphinPerson(state, entry.id, {
    loan: { lender: { owner: side, member }, held: chain.held! },
  })
  return {
    ...next,
    [side]: {
      ...next[side],
      kurapika: { ...chain, held: null, dolphinLoans: [{ person: entry.id }] },
    },
  }
}
export function performPersonDolphinCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const person = state.battlefield?.entities.find((entry) => entry.id === command.target)
  if (!person?.person || command.loan || person.person.control.side !== side) return state
  if (!personDolphinAwake(state, person)) return state
  if (command.action === 'person-dolphin-use') return usePersonHatsu(state, person)
  if (command.action === 'person-dolphin-close') return dismissPersonDolphin(state, person)
  return orderPersonAnimal(state, person, command.action)
}
function dismissPersonDolphin(state: FightState, entry: PreparedEntity): FightState {
  if (!entry.person!.loan!.held.returned) return state
  return reconcileLoanLinks(changeDolphinPerson(state, entry.id, { loan: undefined }))
}
export function personActivationReady(state: FightState, entry: PreparedEntity): boolean {
  const held = entry.person?.loan?.held
  if (!held?.loaded || held.used || held.returned || !held.auraSupply) return false
  const cost = PREPARED_COSTS[held.source]
  return Boolean(cost && held.auraSupply.amount >= cost && personApplicationTarget(state, entry))
}
function usePersonHatsu(state: FightState, entry: PreparedEntity): FightState {
  if (!personActivationReady(state, entry)) return state
  const loan = entry.person!.loan!,
    held = loan.held,
    supply = held.auraSupply!
  const target = personApplicationTarget(state, entry)!
  const cost = PREPARED_COSTS[held.source]!
  // Dolphin performs the emission beside the recipient; it is not her personal Nen.
  let next =
    held.source === 'sayird'
      ? emitLittleEyeBall(state, {
          owner: entry.person!.control.side,
          person: entry.id,
          from: entry,
          target,
        })
      : completePreparation(
          updateEntity(state, target.id, { growth: 1 }),
          entry.person!.control.side,
        )
  const used = {
    ...held,
    used: true,
    sustainedKeys: ['prepared'],
    auraSupply: {
      ...supply,
      amount: supply.amount - cost,
      committed: (supply.committed ?? 0) + cost,
    },
  }
  next = changeDolphinPerson(next, entry.id, { nen: 'semi-open', loan: { ...loan, held: used } })
  if (held.source !== 'bill') return next
  next = restoreDolphinDonor(next, used)
  return changeDolphinPerson(next, entry.id, {
    loan: { ...loan, held: { ...used, returned: true } },
  })
}
export function personApplicationTarget(state: FightState, entry: PreparedEntity) {
  const source = entry.person?.loan?.held.source
  return (state.battlefield?.entities ?? [])
    .filter((target) =>
      source === 'sayird'
        ? eligibleAnimal(entry, target)
        : source === 'bill' && eligibleSeed(entry, target),
    )
    .sort((a, b) => Math.abs(a.x - entry.x) - Math.abs(b.x - entry.x))[0]
}
function eligibleAnimal(person: PreparedEntity, target: PreparedEntity): boolean {
  return littleEyeTarget(target) && Math.hypot(target.x - person.x, target.y - person.y) <= 18
}
function eligibleSeed(person: PreparedEntity, target: PreparedEntity): boolean {
  return (
    target.kind === 'seed' &&
    liveEntity(target) &&
    !target.copy &&
    !target.growth &&
    target.material === 'real' &&
    Math.hypot(target.x - person.x, target.y - person.y) <= 8
  )
}
function orderPersonAnimal(state: FightState, person: PreparedEntity, action: string): FightState {
  const animal = state.battlefield?.entities.find(
    (entry) => liveEntity(entry) && entry.controller?.person === person.id,
  )
  if (!animal?.littleEye || !action.startsWith('person-eye-')) return state
  if (action === 'person-eye-release')
    return updateEntity(state, animal.id, { controller: undefined, littleEye: undefined })
  if (action === 'person-eye-stay')
    return updateEntity(state, animal.id, {
      littleEye: { ...animal.littleEye, destinationX: undefined },
    })
  const facing = action.endsWith('left') ? -1 : 1
  const destinationX = action.includes('-look-')
    ? animal.littleEye.destinationX
    : facing === -1
      ? 0
      : 100
  return updateEntity(state, animal.id, { littleEye: { facing, destinationX } })
}
