import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'

/** Monochrome sources establish contrast and motifs; these hues remain interpretations. */
export function tserriednichAppearanceOf(
  space: Space,
  base: RoomAppearance,
): RoomAppearance | null {
  if (space.tierId !== 'interior-room-1004') return null
  const wet = /-(kitchen|bathroom|servants-wc)$/.test(space.id)
  return {
    ...base,
    floor: wet ? 0xa2a598 : 0xb8a58a,
    wall: 0xc8c2b0,
    ceiling: 0xcac6b9,
    wood: 0x685541,
    metal: 0xa38e65,
    fabric: 0x747b68,
  }
}
