import { physicalHandOccupancy, physicalHandsBusy, type DeviceHand } from './deviceHands'
import { originalDocumentInLeftHand } from './paperDocuments'
import type { FightSide, FightState } from './types'

/** A page or copied power supplies no additional hands for its actual material gesture. */
export function historicalHandsReady(
  state: FightState,
  side: FightSide,
  hands: readonly DeviceHand[],
): boolean {
  if (physicalHandsBusy(state[side])) return false
  const occupied = physicalHandOccupancy(state, side)
  return hands.every((hand) => !occupied.has(hand))
}

export function skillHunterBookHandReady(state: FightState, side: FightSide): boolean {
  return (
    !physicalHandsBusy(state[side]) &&
    !physicalHandOccupancy(state, side, { book: true }).has('right')
  )
}

export function originalLeftHandReady(
  state: FightState,
  side: FightSide,
  originalId: string,
): boolean {
  if (physicalHandsBusy(state[side])) return false
  if (!physicalHandOccupancy(state, side, { gallery: true }).has('left')) return true
  if (originalDocumentInLeftHand(state, side, originalId)) return true
  const member = state.teamMatch?.seats[side].active ?? 0
  return Boolean(
    state.battlefield?.entities.some(
      (e) =>
        e.id === originalId &&
        e.present &&
        e.health > 0 &&
        e.device?.hand === 'left' &&
        e.device.carrier === side &&
        !e.device.swallowed &&
        (e.device.carrierMember ?? 0) === member,
    ),
  )
}
