import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'

/** Neutral values from monochrome panels; hues are reconstruction choices. */
export function momozeAppearanceOf(space: Space, base: RoomAppearance): RoomAppearance | null {
  if (space.tierId !== 'interior-room-1012') return null
  return {
    ...base,
    floor: /-(bathroom|servants-wc)$/.test(space.id) ? 0xa3a69a : 0xb0a88f,
    wall: 0xcac5b5,
    ceiling: 0xd0cbbd,
    wood: 0x7e7058,
    metal: 0x92978b,
    fabric: 0xbcb8af,
    accent: 0xb5aa90,
  }
}
