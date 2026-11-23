/**
 * Heavens Arena hall dimensions, in metres. Shared by the drawn scenery
 * (`stageHeavensArena.ts`) and the playable stands of the death match, so what
 * is drawn is what can be walked on. The fighters stand on `y = 0`, the top of
 * the ring; the hall floor is `PIT` below it.
 */
export const PIT = 0.7
export const RING: readonly [number, number] = [14, 7.4]
/** The ring is drawn centred on this depth. */
export const RING_Z = 0.3
export const TIERS = 9
export const TIER_RISE = 0.85
export const TIER_DEPTH = 1.5
export const STAND_WIDTH = 46
/** Depth of the first row; each further row steps back by `TIER_DEPTH`. */
export const STAND_START = -9
/** The light truss above the ring: the beam Bungee Gum can hold on to. */
export const TRUSS = { y: 13.6, z: -1.5, width: 30 } as const
/** Hall side walls stand at `±HALL_HALF_WIDTH`. */
export const HALL_HALF_WIDTH = 24

/** Top surface of a row, from the hall floor reference. */
export function tierTop(tier: number): number {
  return -PIT + (tier + 1) * TIER_RISE
}

export function tierZ(tier: number): number {
  return STAND_START - tier * TIER_DEPTH
}

/** Front edge of the first row: the barrier stands just in front of it. */
export const STAND_FRONT = STAND_START + TIER_DEPTH / 2
export const STAND_BACK = STAND_START - (TIERS - 0.5) * TIER_DEPTH
export const BACK_WALL_Z = STAND_START - TIERS * TIER_DEPTH - 0.4
/** The second level Hisoka climbs to, along the back wall above the last rows. */
export const BALCONY = {
  y: tierTop(TIERS - 1) + 3.4,
  zFront: STAND_BACK + 2.4,
  zBack: BACK_WALL_Z,
  halfWidth: 22,
} as const
