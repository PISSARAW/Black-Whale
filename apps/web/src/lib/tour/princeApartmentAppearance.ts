import type { RoomAppearance } from './roomAppearanceTypes'
import type { Space } from './types'

const PRINCE_TIER = /^interior-room-10(0[1-9]|1[0-4])$/

export const isPrinceApartmentSpace = (space: Space): boolean => PRINCE_TIER.test(space.tierId)

function princeFloor(space: Space): number {
  if (/-(bathroom|servants-wc)$/.test(space.id)) return 0x969990
  if (space.id.endsWith('room-1009-living')) return 0x918f84
  if (space.tierId === 'interior-room-1014' && !space.id.endsWith('-kitchen')) return 0x918f84
  if (space.id.endsWith('-kitchen')) return 0x9b876c
  return 0x8d806d
}

/** Pale royal envelope repeatedly visible across the princely rooms in chs. 363–389. */
export function princeApartmentAppearanceOf(
  space: Space,
  base: RoomAppearance,
): RoomAppearance | null {
  if (!isPrinceApartmentSpace(space)) return null

  const wet = /-(bathroom|servants-wc)$/.test(space.id)
  const tserriednich = space.id.endsWith('room-1004-living')

  return {
    ...base,
    floor: tserriednich ? 0x858176 : princeFloor(space),
    wall: tserriednich ? 0x796d60 : wet ? 0xb8b9b2 : 0xbcb5a7,
    ceiling: tserriednich ? 0xb8b0a2 : wet ? 0xc3c4bd : 0xc9c2b5,
    column: 0xb2aa9c,
    wood: 0x64513f,
    metal: 0x8b8b83,
    fabric: 0x6d514f,
    accent: 0x9d865c,
  }
}
