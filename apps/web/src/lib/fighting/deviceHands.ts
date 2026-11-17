import type { FightSide, FightState } from './types'

export type DeviceHand = 'left' | 'right'
/** Pockets and swallowed transmitters do not occupy the hands. The open book occupies the right. */
export function freeDeviceHand(state: FightState, side: FightSide): DeviceHand | undefined {
  const actor = state[side]
  if (physicalHandsBusy(actor)) return undefined
  const occupied = physicalHandOccupancy(state, side)
  return (['right', 'left'] as const).find((hand) => !occupied.has(hand))
}
export function physicalHandOccupancy(
  state: FightState,
  side: FightSide,
  ignored: { gallery?: boolean; book?: boolean } = {},
): Set<DeviceHand> {
  const occupied = characterHandOccupancy(state[side], ignored)
  const active = state.teamMatch?.seats[side].active
  for (const entry of state.battlefield?.entities ?? [])
    if (occupiesHand(entry, side, active)) occupied.add(entry.device!.hand!)
  return occupied
}
function characterHandOccupancy(
  actor: FightState['player'],
  ignored: { gallery?: boolean; book?: boolean },
): Set<DeviceHand> {
  const occupied = new Set<DeviceHand>()
  if (!ignored.gallery && actor.chrolloHistorical?.galleryFocus) occupied.add('left')
  if (!ignored.book && actor.chrolloBook?.open) occupied.add('right')
  return occupied
}
export function physicalHandsBusy(actor: FightState['player']): boolean {
  return Boolean(
    (actor.bashoPoem?.writingFrames ?? 0) > 0 ||
    actor.coveringEars ||
    actor.melodyPerformance ||
    actor.pluggingWounds,
  )
}
function occupiesHand(
  entry: import('./preparationTypes').PreparedEntity,
  side: FightSide,
  active?: number,
): boolean {
  const device = entry.device
  if (
    !device ||
    device.carrier !== side ||
    device.swallowed ||
    !device.hand ||
    !entry.present ||
    entry.health <= 0
  )
    return false
  return device.carrierMember === undefined || device.carrierMember === active
}
