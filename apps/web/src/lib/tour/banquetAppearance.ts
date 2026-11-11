import type { RoomAppearance } from './roomAppearanceTypes'

const BANQUET_PREFIX = 'tier-1-banquet-hall'

/**
 * The supplied hall panorama is a pale ceremonial room: the dark value belongs
 * to the aisle and furniture, not to every architectural surface. Keep this
 * local to the banquet complex so the shared gilded-hall finish still suits
 * the neighbouring corridors and VVIP recreation hall.
 */
export function banquetAppearanceOf(
  spaceId: string,
  ordinary: RoomAppearance,
): RoomAppearance | null {
  if (!spaceId.startsWith(BANQUET_PREFIX)) return null
  return {
    ...ordinary,
    floor: 0x81796c,
    wall: 0xd0c9b9,
    ceiling: 0xbdb7a8,
    column: 0xd5cebd,
    wood: 0x493128,
    metal: 0xc3a25f,
    fabric: 0x762c32,
    accent: 0xc6a45c,
  }
}
