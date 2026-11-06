import { bobOf, breathOf, WALK_SPEED } from './navigation'
import type { Vec2 } from './types'

/** The existing gait follows distance and actual speed, scaled by the comfort setting. */
export function walkingHeadMotion(options: {
  velocity: Vec2
  walked: number
  amplitude: number
  seconds: number
}) {
  const { velocity, walked, amplitude, seconds } = options
  const gait = Math.min(1.5, Math.hypot(velocity[0], velocity[1]) / WALK_SPEED)
  const bob = bobOf(walked, amplitude * gait)
  const breath = breathOf(seconds, amplitude * (1 - Math.min(1, gait)))
  return { gait, bob, breath }
}

/** Existing deck-step easing: 10% per frame at 60 Hz, also used on the stair treads. */
export function easeWalkingGround(current: number, target: number, delta: number): number {
  return current + (target - current) * Math.min(1, delta * 6)
}
