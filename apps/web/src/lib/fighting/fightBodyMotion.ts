import type { HumanMotion } from '$lib/tour/humanAnimation'
import {
  addPoses,
  pickJoints,
  STANCE_FRAME_JOINTS,
  UPPER_JOINTS,
  type FightPose,
} from './fightPose'
import {
  applyFightPose,
  fightRigOf,
  footHeight,
  hasFightRig,
  plantFeet,
  resetFightRig,
} from './fightRig'
import { AIR_POSE, CROUCH_POSE, fightStance, stanceAt } from './fightStance'
import { attackData } from './frameData'
import { keyPoseTimeline } from './keyPoseMoves'
import { sampleTimeline } from './keyPoseTimeline'
import { moveById } from './movesets'
import type { ArcadeFighter, AttackVariant, FighterPose } from './types'

/**
 * Where the fighting rig takes over from the procedural gestures.
 *
 * A fighter with a stance (`fightStance.ts`) is drawn in it whenever it is
 * standing, walking, guarding or crouching, and its keyed moves
 * (`keyPoseMoves.ts`) replace the old gestures. Everything else — hits,
 * knockdowns, throws, unkeyed moves, fighters without a stance — falls back to
 * the motion the scene already computed.
 */
export interface BodyMotionOptions {
  fighter: ArcadeFighter
  seconds: number
  /** The motion to play when the rig has nothing keyed for this frame. */
  fallback?: HumanMotion
}

interface BodyPlan {
  pose: FightPose
  /** Keep the lower foot on the floor. */
  plant: boolean
}

const STANDING_POSES = new Set<FighterPose>(['idle', 'walk', 'guard'])
const ATTACK_POSES = new Set<FighterPose>(['light', 'heavy', 'special', 'ranged'])

export function fightBodyMotion({ fighter, seconds, fallback }: BodyMotionOptions): HumanMotion {
  const plan = bodyPlan(fighter, seconds)
  return (human) => {
    if (plan || hasFightRig(human.figure)) resetFightRig(fightRigOf(human))
    if (!plan) {
      fallback?.(human)
      return
    }
    const rig = fightRigOf(human)
    const before = plan.plant ? footHeight(rig) : 0
    applyFightPose(rig, plan.pose, fighter.facing)
    if (plan.plant) plantFeet(rig, before)
  }
}

export function bodyPlan(fighter: ArcadeFighter, seconds: number): BodyPlan | null {
  const stance = fightStance(fighter.id)
  if (!stance) return null
  const standing = stanceAt(stance, seconds)
  if (fighter.attack) return ATTACK_POSES.has(fighter.pose) ? attackPlan(fighter, standing) : null
  return restingPlan(fighter, standing)
}

function basePose(variant: AttackVariant, standing: FightPose): FightPose {
  const upper = pickJoints(standing, UPPER_JOINTS)
  if (variant === 'low') return addPoses(upper, CROUCH_POSE)
  if (variant === 'air') return addPoses(upper, AIR_POSE)
  return standing
}

function attackPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  const attack = fighter.attack
  const move = moveById(attack?.moveId)
  const timeline = attack && move ? keyPoseTimeline(fighter.id, move.slot) : null
  if (!attack || !timeline) return null
  const frames = attackData(attack.kind, fighter)
  const keyed = sampleTimeline(timeline, { frame: attack.frame, frames })
  const variant = attack.variant ?? 'standing'
  return { pose: addPoses(basePose(variant, standing), keyed), plant: variant !== 'air' }
}

function restingPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  if (!STANDING_POSES.has(fighter.pose) || fighter.y > 0) return null
  // The guard pose raises the arms itself; the stance only sets the frame.
  const guarding = fighter.pose === 'guard'
  if (fighter.crouching) {
    const upper = pickJoints(standing, guarding ? ['chest', 'head'] : UPPER_JOINTS)
    return { pose: addPoses(upper, CROUCH_POSE), plant: true }
  }
  if (guarding) return { pose: pickJoints(standing, STANCE_FRAME_JOINTS), plant: true }
  // The walk cycle moves the legs; the stance keeps the guard up over it.
  if (fighter.pose === 'walk') return { pose: pickJoints(standing, UPPER_JOINTS), plant: true }
  return { pose: standing, plant: true }
}
