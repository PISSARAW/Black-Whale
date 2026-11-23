import type { CombatState } from '../combat/types'
import { EMPTY_WORLD, type TourWorld } from '../tour/hatsu'

/** Projects deterministic Blinky storage into Tour's existing movable-solid renderer. */
export function arenaBlinkyWorld(state: CombatState): TourWorld {
  const entries = Object.values(state.physicalObjects)
  if (!entries.length) return EMPTY_WORLD
  return {
    ...EMPTY_WORLD,
    solids: Object.fromEntries(
      entries.map((object) => [
        object.id,
        object.storedBy ? { gone: true } : { at: object.position },
      ]),
    ),
  }
}
