import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'

/** Only the reception's finishes are panel-derived; the other rooms are a coherent reconstruction. */
export function benjaminAppearanceOf(space: Space, base: RoomAppearance): RoomAppearance | null {
  if (space.tierId !== 'interior-room-1001') return null
  const wet = /-(kitchen|bathroom|servants-wc)$/.test(space.id)
  return {
    ...base,
    floor: wet ? 0x949a90 : 0xaaa08a,
    wall: wet ? 0xc0c3b7 : 0xb6b3a5,
    ceiling: 0xbcb9ab,
    wood: 0x382d24,
    metal: 0x8a7a58,
  }
}
