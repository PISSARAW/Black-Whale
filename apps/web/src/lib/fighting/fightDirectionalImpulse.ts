import { scalePose, type FightPose } from './fightPose'
import { fightStrikeLimb } from './fightStrikeLimb'
import type { PhysicalHit } from './fightHitResponse'
import type { ArcadeFighter } from './types'
import type { StrikeShape } from './rosterChoreography'

export function impactTwist(fighter: ArcadeFighter, shape: StrikeShape): number {
  const limb = fightStrikeLimb(fighter, 'hands')
  const side = limb === 'left' ? -1 : 1
  return ['cross', 'hook', 'backhand', 'slash', 'spin', 'kick'].includes(shape) ? side : side * -0.3
}

/** Direction and the receiving side separate a turn, a crush, an uppercut and a lost leg support. */
export function directionalImpulse(hit: PhysicalHit, age: number): FightPose {
  const turn = hit.twist * hit.profile.rotation
  const lag = Math.min(1, Math.max(0, (age - 1) / 4))
  const strength = hit.force * lag * lag * (3 - 2 * lag)
  const side = Math.sign(hit.twist)
  if (hit.rising)
    return scalePose(
      {
        head: [-0.18, 0, 0],
        chest: [-0.18, turn * -0.12, 0],
        leadShoulder: [0.25, 0, 0.35],
        rearShoulder: [-0.12, 0, -0.15],
        leadHip: [-0.22, 0, 0],
        rearKnee: [0.32, 0, 0],
      },
      strength,
    )
  if (hit.crush)
    return scalePose(
      {
        chest: [0.2, turn * -0.08, 0],
        head: [0.16, 0, 0],
        leadKnee: [0.35, 0, 0],
        rearKnee: [0.2, 0, 0],
      },
      strength,
    )
  const low = hit.zone === 'feet'
  return scalePose(
    {
      chest: [0, turn * -0.16, low ? -side * 0.08 : side * 0.09],
      leadShoulder: [side * 0.2, -turn * 0.2, 0.16],
      rearShoulder: [-side * 0.16, turn * 0.15, -0.1],
      leadHip: [low ? 0.22 : 0, turn * 0.16, side * 0.06],
      rearHip: [0, -turn * 0.1, 0],
    },
    strength,
  )
}
