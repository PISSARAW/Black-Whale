import { animateBenjaminRifle } from './benjaminRiflePose'
import { onAwakeningBodyPlan } from './onAwakening'
import { animateMelodyFlute, restoreMelodyFlute } from './melodyFigurePose'
import { expressiveFightMotion } from './fightExpressionMotion'
import { rightHandedPose } from './fightHandedPose'
import { usesRightHandPose } from './fightHandConvention'
import { fighterKeyedMove } from './fighterKeyedMove'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import { rosterSustainedMotion } from './rosterSustainedMotion'
import { animateBlinky } from './blinkyFigure'
import { animatePadailleWeapon } from './padailleFigure'
import { easterEggBodyPlan } from './easterEggPoses'
import { bonolenovDancePlan } from './bonolenovPoses'
import { biohazardBodyPlan } from './biohazardPresentation'
import { crossGameBodyPlan } from './crossGamePresentation'
import { pluggingWoundsPlan } from './blinkyPose'
import { animateServiceHandgun } from './serviceHandgun'
import { animateCyclotron, cyclotronBodyPlan } from './phinksMotion'
import type { HumanMotion } from '$lib/tour/humanAnimation'
import { animateFranklinHands } from './franklinHands'
import { animateChrolloBook } from './chrolloFigure'
import { attackMotionAccent } from './fightAttackMotion'
import { strikePresentationFrame } from './fightStrikeRhythm'
import { strikeSupportPose } from './fightStrikeSupport'
import { strikeSilhouette } from './fightStrikeSilhouette'
import { postureSupportLeg } from './fightSupportCycle'
import { closeBodyPlan } from './fightClosePosture'
import { bridgeTarget, flowThroughBridge } from './duelAttackBridges'
import { beginPoseTransition, type PoseMemory } from './fightPoseMemory'
import { attackTransfer, recoveryTransfer } from './fightAttackWeight'
import { COMBO_LINK_SECONDS, flowIntoAttack, type AttackFlowFrame } from './fightAttackFlow'
import { transferAttackWeight } from './fightWeightTransfer'
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
  poseFraction?: number
  onAwakeningFrame?: number | null
  /** The motion to play when the rig has nothing for this frame. */
  fallback?: HumanMotion
  /** A support script can author its motion on the same articulated rig as the roster. */
  plan?: BodyPlan
  activity?: number
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
  const plan = options.plan ?? bodyPlan(fighter, options)
  return expressiveFightMotion(options, (human) => {
    animateServiceHandgun(human.figure, fighter)
    syncConfiscatedWeapons(human.figure, fighter)
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
    const drawn = drawBodyPose(options, rig, plan)
    applyFightPose(rig, drawn, fighter.facing)
    animatePadailleWeapon(human.figure, fighter, seconds)
    animateCyclotron(rig, fighter)
    animateBlinky(human.figure, fighter, seconds)
    animateMelodyFlute(rig, fighter)
    animateBenjaminRifle(rig, fighter)
    if (anchor)
      plantFeet(rig, {
        anchor,
        root: drawn.root,
        facing: fighter.facing,
        transfer: Boolean(plan.attackFlow?.transfer),
      })
  })
}

const MEMORY = new WeakMap<FightRig, PoseMemory>()

function drawBodyPose(options: BodyMotionOptions, rig: FightRig, plan: BodyPlan): FightPose {
  return options.poseContinuity?.(plan, options.seconds) ?? blended(rig, plan, options.seconds)
}

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
    MEMORY.get(rig)!.attack = plan.attackFlow
    return plan.pose
  }
  const attack = plan.attackFlow
  if (memory.key !== plan.key || attackRestarted(memory.attack, attack))
    beginPoseTransition(memory, plan, seconds)
  memory.attack = attack
  if (attack) {
    memory.last = attackTransition(memory, { pose: plan.pose, attack })
    return memory.last
  }
  const blend = memory.link ? Math.max(COMBO_LINK_SECONDS, plan.blend) : plan.blend
  const travel = blend > 0 ? Math.min(1, Math.max(0, (seconds - memory.since) / blend)) : 1
  const eased = travel * travel * (3 - 2 * travel)
  memory.last = travel >= 1 ? plan.pose : lerpPose(memory.from, plan.pose, eased)
  return memory.last
}

function attackTransition(memory: PoseMemory, plan: { pose: FightPose; attack: AttackFlowFrame }) {
  const { attack, pose } = plan
  const progress = memory.since === -Infinity ? 1 : attack.frame / Math.max(1, attack.startup)
  const drawn =
    memory.bridge && attack.contact && progress < 1
      ? flowThroughBridge({
          from: memory.from,
          contact: attack.contact,
          load: memory.bridge,
          progress,
        })
      : flowIntoAttack({ from: memory.from, to: pose, progress, chained: Boolean(memory.chained) })
  return memory.shiftWeight && attack.transfer
    ? transferAttackWeight({ from: memory.from, pose: drawn, transfer: attack.transfer, progress })
    : drawn
}

function attackRestarted(previous?: AttackFlowFrame, current?: AttackFlowFrame): boolean {
  return Boolean(previous && current && current.frame < previous.frame - 1)
}

export interface PlanContext extends ReactionContext {
  seconds: number
  poseFraction?: number
  onAwakeningFrame?: number | null
}

export function bodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  const ordinary = fallingBodyPlan(fighter, context) ?? unmirroredBodyPlan(fighter, context)
  const awake = onAwakeningBodyPlan({ fighter, frame: context.onAwakeningFrame, ordinary })
  const plan = awake && closeBodyPlan(awake, fighter, context.rival)
  return plan && usesRightHandPose(fighter, plan.key) && fighter.facing === -1
    ? rightHandedPlan(plan)
    : plan
}

function rightHandedPlan(plan: BodyPlan): BodyPlan {
  const attack = plan.attackFlow
  return {
    ...plan,
    pose: rightHandedPose(plan.pose),
    attackFlow: attack?.contact ? { ...attack, contact: rightHandedPose(attack.contact) } : attack,
  }
}

function fallingBodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  if (!['down', 'ko', 'wakeup'].includes(fighter.pose)) return null
  const standing = stanceAt(fightStance(fighter.id) ?? DEFAULT_STANCE, context.seconds)
  return reactionPlan(fighter, context, standing)
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
  if (fighter.attack) return attackingPlan(fighter, standing, context.poseFraction)
  return restingPlan(fighter, standing) ?? reactionPlan(fighter, context, standing)
}
function luiniBodyPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (!fighter.luiniPassage || fighter.hitStun > 0) return null
  return {
    key: 'luini-occupied-passage',
    plant: false,
    blend: 0.08,
    pose: stanceAt(fightStance(fighter.id) ?? DEFAULT_STANCE, 0),
  }
}

function attackingPlan(
  fighter: ArcadeFighter,
  standing: FightPose,
  fraction?: number,
): BodyPlan | null {
  return ATTACK_POSES.has(fighter.pose) ? attackPlan(fighter, standing, fraction) : null
}

function techniqueBodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  const maintained = luiniBodyPlan(fighter) ?? rosterSustainedMotion(fighter, context.seconds)
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

function attackPlan(fighter: ArcadeFighter, standing: FightPose, fraction = 0): BodyPlan | null {
  const attack = fighter.attack
  // A teched throw is drawn by the scene, both fighters breaking the grab together.
  if (!attack || hasTechedThrow(fighter)) return null
  const variant = attack.variant ?? 'standing'
  const slot = moveById(attack.moveId)?.slot ?? KIND_SLOTS[attack.kind][variant]
  const { timeline, authored } = fighterKeyedMove(fighter, slot)
  const frames = attackData(attack.kind, fighter)
  const frame = attack.frame + fraction
  const base = basePose(variant, standing, authored)
  const transfer = attackTransfer(fighter, slot)
  const recovery = recoveryTransfer(fighter, { transfer, frame, frames })
  const poseAt = (at: number) =>
    addPoses(
      base,
      sampleTimeline(timeline, {
        frame: strikePresentationFrame(fighter, frames, at),
        frames,
        continuous: true,
      }),
      attackMotionAccent({ fighter, frames, authored, frame: at }),
      strikeSupportPose(fighter, { transfer, frame: at, frames }),
      strikeSilhouette(fighter, { frames, frame: strikePresentationFrame(fighter, frames, at) }),
    )
  return {
    pose: recovery ? addPoses(poseAt(frame), recovery) : poseAt(frame),
    plant: variant !== 'air' && fighter.y <= 0,
    key: `attack:${attack.moveId ?? attack.kind}`,
    blend: 0,
    attackFlow: {
      frame,
      startup: frames.startup,
      active: frames.active,
      recovery: frames.recovery,
      supportLeg: postureSupportLeg(fighter),
      loadAt: fightPhysicalProfile(fighter).loadAt,
      facing: fighter.facing,
      transfer,
      contact: bridgeContact(attack.moveId, { frame, startup: frames.startup, poseAt }),
    },
  }
}

function bridgeContact(
  moveId: string | undefined,
  timing: { frame: number; startup: number; poseAt: (frame: number) => FightPose },
): FightPose | undefined {
  if (timing.frame < timing.startup && bridgeTarget(moveId)) return timing.poseAt(timing.startup)
}

function hasTechedThrow(fighter: ArcadeFighter): boolean {
  return fighter.attack?.variant === 'throw' && Boolean(fighter.throwTechFrames)
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

function syncConfiscatedWeapons(figure: import('three').Object3D, fighter: ArcadeFighter): void {
  for (const name of [
    'theta-physical-handgun',
    'signature-katana',
    'signature-umbrella',
    'luini-physical-knife',
  ]) {
    const weapon = figure.getObjectByName(name)
    if (weapon) weapon.visible = !fighter.weaponsConfiscated
  }
}
