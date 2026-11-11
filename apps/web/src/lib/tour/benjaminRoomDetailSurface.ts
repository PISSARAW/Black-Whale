import { ApartmentSurface as BenjaminRoomSurface } from './apartmentDetailSurface'
export { ApartmentSurface as BenjaminRoomSurface } from './apartmentDetailSurface'

export const BENJAMIN_DARK_WOOD = 0x382d24
export const BENJAMIN_BRONZE = 0x94825d
export const BENJAMIN_STONE = 0x6e6b63
export const BENJAMIN_UNIFORM_GREEN = 0x364236
export const BENJAMIN_UNIFORM_GREY = 0x272c29
export const BENJAMIN_LEATHER_DARK = 0x181412
export const BENJAMIN_GOLD_TRIM = 0xb49856
export const BENJAMIN_SKIN = 0xd2b79b
export const BENJAMIN_FLOOR = 0x2b2723

export function benjaminMouldedFrame(
  surface: BenjaminRoomSurface,
  panel: { width: number; height: number; y: number; z: number; trim?: number },
): void {
  const { width, height, y, z, trim = 0.08 } = panel
  for (const side of [-1, 1]) {
    surface.box([width, trim, 0.06], [0, y + (side * height) / 2, z], BENJAMIN_BRONZE)
    surface.box([trim, height, 0.06], [(side * width) / 2, y, z], BENJAMIN_BRONZE)
  }
}
