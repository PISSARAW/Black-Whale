import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'
/** Pale panels and carved furnishings read from the ink values of ch. 403 p. 10; colours interpreted. */
export function queenUnmaAppearanceOf(
  space: Space,
  appearance: RoomAppearance,
): RoomAppearance | null {
  if (space.id !== 'tier-1-queens-living-quarters-room-01') return null
  return {
    ...appearance,
    floor: 0xada99b,
    wall: 0xd6d1c3,
    ceiling: 0xbfb9aa,
    column: 0xd2c6b1,
    wood: 0x75654f,
    metal: 0xbda267,
    fabric: 0x9e8c84,
    accent: 0x9c927a,
  }
}
