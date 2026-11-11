import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'
import { isQueenApartment } from './queenApartmentProgramme'

/** Neutral shared finishes, reconstructed rather than attributed to a panel. */
export function queenApartmentAppearanceOf(
  space: Space,
  appearance: RoomAppearance,
): RoomAppearance | null {
  if (!isQueenApartment(space.id)) return null
  return {
    ...appearance,
    floor: 0x8e897c,
    wall: 0xc7c2b5,
    ceiling: 0xb5afa1,
    column: 0xb5afa1,
    wood: 0x75654f,
    metal: 0x9c927a,
    fabric: 0x747b6b,
    accent: 0x9c927a,
  }
}
