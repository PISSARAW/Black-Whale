import type { Lamplight } from './light'
import type { Vec2 } from './types'

export const DINING_LAMP_DROP = 1.72
export const DINING_LAMPS: readonly Vec2[] = [16.5, 21, 25.5, 30, 34.5, 39].flatMap((z) =>
  [20, 29.75, 39.5].map((x): Vec2 => [x, z]),
)

/** The lit public refectory uses the same suspended lamps for drawing and light baking. */
export function diningHallLamplight(spaceId: string, ordinary: Lamplight): Lamplight {
  if (spaceId !== 'tier-5-central-dining-hall') return ordinary
  return {
    spacing: 9.75,
    reach: 9.75 * (ordinary.reach / ordinary.spacing),
    power: 1.15,
    dead: 0,
    glow: [2.76, 2.7, 2.5],
    positions: DINING_LAMPS,
    drop: DINING_LAMP_DROP,
    modelled: true,
  }
}
