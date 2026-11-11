import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'
import {
  CAMILLA_CARPET,
  CAMILLA_STONE,
  CAMILLA_WOOD,
  CAMILLA_VELVET,
  CAMILLA_GOLD,
} from './camillaDetailSurface'

export function camillaAppearanceOf(space: Space, fallback: RoomAppearance): RoomAppearance | null {
  if (space.tierId !== 'interior-room-1002') return null
  const wet = /-(kitchen|bathroom|servants-wc)$/.test(space.id)
  return {
    ...fallback,
    floor: wet ? 0xa2a598 : space.id.endsWith('-living') ? CAMILLA_CARPET : 0x938a77,
    wall: wet ? 0xc5c6b9 : 0xb7af9e,
    ceiling: CAMILLA_STONE,
    wood: CAMILLA_WOOD,
    metal: CAMILLA_GOLD,
    fabric: CAMILLA_VELVET,
  }
}
