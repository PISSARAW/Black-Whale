import { isAirPursuit } from './directionalChain'
import { fightPhysicalProfile, type FightPhysicalProfile } from './fightPhysicalProfile'
import {
  addPoses,
  lerpPose,
  pickJoints,
  scalePose,
  UPPER_JOINTS,
  type FightPose,
} from './fightPose'
import { rosterMoveShape, rosterMotionStyle } from './rosterStrikeMotion'
import type { ArcadeFighter, MoveSlot } from './types'

const LOADS = {
  'hisoka:finisher': {
    root: [0, -0.07, -0.07],
    body: [0.21, 0.12, 0],
    chest: [-0.07, -0.28, 0.07],
    leadHip: [-0.28, 0, 0.04],
    leadKnee: [0.88, 0, 0],
    rearKnee: [0.19, 0, 0],
  },
  'kurapika:forwardSpecial': {
    body: [0.02, 0.19, 0],
    chest: [0.04, 0.47, -0.06],
    leadKnee: [0.19, 0, 0],
    rearKnee: [0.26, 0, 0],
  },
} as const satisfies Record<string, FightPose>

type Support = 'front' | 'rear' | 'both'
type AuthoredPursuit = keyof typeof LOADS

export interface PursuitGesture {
  load: FightPose
  support?: Support
  keepNativeStartup: boolean
}

const AUTHORED: Record<AuthoredPursuit, PursuitGesture> = {
  'hisoka:finisher': { load: LOADS['hisoka:finisher'], support: 'rear', keepNativeStartup: false },
  'kurapika:forwardSpecial': {
    load: LOADS['kurapika:forwardSpecial'],
    support: 'front',
    keepNativeStartup: false,
  },
}

const BRACED_TECHNIQUES = new Set([
  'franklin:forwardSpecial',
  'theta:forwardSpecial',
  'benjamin:neutralSpecial',
  'biscuit:finisher',
  'shizuku:forwardSpecial',
])
const PIVOT_SHAPES = new Set(['spin', 'sweep', 'airSlash', 'slash', 'backhand'])
const CHEST = ['chest'] as const
const BODY_LOAD = ['root', 'body', 'chest', 'leadHip', 'rearHip', 'leadKnee', 'rearKnee'] as const

export function pursuitGesture(fighter: ArcadeFighter, slot: MoveSlot): PursuitGesture | undefined {
  const attack = fighter.attack
  if (!attack || !isAirPursuit(attack.directionalChain)) return
  const authored = authoredPursuit(attack.moveId)
  if (authored) return authored
  const style = rosterMotionStyle(fighter.id)
  if (!style) return
  const support = pursuitStance(fighter, slot)
  return {
    load: addPoses(
      physicalLoad(
        fightPhysicalProfile(fighter),
        support,
        pickJoints(style.drive, CHEST).chest?.[1] ?? 0,
      ),
      scalePose(pickJoints(style.load, BODY_LOAD), 0.48),
    ),
    support,
    keepNativeStartup: true,
  }
}

function authoredPursuit(move?: string): PursuitGesture | undefined {
  if (move === 'hisoka:finisher' || move === 'kurapika:forwardSpecial') return AUTHORED[move]
}

function pursuitStance(fighter: ArcadeFighter, slot: MoveSlot): Support | undefined {
  if (fighter.hanzoProjection) return
  const move = fighter.attack?.moveId ?? `${fighter.id}:${slot}`
  if (BRACED_TECHNIQUES.has(move)) return 'both'
  return PIVOT_SHAPES.has(rosterMoveShape(move) ?? '') ? 'front' : 'rear'
}

function physicalLoad(
  profile: FightPhysicalProfile,
  support: Support | undefined,
  rotation: number,
): FightPose {
  const { rotation: turn, tuck, step, resistance } = profile
  const wind = (rotation || -0.11) * -turn
  return {
    root: [0, support ? -0.048 / resistance : 0, -0.046 * step],
    body: [0.12 * step, wind * 0.5, 0],
    chest: [0.035, wind, 0],
    leadHip: [-0.17 * tuck, 0, 0],
    rearHip: [0.12 * step, 0, 0],
    leadKnee: [(support === 'rear' ? 0.39 : 0.23) * tuck, 0, 0],
    rearKnee: [(support === 'front' ? 0.38 : 0.21) * tuck, 0, 0],
  }
}

/** Carry the lower body through the cancel while the hands enter their native technique. */
export function pursuitLoad(
  pose: FightPose,
  gesture: PursuitGesture,
  timing: { progress: number; native: FightPose },
): FightPose {
  const weight = pursuitLoadWeight(timing.progress)
  if (!weight) return pose
  const authored = gesture.keepNativeStartup
    ? lerpPose(
        pickJoints(pose, UPPER_JOINTS),
        pickJoints(timing.native, UPPER_JOINTS),
        weight * 0.72,
      )
    : {}
  return addPoses({ ...pose, ...authored }, scalePose(gesture.load, weight))
}

export function pursuitLoadWeight(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0
  return 16 * progress ** 2 * (1 - progress) ** 2
}

export function pursuitSupport(
  gesture: PursuitGesture,
  facing: 1 | -1,
): 0 | 1 | 'both' | undefined {
  if (!gesture.support || gesture.support === 'both') return gesture.support
  return Number((gesture.support === 'front') === (facing === 1)) as 0 | 1
}
