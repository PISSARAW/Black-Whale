import { animateMelodyFlute, restoreMelodyFlute } from './melodyFigurePose'
import { rightHandedPose } from './fightHandedPose'
import { rosterSustainedMotion } from './rosterSustainedMotion'
import { animateBlinky } from './blinkyFigure'
import { animatePadailleWeapon } from './padailleFigure'
import { easterEggBodyPlan } from './easterEggPoses'
import { padailleKeyedMove } from './padaillePoses'
import { bonolenovDancePlan } from './bonolenovPoses'
import { biohazardBodyPlan } from './biohazardPresentation'
import { crossGameBodyPlan } from './crossGamePresentation'
import { pluggingWoundsPlan } from './blinkyPose'
import { animateMussePistol } from './mussePistol'
import { musseKeyedMove } from './mussePoses'
import { animateCyclotron, cyclotronBodyPlan } from './phinksMotion'
import { benjaminKeyedMove } from './benjaminPoses'
import { chrolloKeyedMove } from './chrolloPoses'
import type { HumanMotion } from '$lib/tour/humanAnimation'
import { animateFranklinHands } from './franklinHands'
import { animateChrolloBook } from './chrolloFigure'
import { attackMotionAccent } from './fightAttackMotion'
import { READY_ARMS } from './fightGestures'
import {
  addPoses,
  lerpPose,
  NEUTRAL_POSE,
  pickJoints,
  STANCE_FRAME_JOINTS,
  UPPER_JOINTS,
  type BodyPlan,
  type FightPose,
} from './fightPose'
import { reactionPlan, type ReactionContext } from './fightReactions'
import {
  applyFightPose,
  captureFootPlant,
  fightRigOf,
  hasFightRig,
  plantFeet,
  resetFightRig,
  type FightRig,
} from './fightRig'
import { AIR_POSE, CROUCH_POSE, fightStance, stanceAt, type FightStance } from './fightStance'
import { attackData } from './frameData'
import { dashPose, landingPose, prejumpPose, walkPose } from './fightLocomotion'
import { keyedMove } from './keyPoseMoves'
import { HANZO_FLOAT_POSE } from './keyPosesHanzo'
import { sampleTimeline } from './keyPoseTimeline'
import { moveById } from './movesets'
import type { ArcadeFighter, AttackKind, AttackVariant, FighterPose, MoveSlot } from './types'

/**
 * Where the fighting rig draws a fighter, frame by frame.
 *
 * Every fighter stands in its stance (`fightStance.ts`, or a plain guard when it
 * has none yet), attacks through its keyed moves (`keyPoseMoves.ts`) and reacts
 * through `fightReactions.ts`. Only a throw tech still falls back to the motion
 * the scene computed.
 *
 * Changing from one plan to another — a stance into a move, a move back to the
 * stance, a hit — cross-fades from the pose last drawn, so the extra joints the
 * visit's animation does not blend (chest, wrists) never jump.
 */
export interface BodyMotionOptions extends ReactionContext {
  fighter: ArcadeFighter
  seconds: number
  /** The motion to play when the rig has nothing for this frame. */
  fallback?: HumanMotion
}

const DEFAULT_STANCE: FightStance = {
  pose: {
    chest: [0.03, -0.3, 0],
    ...READY_ARMS,
    leadHip: [-0.25, 0, 0.04],
    leadKnee: [0.3, 0, 0],
    rearHip: [0.18, 0, -0.04],
    rearKnee: [0.08, 0, 0],
  },
  bounce: 0.06,
  tempo: 1.3,
}

const STANDING_POSES = new Set<FighterPose>(['idle', 'walk', 'guard'])
const ATTACK_POSES = new Set<FighterPose>(['light', 'heavy', 'special', 'ranged'])

export function fightBodyMotion(options: BodyMotionOptions): HumanMotion {
  const { fighter, seconds, fallback } = options
  const plan = bodyPlan(fighter, options)
  return (human) => {
    animateMussePistol(human.figure, fighter)
    animateFranklinHands(human.figure, fighter)
    animateChrolloBook(human.figure, fighter)
    restoreMelodyFlute(human.figure, Boolean(fighter.melodyPerformance))
    if (!plan && !hasFightRig(human.figure)) {
      fallback?.(human)
      return
    }
    const rig = fightRigOf(human)
    resetFightRig(rig)
    if (!plan) {
      remember(rig, { key: 'fallback', pose: NEUTRAL_POSE, seconds })
      fallback?.(human)
      return
    }
    const anchor = plan.plant ? captureFootPlant(rig) : null
    const drawn = blended(rig, plan, seconds)
    applyFightPose(rig, drawn, fighter.facing)
    animatePadailleWeapon(human.figure, fighter, seconds)
    animateCyclotron(rig, fighter)
    animateBlinky(human.figure, fighter, seconds)
    animateMelodyFlute(rig, fighter)
    if (anchor) plantFeet(rig, { anchor, root: drawn.root, facing: fighter.facing })
  }
}

interface PoseMemory {
  key: string
  from: FightPose
  since: number
  last: FightPose
}

const MEMORY = new WeakMap<FightRig, PoseMemory>()

function remember(rig: FightRig, drawn: { key: string; pose: FightPose; seconds: number }): void {
  MEMORY.set(rig, {
    key: drawn.key,
    from: drawn.pose,
    since: drawn.seconds,
    last: drawn.pose,
  })
}

function blended(rig: FightRig, plan: BodyPlan, seconds: number): FightPose {
  const memory = MEMORY.get(rig)
  if (!memory) {
    // The first pose of a figure is drawn as is: there is nothing to fade from.
    remember(rig, { key: plan.key, pose: plan.pose, seconds: -Infinity })
    return plan.pose
  }
  if (memory.key !== plan.key)
    Object.assign(memory, { key: plan.key, from: memory.last, since: seconds })
  const travel =
    plan.blend > 0 ? Math.min(1, Math.max(0, (seconds - memory.since) / plan.blend)) : 1
  const eased = travel * travel * (3 - 2 * travel)
  memory.last = travel >= 1 ? plan.pose : lerpPose(memory.from, plan.pose, eased)
  return memory.last
}

export interface PlanContext extends ReactionContext {
  seconds: number
}

export function bodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  const plan = unmirroredBodyPlan(fighter, context)
  const handed =
    ['chrollo', 'kurapika'].includes(fighter.id) ||
    plan?.key === 'roster-writing' ||
    plan?.key === 'roster-console'
  return plan && handed && fighter.facing === -1
    ? { ...plan, pose: rightHandedPose(plan.pose) }
    : plan
}

function unmirroredBodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  const easterEgg = easterEggBodyPlan(fighter)
  if (easterEgg) return easterEgg
  const special =
    pluggingWoundsPlan(fighter) ?? biohazardBodyPlan(fighter) ?? techniqueBodyPlan(fighter, context)
  if (special) return special
  if (fighter.hanzoProjection && !fighter.attack)
    return {
      pose: HANZO_FLOAT_POSE,
      plant: false,
      key: 'astral-double',
      blend: 0.12,
    }
  const standing = stanceAt(fightStance(fighter.id) ?? DEFAULT_STANCE, context.seconds)
  if (fighter.attack) return attackingPlan(fighter, standing)
  return restingPlan(fighter, standing) ?? reactionPlan(fighter, context, standing)
}

function attackingPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  return ATTACK_POSES.has(fighter.pose) ? attackPlan(fighter, standing) : null
}

function techniqueBodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  const maintained = rosterSustainedMotion(fighter, context.seconds)
  if (maintained) return maintained
  const dance = bonolenovDancePlan(fighter, context.seconds)
  if (dance) return dance
  const crossGame = crossGameBodyPlan(fighter)
  if (crossGame) return crossGame
  const cyclotron = cyclotronBodyPlan(fighter)
  if (cyclotron) return cyclotron
  if (fighter.coveringEars)
    return {
      key: 'cover-ears',
      plant: fighter.y === 0,
      blend: 0.08,
      pose: {
        leadShoulder: [-2.1, 0, 0.5],
        leadElbow: [-1.9, 0, 0],
        rearShoulder: [-2.1, 0, -0.5],
        rearElbow: [-1.9, 0, 0],
      },
    }
  if (fighter.melodyPerformance)
    return {
      key: 'flute-performance',
      plant: true,
      blend: 0.1,
      pose: stanceAt(fightStance('melody')!, context.seconds),
    }

  return null
}

function basePose(variant: AttackVariant, standing: FightPose, authored: boolean): FightPose {
  // Hand-keyed moves strike from the fighter's own guard; family gestures from a ready one.
  const upper = authored ? pickJoints(standing, UPPER_JOINTS) : READY_ARMS
  if (variant === 'low') return addPoses(upper, CROUCH_POSE)
  if (variant === 'air') return addPoses(upper, AIR_POSE)
  if (authored) return standing
  return addPoses(pickJoints(standing, STANCE_FRAME_JOINTS), READY_ARMS)
}

const KIND_SLOTS: Record<AttackKind, Record<AttackVariant, MoveSlot>> = {
  light: {
    standing: 'standingLight',
    low: 'lowLight',
    air: 'airLight',
    throw: 'throw',
  },
  heavy: {
    standing: 'standingHeavy',
    low: 'lowHeavy',
    air: 'airHeavy',
    throw: 'throw',
  },
  special: {
    standing: 'neutralSpecial',
    low: 'downSpecial',
    air: 'airHeavy',
    throw: 'throw',
  },
  ranged: {
    standing: 'neutralSpecial',
    low: 'neutralSpecial',
    air: 'airLight',
    throw: 'throw',
  },
}

function attackPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  const attack = fighter.attack
  // A teched throw is drawn by the scene, both fighters breaking the grab together.
  if (!attack || (attack.variant === 'throw' && fighter.throwTechFrames)) return null
  const variant = attack.variant ?? 'standing'
  const slot = moveById(attack.moveId)?.slot ?? KIND_SLOTS[attack.kind][variant]
  const { timeline, authored } = characterKeyedMove(fighter, slot)
  const frames = attackData(attack.kind, fighter)
  const keyed = sampleTimeline(timeline, { frame: attack.frame, frames })
  const accent = attackMotionAccent({ fighter, frames, authored })
  return {
    pose: addPoses(basePose(variant, standing, authored), keyed, accent),
    plant: variant !== 'air' && fighter.y <= 0,
    key: `attack:${attack.moveId ?? attack.kind}`,
    blend: attackBlend(attack.kind),
  }
}

function characterKeyedMove(fighter: ArcadeFighter, slot: MoveSlot) {
  return (
    padailleKeyedMove(fighter) ??
    musseKeyedMove(fighter) ??
    chrolloKeyedMove(fighter) ??
    benjaminKeyedMove(fighter) ??
    keyedMove(fighter.id, slot)
  )
}

function attackBlend(kind: AttackKind): number {
  return kind === 'light' || kind === 'ranged' ? 1 / 60 : 2 / 60
}

function restingPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  if (!STANDING_POSES.has(fighter.pose) || fighter.y > 0) return null
  // The guard pose raises the arms itself; the stance only sets the frame.
  const guarding = fighter.pose === 'guard'
  const plan = (pose: FightPose, key: string): BodyPlan => ({
    pose,
    plant: true,
    key,
    blend: 0.1,
  })
  const dash = dashPose(fighter, standing)
  if (dash)
    return {
      pose: dash.pose,
      plant: true,
      key: `dash:${dash.forward}`,
      blend: 0.025,
    }
  const prejump = prejumpPose(fighter, standing)
  if (prejump) return { ...prejump, plant: true }
  const landing = landingPose(fighter, standing)
  if (landing) return { ...landing, plant: true }
  if (fighter.crouching) {
    const upper = pickJoints(standing, guarding ? ['chest', 'head'] : UPPER_JOINTS)
    return plan(addPoses(upper, CROUCH_POSE), 'crouch')
  }
  if (guarding) return plan(pickJoints(standing, STANCE_FRAME_JOINTS), 'guard')
  // The walk cycle moves the legs; the stance keeps the guard up over it.
  if (fighter.pose === 'walk') {
    const walking = walkPose(fighter, pickJoints(standing, UPPER_JOINTS))
    return { ...walking, plant: true }
  }
  return plan(standing, 'stance')
}
