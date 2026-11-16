import { FIXED_STEP } from './frameData'
import type { FightSide, FightState } from './types'

/** Beyond this jump in one frame (a round reset, a teleport) the renderer snaps. */
const SNAP_DISTANCE = 10

export function capturePositions(state: FightState): NonNullable<FightState['previousPositions']> {
  return {
    player: { x: state.player.x, y: state.player.y },
    opponent: { x: state.opponent.x, y: state.opponent.y },
  }
}

/**
 * Where to draw a fighter between two simulated frames. The simulation runs at
 * a fixed 60 Hz; a 120 Hz screen would otherwise show every position twice and
 * then jump. The drawn body trails the simulation by at most one frame.
 */
export function interpolatedPosition(state: FightState, side: FightSide): { x: number; y: number } {
  const current = state[side]
  const previous = state.previousPositions?.[side]
  if (!previous || state.phase !== 'fighting') return { x: current.x, y: current.y }
  const far = Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) > SNAP_DISTANCE
  if (far) return { x: current.x, y: current.y }
  const alpha = Math.min(1, Math.max(0, state.frameAccumulator / FIXED_STEP))
  return {
    x: previous.x + (current.x - previous.x) * alpha,
    y: previous.y + (current.y - previous.y) * alpha,
  }
}
