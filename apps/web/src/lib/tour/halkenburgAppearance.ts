import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'

/** Neutral values from monochrome panels; hues are reconstruction choices. */
export function halkenburgAppearanceOf(space: Space, base: RoomAppearance): RoomAppearance | null {
  if (space.tierId !== 'interior-room-1009') return null
  return {
    ...base,
    floor: /-(bathroom|servants-wc)$/.test(space.id) ? 0xa3a69a : 0xb8b5a4,
    wall: 0xcac5b5,
    ceiling: 0xd0cbbd,
    wood: 0x7e7058,
    metal: 0x92978b,
    fabric: 0x8f9691,
    accent: 0xb5aa90,
  }
}
