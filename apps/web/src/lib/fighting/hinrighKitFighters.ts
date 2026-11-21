import { hinrighKitFor } from './hinrighKit'
import type { BiohazardInventory } from './biohazard'
import type { FightState } from './types'

/**
 * Handcuffs exist only when packed; the legacy free camera and transmitter disappear.
 * The inventory factory is injected so this module adds no runtime import cycle.
 */
export function prepareHinrighKits(
  state: FightState,
  createInventory: (count: number) => BiohazardInventory,
): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const kit = hinrighKitFor(state.environment.preparation, side)
    if (!kit) continue
    next = {
      ...next,
      [side]: {
        ...next[side],
        biohazard: createInventory(kit.includes('handcuffs') ? 2 : 0),
        biohazardDevices: undefined,
      },
    }
  }
  return next
}
