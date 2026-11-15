import type { HumanMotion } from '$lib/tour/humanAnimation'
import type { ArcadeFighter } from './types'

export const FIGHTER_FACING_ANGLE = 1.25
export const FIGHTER_TURN_DURATION = 10 / 60

const HEAD_SWAY_SPEED = 0.37
const HEAD_SWAY_AMOUNT = 0.08
const MAX_HEAD_YAW = 0.48
const MAX_HEAD_PITCH = 0.2

export interface FighterFacingTransition {
  angle: number
  from: number
  target: number
  startedAt: number
}

const facingAngle = (facing: ArcadeFighter['facing']) => facing * FIGHTER_FACING_ANGLE
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))
const smoothstep = (value: number) => {
  const progress = clamp(value, 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function advanceFacing(transition: FighterFacingTransition, seconds: number): number {
  const progress = smoothstep((seconds - transition.startedAt) / FIGHTER_TURN_DURATION)
  transition.angle = transition.from + (transition.target - transition.from) * progress
  return transition.angle
}

export function createFighterFacing(
  facing: ArcadeFighter['facing'],
  seconds = 0,
): FighterFacingTransition {
  const angle = facingAngle(facing)
  return { angle, from: angle, target: angle, startedAt: seconds }
}

/** Smooth a side switch over ten 60 Hz frames, without delaying the initial pose. */
export function updateFighterFacing(
  transition: FighterFacingTransition,
  facing: ArcadeFighter['facing'],
  seconds: number,
): number {
  advanceFacing(transition, seconds)
  const target = facingAngle(facing)
  if (target !== transition.target) {
    transition.from = transition.angle
    transition.target = target
    transition.startedAt = seconds
  }
  return advanceFacing(transition, seconds)
}

interface OpponentTrackingOptions {
  fighter: Pick<ArcadeFighter, 'facing' | 'x' | 'y'>
  opponent?: Pick<ArcadeFighter, 'x' | 'y'>
  bodyAngle: number
  seconds: number
  motion?: HumanMotion
}

/** Layer opponent tracking on top of a move while cancelling the generic idle head sweep. */
export function trackFightOpponent({
  fighter,
  opponent,
  bodyAngle,
  seconds,
  motion,
}: OpponentTrackingOptions): HumanMotion {
  const deltaX = opponent ? opponent.x - fighter.x : fighter.facing
  const direction = deltaX === 0 ? fighter.facing : Math.sign(deltaX)
  const targetWorldAngle = direction * (Math.PI / 2)
  const headPitch = opponent
    ? clamp(-Math.atan2(opponent.y - fighter.y, Math.max(1, Math.abs(deltaX))), -MAX_HEAD_PITCH, MAX_HEAD_PITCH)
    : 0

  return (rig) => {
    motion?.(rig)
    const headYaw = clamp(
      targetWorldAngle - bodyAngle - rig.figure.rotation.y,
      -MAX_HEAD_YAW,
      MAX_HEAD_YAW,
    )
    rig.head.rotation.y += headYaw - Math.sin(seconds * HEAD_SWAY_SPEED) * HEAD_SWAY_AMOUNT
    rig.head.rotation.x += headPitch
  }
}
