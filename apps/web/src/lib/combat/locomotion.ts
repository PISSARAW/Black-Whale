import { resolveMovement, wallsNear } from '../tour/navigation'
import { pointInPolygon } from '../tour/geometry'
import type { CombatSide, CombatState, FighterState } from './types'
import type { CombatBoundary, Vec2 } from '../tour/types'
import { MOVE_SPEED, MIN_SEPARATION, distance } from './fighter'
import { usesClashNen } from './clashNen'

/** How fast a jump leaves the ground, in metres per second. */
export const JUMP_INITIAL_VELOCITY = 4.5

/** Gravity of a jump, in metres per second squared. */
export const JUMP_GRAVITY = 9.8

/** Two positions closer than this are the same position. */
const SAME_POSITION_EPSILON = 1e-6

export interface JumpTrajectory {
  /** Height of the body above the ground, in metres, at `dt` seconds. */
  height: number
  /** Whether the body is back on the ground at `dt` seconds. */
  grounded: boolean
}

/**
 * Pure jump arc: launch velocity and elapsed seconds give the height and the
 * air time. No frame counter, no render input, no clock — the trajectory is a
 * function of its own inputs so replays and rollback stay deterministic.
 */
export function jumpTrajectory(vy: number, dt: number): JumpTrajectory {
  const height = vy * dt - (JUMP_GRAVITY * dt * dt) / 2
  return { height, grounded: height <= 0 }
}

/**
 * The distance a lunge has committed at `progress` of its authored launch,
 * eased from zero into the full lunge at the strike — the same three-beat shape
 * the animation frame data uses, read as pure numbers.
 */
export function lungeAdvance(lunge: number, progress: number): number {
  const t = Math.min(1, Math.max(0, progress))
  const eased = t * t * (3 - 2 * t)
  return lunge * eased
}

export interface OpenMove {
  fighter: FighterState
  /** The open boundary crossed by the move, when it left the footprint. */
  crossed: CombatBoundary | null
  /** Whether the crossing is a sanctioned expulsion. */
  expelled: boolean
}

function gated(fighter: FighterState, state: CombatState): boolean {
  if (fighter.condition !== 'ready' || fighter.intent || fighter.bound > 0) return true
  return fighter.ko !== null && !usesClashNen(state)
}

function orientation(a: Vec2, b: Vec2, c: Vec2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function segmentsCross(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  return o1 * o2 < 0 && o3 * o4 < 0
}

function crossedOpenBoundary(
  terrain: CombatState['terrain'],
  from: Vec2,
  to: Vec2,
): CombatBoundary | null {
  if (!pointInPolygon(from, terrain.footprint) || pointInPolygon(to, terrain.footprint)) return null
  for (const boundary of terrain.boundaries ?? []) {
    const [start, end] = boundary.edge
    if (segmentsCross(from, to, start, end)) return boundary
  }
  return null
}

function resolveCrossing(
  terrain: CombatState['terrain'],
  from: Vec2,
  to: Vec2,
): { crossed: CombatBoundary | null; barrierBlocks: boolean } {
  if (pointInPolygon(to, terrain.footprint)) return { crossed: null, barrierBlocks: false }
  const crossed = crossedOpenBoundary(terrain, from, to)
  if (crossed?.kind !== 'danger') return { crossed, barrierBlocks: false }
  if (crossed.barrierHeight > 0) return { crossed: null, barrierBlocks: true }
  return { crossed, barrierBlocks: false }
}

export function moveThroughOpenRoom(state: CombatState, side: CombatSide, dt: number): OpenMove {
  const fighter = state[side]
  if (gated(fighter, state)) {
    return { fighter: { ...fighter, movement: [0, 0] }, crossed: null, expelled: false }
  }
  const proposed: Vec2 = [
    fighter.position[0] + fighter.movement[0] * MOVE_SPEED * dt,
    fighter.position[1] + fighter.movement[1] * MOVE_SPEED * dt,
  ]
  const resolved = resolveMovement(fighter.position, proposed, {
    walls: wallsNear(state.terrain.walls, fighter.position, MOVE_SPEED * dt + 2),
    radius: 0.45,
  })
  const rival = side === 'player' ? state.opponent.position : state.player.position
  const separated = distance(resolved, rival) < MIN_SEPARATION
  const wallBlocked = distance(resolved, proposed) > SAME_POSITION_EPSILON
  const fighterStep: FighterState = separated
    ? { ...fighter, movement: [0, 0] }
    : { ...fighter, position: resolved, movement: fighter.movement }
  const standing = !separated && !wallBlocked
  const { crossed, barrierBlocks } = standing
    ? resolveCrossing(state.terrain, fighter.position, fighterStep.position)
    : { crossed: null, barrierBlocks: false }
  let fighterOut = fighterStep
  let expelled = false
  if (standing && barrierBlocks) {
    // A railing blocks the ground walk; a jump or a knockback clears it.
    fighterOut = { ...fighter, movement: [0, 0] }
  } else if (crossed?.kind === 'danger') {
    expelled = true
  }
  return { fighter: fighterOut, crossed, expelled }
}
