import { queenApartmentAppearanceOf } from './queenApartmentAppearance'
import { queenUnmaAppearanceOf } from './queenUnmaAppearance'
import type { Space } from './types'
import type { RoomAppearance } from './roomAppearanceTypes'
import { camillaAppearanceOf } from './camillaAppearance'
import { wobleAppearanceOf } from './wobleAppearance'
import { marayamAppearanceOf } from './marayamAppearance'
import { momozeAppearanceOf } from './momozeAppearance'
import { fugetsuAppearanceOf } from './fugetsuAppearance'
import { kachoAppearanceOf } from './kachoAppearance'
import { halkenburgAppearanceOf } from './halkenburgAppearance'
import { salesaleAppearanceOf } from './salesaleAppearance'
import { luzurusAppearanceOf } from './luzurusAppearance'
import { tysonAppearanceOf } from './tysonAppearance'
import { tubeppaAppearanceOf } from './tubeppaAppearance'
import { tserriednichAppearanceOf } from './tserriednichAppearance'
import { zhangLeiAppearanceOf } from './zhangLeiAppearance'
import { princeApartmentAppearanceOf } from './princeApartmentAppearance'

const PALETTES = [
  queenUnmaAppearanceOf,
  queenApartmentAppearanceOf,
  camillaAppearanceOf,
  zhangLeiAppearanceOf,
  tserriednichAppearanceOf,
  tubeppaAppearanceOf,
  tysonAppearanceOf,
  luzurusAppearanceOf,
  salesaleAppearanceOf,
  halkenburgAppearanceOf,
  kachoAppearanceOf,
  fugetsuAppearanceOf,
  momozeAppearanceOf,
  marayamAppearanceOf,
  wobleAppearanceOf,
  princeApartmentAppearanceOf,
] as const

/** Panel-specific apartment palettes precede the shared programme-type fallback. */
export function apartmentRoomAppearanceOf(
  space: Space,
  appearance: RoomAppearance,
): RoomAppearance {
  for (const palette of PALETTES) {
    const result = palette(space, appearance)
    if (result) return result
  }
  return appearance
}
