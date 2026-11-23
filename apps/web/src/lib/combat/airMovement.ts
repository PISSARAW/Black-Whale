import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2, WallSegment } from '../tour/types'
import { distance, MIN_SEPARATION, MOVE_SPEED } from './fighter'
import { JUMP_INITIAL_VELOCITY, jumpTrajectory } from './locomotion'
import type { FighterState } from './types'

const AIR_DRIFT_FACTOR = 0.8

interface AirStep {
  fighter: FighterState
  rival: FighterState
  walls: WallSegment[]
  dt: number
}

export function startJump(fighter: FighterState, vector: Vec2): FighterState {
  const refused =
    fighter.condition !== 'ready' ||
    fighter.cooldown > 0 ||
    fighter.intent !== null ||
    fighter.bound > 0 ||
    fighter.jump !== null ||
    fighter.height > 0
  if (refused) return fighter
  return {
    ...fighter,
    movement: [0, 0],
    guardWindow: 0,
    jump: { elapsed: 0, velocity: JUMP_INITIAL_VELOCITY, direction: unit(vector) },
  }
}

/** Advances the deterministic jump arc and its take-off direction in the open room. */
export function advanceAirMovement({ fighter, rival, walls, dt }: AirStep): FighterState {
  if (!fighter.jump) return fighter
  const elapsed = fighter.jump.elapsed + dt
  const trajectory = jumpTrajectory(fighter.jump.velocity, elapsed)
  if (trajectory.grounded) return { ...fighter, height: 0, jump: null }
  const step = MOVE_SPEED * AIR_DRIFT_FACTOR * dt
  const proposed: Vec2 = [
    fighter.position[0] + fighter.jump.direction[0] * step,
    fighter.position[1] + fighter.jump.direction[1] * step,
  ]
  const position = resolveMovement(fighter.position, proposed, {
    walls: wallsNear(walls, fighter.position, step + 1),
    radius: 0.45,
  })
  return {
    ...fighter,
    height: trajectory.height,
    position: distance(position, rival.position) >= MIN_SEPARATION ? position : fighter.position,
    jump: { ...fighter.jump, elapsed },
  }
}

function unit(vector: Vec2): Vec2 {
  const length = Math.hypot(vector[0], vector[1])
  return length === 0 ? [0, 0] : [vector[0] / length, vector[1] / length]
}
