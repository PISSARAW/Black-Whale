import { bodyPlan, type BodyMotionOptions } from './fightBodyMotion'
import { lerpPose, type BodyPlan, type FightPose } from './fightPose'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { ThrowCinematicFrame } from './throwCinematic'

type Position = { x: number; y: number; z?: number }
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

/** A short visible arc connects the confirmed grip to the real landing position. */
export function throwBodyPosition(options: {
  state: FightState
  side: FightSide
  frame: ThrowCinematicFrame | null
  fallback: Position
}): Position {
  const { state, side, frame, fallback } = options
  if (!frame?.active || side !== frame.victim) return fallback
  const t = smooth(frame.age / (frame.duration * 0.78))
  const grip = state[frame.attacker].x + frame.facing * 6.5
  return {
    ...fallback,
    x: grip + (fallback.x - grip) * t,
    y: fallback.y + (t === 1 ? 0 : Math.sin(t * Math.PI) * 5.5),
  }
}

export function thrownVisualFighter(fighter: ArcadeFighter, position: Position): ArcadeFighter {
  return { ...fighter, y: position.y, pose: fighter.health > 0 ? 'down' : 'ko' }
}

const GRIP: FightPose = {
  body: [0.2, 0, 0],
  chest: [0.18, -0.18, 0],
  head: [-0.2, 0, 0],
  leadShoulder: [-1.25, 0, 0.2],
  rearShoulder: [-1.15, 0, -0.2],
  leadElbow: [-0.85, 0, 0],
  rearElbow: [-0.9, 0, 0],
  leadHip: [-0.35, 0, 0.08],
  leadKnee: [0.55, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const TURN: FightPose = {
  body: [0.42, -0.35, 0],
  chest: [0.25, -0.6, 0],
  head: [-0.25, 0.2, 0],
  leadShoulder: [-1.45, 0, 0.1],
  rearShoulder: [-1.1, 0.2, -0.25],
  leadElbow: [-1.1, 0, 0],
  rearElbow: [-1.3, 0, 0],
  leadHip: [-0.4, 0, 0.12],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.4, 0, 0],
}
const LIFT: FightPose = {
  body: [-0.55, 0.25, 0.12],
  head: [0.18, 0, 0],
  leadShoulder: [-0.35, 0, 0.7],
  rearShoulder: [-0.5, 0, -0.65],
  leadElbow: [-0.8, 0, 0],
  rearElbow: [-0.85, 0, 0],
  leadHip: [-0.55, 0, 0.18],
  rearHip: [-0.4, 0, -0.15],
  leadKnee: [0.95, 0, 0],
  rearKnee: [0.8, 0, 0],
}

const LAND: FightPose = {
  body: [-1.48, -0.1, 0.03],
  chest: [0.05, -0.12, 0],
  head: [0.2, 0, 0.12],
  leadShoulder: [-0.15, 0, 0.82],
  rearShoulder: [-0.2, 0, -0.8],
  leadElbow: [-0.55, 0, 0],
  rearElbow: [-0.75, 0, 0],
  leadHip: [-0.25, 0, 0.08],
  leadKnee: [0.65, 0, 0],
  rearHip: [-0.05, 0, -0.08],
  rearKnee: [0.22, 0, 0],
}

export function throwBodyPlan(
  options: BodyMotionOptions & {
    side: FightSide
    throwFrame?: ThrowCinematicFrame | null
  },
): BodyPlan | undefined {
  const frame = options.throwFrame
  if (!frame) return undefined
  const ordinary = bodyPlan(options.fighter, options)
  if (!ordinary) return undefined
  const progress = frame.age / frame.duration
  const actor = options.side === frame.attacker
  if (actor && !frame.active) return undefined
  if (!actor && !frame.active && options.progress >= 0.5) return undefined
  const pose = actor ? throwingPose(ordinary.pose, progress) : thrownPose(progress)
  return { key: `throw-film:${frame.sequence}:${options.side}`, pose, plant: actor, blend: 0 }
}

function throwingPose(ordinary: FightPose, progress: number): FightPose {
  const turn = lerpPose(GRIP, TURN, smooth(progress / 0.5))
  return lerpPose(turn, ordinary, smooth((progress - 0.55) / 0.45))
}

function thrownPose(progress: number): FightPose {
  const lifted = lerpPose({ ...LIFT, body: [0.25, 0, 0] }, LIFT, smooth(progress / 0.4))
  return lerpPose(lifted, LAND, smooth((progress - 0.4) / 0.38))
}
