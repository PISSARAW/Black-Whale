import type { BiohazardDevice } from './legacyBiohazardDevices'
import type { FightSide, FightState } from './types'

export function biohazardHidingPlace(state: FightState, side: FightSide) {
  const body = state[side]
  return state.battlefield?.entities.find(
    (entry) =>
      entry.arena &&
      entry.material === 'real' &&
      entry.present &&
      entry.health > 0 &&
      Math.hypot(entry.x - body.x, entry.y - body.y) <= 5,
  )
}

/** A swallowed transmitter or one under an actual intact prop is not a public location marker. */
export function biohazardDeviceHidden(state: FightState, item: BiohazardDevice): boolean {
  if (item.swallowed) return true
  if (!item.concealedUnder) return false
  const cover = state.battlefield?.entities.find((entry) => entry.id === item.concealedUnder)
  return Boolean(
    cover?.arena &&
    cover.present &&
    cover.health > 0 &&
    Math.abs(cover.x - item.x) <= cover.arena.width &&
    Math.abs(cover.y - item.y) < 1,
  )
}
