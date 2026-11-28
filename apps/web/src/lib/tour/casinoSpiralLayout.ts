import { CASINO_STAIR_LANDING, CASINO_STAIR_ROOM } from './casinoLayout'
import type { Doorway, Link, Space, Vec2 } from './types'

export const SPIRAL_UPPER: Vec2 = [-48.42, 54.25]
export const SPIRAL_LOWER: Vec2 = [-48.42, 52.05]
export const SPIRAL_GATE_WIDTH = 1.24
export const SPIRAL_GATE_HEIGHT = 2.35
export const SPIRAL_CENTRE: Vec2 = [-46.65, 53.15]
export const SPIRAL_RADIUS = 1.1
export const SPIRAL_INNER_RADIUS = 0.48
export const SPIRAL_OUTER_RADIUS = 1.72
export const SPIRAL_SWEEP = 9 * Math.PI
export const SPIRAL_RUN = SPIRAL_CENTRE[0] - SPIRAL_UPPER[0]

export function isCasinoSpiralLink({ from, to }: Link): boolean {
  return from === CASINO_STAIR_ROOM && to === CASINO_STAIR_LANDING
}

export function casinoSpiralOpening(space: Space): Doorway[] {
  const at = space.id === CASINO_STAIR_ROOM ? SPIRAL_UPPER : SPIRAL_LOWER
  if (space.id !== CASINO_STAIR_ROOM && space.id !== CASINO_STAIR_LANDING) return []
  const [x, z] = at
  return [
    {
      tierId: space.tierId,
      a: space.id,
      b: space.id,
      start: [x, z - SPIRAL_GATE_WIDTH / 2],
      end: [x, z + SPIRAL_GATE_WIDTH / 2],
      width: SPIRAL_GATE_WIDTH,
    },
  ]
}
