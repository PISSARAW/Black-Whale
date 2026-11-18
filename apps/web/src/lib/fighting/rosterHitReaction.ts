import { rosterMoveShape, rosterMotionStyle } from './rosterStrikeMotion'
import { scalePose, type FightPose } from './fightPose'
import type { StrikeShape } from './rosterChoreography'
import type { FightState } from './types'

export interface StrikeContactMotion {
  shape: StrikeShape
  weight: number
}
type Direction = 'straight' | 'turn' | 'rise' | 'crush' | 'trip'
const DIRECTIONS: Record<StrikeShape, Direction> = {
  jab: 'straight',
  cross: 'turn',
  hook: 'turn',
  uppercut: 'rise',
  palm: 'straight',
  hammer: 'crush',
  slash: 'turn',
  thrust: 'straight',
  kick: 'turn',
  spin: 'turn',
  lowJab: 'straight',
  lowKick: 'trip',
  sweep: 'trip',
  airPunch: 'crush',
  airSlash: 'turn',
  dive: 'crush',
  backhand: 'turn',
  charge: 'straight',
}
const POSES: Record<Direction, FightPose> = {
  straight: {
    body: [-0.12, 0, 0],
    chest: [0.18, 0.08, 0],
    head: [-0.18, 0, 0.07],
    leadShoulder: [0.35, 0, 0.2],
    rearShoulder: [0.25, 0, -0.2],
    leadElbow: [0.55, 0, 0],
    rearElbow: [0.45, 0, 0],
    leadKnee: [0.18, 0, 0],
  },
  turn: {
    body: [-0.1, -0.18, 0.08],
    chest: [0.05, -0.46, 0.12],
    head: [-0.16, -0.3, 0.16],
    leadShoulder: [0.4, 0, 0.45],
    rearShoulder: [0.2, 0, -0.25],
    leadElbow: [0.7, 0, 0],
    rearElbow: [0.5, 0, 0],
    rearKnee: [0.25, 0, 0],
  },
  rise: {
    body: [-0.38, 0, 0],
    chest: [-0.25, 0.08, 0],
    head: [-0.32, 0, 0.1],
    leadShoulder: [0.45, 0, 0.5],
    rearShoulder: [0.4, 0, -0.4],
    leadElbow: [0.9, 0, 0],
    rearElbow: [0.8, 0, 0],
    leadHip: [-0.2, 0, 0],
    leadKnee: [0.4, 0, 0],
  },
  crush: {
    body: [0.22, 0, 0],
    chest: [0.35, -0.08, 0.04],
    head: [0.3, 0, 0.1],
    leadShoulder: [0.3, 0, 0.25],
    rearShoulder: [0.3, 0, -0.25],
    leadElbow: [0.6, 0, 0],
    rearElbow: [0.5, 0, 0],
    leadHip: [-0.12, 0, 0],
    leadKnee: [0.5, 0, 0],
    rearKnee: [0.35, 0, 0],
  },
  trip: {
    body: [-0.08, 0, 0.18],
    chest: [0.12, 0.12, 0.14],
    head: [0.1, 0, -0.1],
    leadHip: [0.4, 0, 0.1],
    leadKnee: [0.7, 0, 0],
    rearKnee: [0.15, 0, 0],
    leadShoulder: [0.2, 0, 0.55],
    rearShoulder: [0.2, 0, -0.4],
  },
}

/** Capture direction and the attacker's own amplitude only from a confirmed physical contact. */
export function rosterContactMotion(state: FightState): StrikeContactMotion | undefined {
  const impact = state.impact!
  const attacker = state[impact.attacker]
  if (
    !attacker.attack ||
    attacker.attack.kind !== impact.kind ||
    attacker.attack.variant === 'throw'
  )
    return undefined
  const shape = rosterMoveShape(attacker.attack.moveId)
  if (!shape) return undefined
  const amplitude = rosterMotionStyle(attacker.id)?.amplitude ?? 1
  return {
    shape: impact.antiAir ? 'uppercut' : shape,
    weight: amplitude * (impact.kind === 'light' ? 0.72 : 1),
  }
}

export function rosterHitReaction(context: {
  strikeMotion?: StrikeContactMotion
  progress: number
}): FightPose | null {
  const motion = context.strikeMotion
  if (!motion) return null
  const release = Math.min(1, Math.max(0, (context.progress - 0.4) / 0.6))
  const strength = motion.weight * (1 - release * release * (3 - 2 * release))
  return scalePose(POSES[DIRECTIONS[motion.shape]], strength)
}
