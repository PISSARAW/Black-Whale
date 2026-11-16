import { isBiscuitTrueForm } from './biscuitForm'
import type { FightState } from './types'

interface CameraFrame {
  x: number
  y: number
  z: number
  lookY: number
}

/** Keep both bodies in view; Biscuit also needs clearance for her natural form. */
export function biscuitCameraFrame(options: {
  state: FightState
  centre: number
  gap: number
  aspect: number
}): CameraFrame {
  const { state, centre, gap, aspect } = options
  const baseDistance = state.phase === 'finished' ? 7.2 : 8.1 + gap * 0.16
  const fighters = [state.player, state.opponent]
  const halfFov = Math.tan((34 * Math.PI) / 360)
  const horizontalDistance = (gap + 2.4) / (2 * halfFov * Math.max(0.25, aspect))
  if (!fighters.some((fighter) => fighter.id === 'biscuit'))
    return {
      x: horizontalDistance > baseDistance ? centre : centre * 0.32,
      y: 2.2,
      z: Math.max(baseDistance, horizontalDistance),
      lookY: 1.18,
    }
  const bodyHeight = fighters.some(isBiscuitTrueForm) ? 2.6 : 2.1
  const z = Math.max(baseDistance, horizontalDistance, bodyHeight / (0.42 * 2 * halfFov))
  const lookY = z * 2 * halfFov * 0.32
  return { x: centre, y: lookY + 1.02, z, lookY }
}
