import { ApartmentSurface as TserriednichRoomSurface } from './apartmentDetailSurface'

export const TSERRIEDNICH_DARK_WOOD = 0x695d4d
export const TSERRIEDNICH_PANEL_WOOD = 0xaaa087
export const TSERRIEDNICH_REEDING_GROOVE = 0x635d50
export const TSERRIEDNICH_GOLD_TRIM = 0xab9871
export const TSERRIEDNICH_STONE = 0x6b6760
export const TSERRIEDNICH_CLOCK_FACE = 0xe9e2d0
export const TSERRIEDNICH_CLOCK_HAND = 0x1c1915
export const TSERRIEDNICH_CANVAS = 0x2c3a33
export const TSERRIEDNICH_FRIDGE_WHITE = 0xe4e2dc
export const TSERRIEDNICH_FRIDGE_STEEL = 0xaaa9a4
export const TSERRIEDNICH_COUNTER_STONE = 0xc9c4b8
export const TSERRIEDNICH_GLASS = 0xb9c6c4
export const TSERRIEDNICH_WICKER = 0xa9814f
export const TSERRIEDNICH_URN = 0x5b6b63

export { ApartmentSurface as TserriednichRoomSurface } from './apartmentDetailSurface'

export function tserriednichMouldedFrame(
  surface: TserriednichRoomSurface,
  panel: { width: number; height: number; y: number; z: number; trim?: number },
): void {
  const { width, height, y, z, trim = 0.07 } = panel
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.05], [0, y + (side * height) / 2, z], TSERRIEDNICH_GOLD_TRIM)
    surface.box([trim, height, 0.05], [(side * width) / 2, y, z], TSERRIEDNICH_GOLD_TRIM)
  }
}
