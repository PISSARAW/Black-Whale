import { pointInPolygon } from '../tour/geometry'
import type { Vec2 } from '../tour/types'
import type { CombatState } from '../combat/types'
import type { ReplayCommand } from './replay/types'

/**
 * Keeps the first-person camera and the duel's body in one place.
 *
 * The camera is walked by `TourScene`; the body is moved by the rules — an
 * evade, the push of a blow, a tether, a teleporting hatsu. Each frame one of
 * the two has the last word:
 *
 * - the rules moved the body since the two last agreed → the camera follows;
 * - otherwise the visitor walked → the walk is offered to the rules, and if
 *   they refuse it (bound, down, winding up, or a step out of the room) the
 *   camera is put back where the body still is.
 */
export interface WalkFrame {
  /** Where the camera reports the visitor, and which way they face. */
  camera: Vec2
  heading: number
  state: CombatState
  /** Where camera and body last stood together. */
  agreed: Vec2
}

export type WalkDispatch = (action: ReplayCommand) => CombatState

const TOLERANCE = 0.001

/** Returns where the camera has to be moved to, or null when it may stay. */
export function reconcileWalk(frame: WalkFrame, dispatch: WalkDispatch): Vec2 | null {
  let state = frame.state
  if (state.outcome !== 'playing') return null
  if (Math.abs(frame.heading - state.player.facing) > TOLERANCE) {
    state = dispatch({ type: 'FACE', side: 'player', heading: frame.heading })
  }
  const body = state.player.position
  if (!samePlace(body, frame.agreed)) return body
  if (samePlace(frame.camera, body)) return null
  if (pointInPolygon(frame.camera, state.terrain.footprint)) {
    state = dispatch({ type: 'SYNC_POSITION', side: 'player', position: frame.camera })
  }
  return samePlace(frame.camera, state.player.position) ? null : state.player.position
}

export function samePlace(a: Vec2, b: Vec2): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < TOLERANCE
}
