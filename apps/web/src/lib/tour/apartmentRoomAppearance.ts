import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'
import { camillaAppearanceOf } from './camillaAppearance'
import { tysonAppearanceOf } from './tysonAppearance'
import { tubeppaAppearanceOf } from './tubeppaAppearance'
import { tserriednichAppearanceOf } from './tserriednichAppearance'
import { zhangLeiAppearanceOf } from './zhangLeiAppearance'
import { princeApartmentAppearanceOf } from './princeApartmentAppearance'

/** Panel-specific apartment palettes precede the shared programme-type fallback. */
export function apartmentRoomAppearanceOf(
  space: Space,
  appearance: RoomAppearance,
): RoomAppearance {
  return (
    camillaAppearanceOf(space, appearance) ??
    zhangLeiAppearanceOf(space, appearance) ??
    tserriednichAppearanceOf(space, appearance) ??
    tubeppaAppearanceOf(space, appearance) ??
    tysonAppearanceOf(space, appearance) ??
    princeApartmentAppearanceOf(space, appearance) ??
    appearance
  )
}
