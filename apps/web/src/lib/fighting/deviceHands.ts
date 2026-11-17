import type { FightSide, FightState } from './types'

export type DeviceHand = 'left' | 'right'
/** Pockets and swallowed transmitters do not occupy the hands. The open book occupies the right. */
export function freeDeviceHand(state: FightState, side: FightSide): DeviceHand | undefined {
  const actor = state[side]
  if (handsBusy(actor)) return undefined
  const occupied = new Set<DeviceHand>()
  if (actor.id === 'chrollo' && actor.chrolloBook?.open) occupied.add('right')
  const active = state.teamMatch?.seats[side].active
  for (const entry of state.battlefield?.entities ?? [])
    if (occupiesHand(entry, side, active)) occupied.add(entry.device!.hand!)
  return (['right', 'left'] as const).find((hand) => !occupied.has(hand))
}
function handsBusy(actor: FightState['player']): boolean {
  return Boolean(actor.coveringEars || actor.melodyPerformance || actor.pluggingWounds)
}
function occupiesHand(
  entry: import('./preparationTypes').PreparedEntity,
  side: FightSide,
  active?: number,
): boolean {
  const device = entry.device
  if (!device || device.carrier !== side || device.swallowed || !device.hand || !entry.present)
    return false
  return device.carrierMember === undefined || device.carrierMember === active
}
