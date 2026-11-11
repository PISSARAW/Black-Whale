import type { RoomAppearance } from './roomAppearanceTypes'
import type { Space } from './types'

const CINEPLEX_HALL: RoomAppearance = {
  floor: 0x72515b,
  wall: 0xc8bdba,
  ceiling: 0xded6ca,
  column: 0xd1c5b4,
  wood: 0x604638,
  metal: 0xb8bec4,
  fabric: 0x78404e,
  accent: 0xd4af37,
}

const CINEPLEX_AUDITORIUM: RoomAppearance = {
  floor: 0x241218,
  wall: 0x352a31,
  ceiling: 0x141216,
  column: 0x3d3339,
  wood: 0x3d2b22,
  metal: 0x69727a,
  fabric: 0x6d1522,
  accent: 0x3d7499,
}

/** Public foyers stay bright; projection rooms retain controlled darkness. */
export function cineplexAppearanceOf(space: Space): RoomAppearance | null {
  if (space.locationId !== 'tier-3-cineplex') return null
  return /^tier-3-cineplex-screen-\d$/.test(space.id) ? CINEPLEX_AUDITORIUM : CINEPLEX_HALL
}
