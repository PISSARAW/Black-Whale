import type { BodyMotionOptions } from '../fightBodyMotion'
import type { BodyPlan } from '../fightPose'
import { rightHandedPose } from '../fightHandedPose'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightSide, FightState } from '../types'
import { throwPerformance } from './catalogue'
import { sampleThrowBeat, returningThrowPose } from './sample'

export function signatureThrowPlan(options: {
  motion: BodyMotionOptions
  frame: ThrowCinematicFrame
  side: FightSide
  ordinary: BodyPlan
}): BodyPlan | undefined {
  const { frame, side, ordinary, motion } = options
  const performance = throwPerformance(frame.performance)
  if (!performance) return undefined
  const t = frame.age / frame.duration
  const beat = sampleThrowBeat(performance, t)
  const actor = side === frame.attacker
  let pose = actor ? returningThrowPose(beat.attacker, ordinary.pose, t) : beat.victim
  if (actor && performance.rightHand && motion.fighter.facing === -1) pose = rightHandedPose(pose)
  return {
    key: `throw:${performance.id}:${frame.sequence}:${side}`,
    pose,
    blend: 0,
    plant: actor && beat.actorPath![1] === 0,
  }
}

export function signatureThrowPosition(options: {
  state: FightState
  frame: ThrowCinematicFrame
  side?: FightSide
  fallback: { x: number; y: number; z?: number }
}) {
  const { frame, state, fallback } = options
  const performance = throwPerformance(frame.performance)
  if (!performance) return undefined
  const beat = sampleThrowBeat(performance, frame.age / frame.duration)
  if (options.side === frame.attacker) return actorPosition(fallback, beat.actorPath!, frame.facing)
  const grip = state[frame.attacker].x + frame.facing * 5.4
  const x = grip + (fallback.x - grip) * beat.path[0]
  return {
    x: puppetApproach({ state, frame, x }),
    y: fallback.y + beat.path[1],
    z: (fallback.z ?? 0) + beat.path[2] * frame.facing,
  }
}

function actorPosition(
  fallback: { x: number; y: number; z?: number },
  path: readonly [number, number, number],
  facing: 1 | -1,
) {
  return {
    x: fallback.x + path[0] * facing,
    y: fallback.y + path[1],
    z: (fallback.z ?? 0) + path[2] * facing,
  }
}

function puppetApproach(options: { state: FightState; frame: ThrowCinematicFrame; x: number }) {
  const { state, frame, x } = options
  if (!frame.puppetId) return x
  const puppet = state.battlefield?.entities.find(
    (entry) => entry.id === frame.puppetId && entry.present,
  )
  if (!puppet) return x
  const t = frame.age / frame.duration
  const contact = Math.sin(Math.PI * Math.min(1, t / 0.65)) ** 2
  return x + Math.max(-6, Math.min(6, puppet.x - frame.facing * 3.5 - x)) * contact
}
