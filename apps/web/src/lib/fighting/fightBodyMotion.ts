import { fighterStance } from './biscuitBody'
import { animateHanzoBlade } from './hanzoBladeFigure'
import { plantHanzoSoles } from './hanzoGrounding'
import { beginSettledPose } from './fightSettledPose'
import { feitanAirPlan, feitanIconicPlan, feitanWoundedPlan } from './feitanLocomotion'
import { feitanHandedPlan } from './feitanHandedPose'
import { feitanUmbrellaPlan } from './feitanEquipmentPose'
import { plantBodyFrame } from './fightPlantedPose'
import { withNenCommitment } from './nenCommitment'
import { animateBenjaminRifle } from './benjaminRiflePose'
import { onAwakeningBodyPlan } from './onAwakening'
import { animateMelodyFlute, restoreMelodyFlute } from './melodyFigurePose'
import { expressiveFightMotion } from './fightExpressionMotion'
import { rightHandedPose } from './fightHandedPose'
import { usesRightHandPose } from './fightHandConvention'
import { chrolloBodyStance } from './chrolloBodyStance'
import { keepFightPosture } from './fightPostureBudget'
import { rosterSustainedMotion } from './rosterSustainedMotion'
import { animateBlinky } from './blinkyFigure'
import { animatePadailleWeapon } from './padailleFigure'
import { easterEggBodyPlan } from './easterEggPoses'
import { armedCarryPlan, bonolenovBodyPlan } from './bonolenovPoses'
import { animateBonolenovSpear } from './bonolenovSpear'
import { biohazardBodyPlan } from './biohazardPresentation'
import { crossGameBodyPlan } from './crossGamePresentation'
import { pluggingWoundsPlan } from './blinkyPose'
import { animateServiceHandgun } from './serviceHandgun'
import { animateCyclotron, cyclotronBodyPlan } from './phinksMotion'
import type { HumanMotion } from '$lib/tour/humanAnimation'
import { animateFranklinHands } from './franklinHands'
import { animateChrolloBook } from './chrolloFigure'
import { pursuitRecoveryPose } from './pursuitRecoveryPose'
import { pursuitLoadWeight, pursuitSupport } from './pursuitMotion'
import { closeBodyPlan } from './fightClosePosture'
import { flowThroughBridge } from './duelAttackBridges'
import { beginPoseTransition, type PoseMemory } from './fightPoseMemory'
import { COMBO_LINK_SECONDS, flowIntoAttack, type AttackFlowFrame } from './fightAttackFlow'
import { transferAttackWeight } from './fightWeightTransfer'
import { READY_ARMS } from './fightGestures'
import {
  addPoses,
  lerpPose,
  NEUTRAL_POSE,
  pickJoints,
  UPPER_JOINTS,
  type BodyPlan,
  type FightPose,
} from './fightPose'
import { reactionPlan, type ReactionContext } from './fightReactions'
import { keepHumanJoints } from './fightJointLimits'
import {
  applyFightPose,
  captureFootPlant,
  fightRigOf,
  hasFightRig,
  resetFightRig,
  type FightRig,
} from './fightRig'
import { fightStance, stanceAt, type FightStance } from './fightStance'
import {
  crouchPose,
  dashPose,
  landingPose,
  locomotionGuard,
  prejumpPose,
  walkPose,
} from './fightLocomotion'
import { withLocomotionInertia } from './fightLocomotionInertia'
import { withSecondaryMotion } from './fightSecondaryMotion'
import { movementTechPose } from './movementTechPoses'
import { hanzoAstralRestPlan } from './hanzoAstralMotion'
import type { ArcadeFighter, FighterPose } from './types'
import { animateKurapikaGoldenHeavyIdentity } from './kurapikaGoldenHeavyIdentity'
import { animateFightMaterialResponse } from './fightMaterialResponse'
import { attackPlan } from './fightAttackBodyPlan'
import { gumResuscitationBodyPlan } from './gumResuscitationPresentation'
import { sunMoonChargeBodyPlan } from './sunMoonChargePresentation'

/**
 * Where the fighting rig draws a fighter, frame by frame.
 *
 * Every fighter stands in its stance (`fightStance.ts`, or a plain guard when it
 * has none yet), attacks through its keyed moves (`keyPoseMoves.ts`) and reacts
 * through `fightReactions.ts`. Only a throw tech still falls back to the motion
 * the scene computed.
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
    animateHanzoBlade(human.figure, fighter)
    syncConfiscatedWeapons(human.figure, fighter)
    animateFranklinHands(human.figure, fighter)
    animateChrolloBook(human.figure, fighter)
    animateFightMaterialResponse(human.figure, fighter)
    restoreMelodyFlute(human.figure, Boolean(fighter.melodyPerformance))
    if (!plan && !hasFightRig(human.figure)) {
      fallback?.(human)
      return
    }
    const rig = fightRigOf(human)
    resetFightRig(rig)
    rig.planted = Boolean(plan?.plant)
    beginSettledPose(rig, fighter.facing, options.poseContinuity?.observe)
    if (!plan) {
      remember(rig, { key: 'fallback', pose: NEUTRAL_POSE, seconds })
      fallback?.(human)
      return
    }
    const anchor = plan.plant ? captureFootPlant(rig) : null
    const drawn = drawBodyPose(options, rig, plan)
    applyFightPose(rig, drawn, { facing: fighter.facing, planted: plan.plant })
    animateKurapikaGoldenHeavyIdentity(human.figure, fighter)
    animatePadailleWeapon(human.figure, fighter, seconds)
    animateCyclotron(rig, fighter)
    animateBlinky(human.figure, fighter, seconds)
    animateBenjaminRifle(rig, fighter)
    animateBonolenovSpear(rig, fighter)
    keepHumanJoints(rig)
    plantBodyFrame(rig, {
      anchor,
      pose: drawn,
      fighter,
      plan,
      pursuitSupport: attackSupport(plan.attackFlow),
    })
    if (anchor) plantHanzoSoles(rig, fighter)
    animateMelodyFlute(rig, fighter)
  })
}

function attackSupport(attack: AttackFlowFrame | undefined) {
  if (!attack?.pursuit) return
  const foot = pursuitSupport(attack.pursuit, attack.facing)
  if (foot !== undefined) return { foot, weight: pursuitLoadWeight(attack.frame / attack.startup) }
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
  const basePlan = fallingBodyPlan(fighter, context) ?? unmirroredBodyPlan(fighter, context)
  const charged = sunMoonChargeBodyPlan(fighter, basePlan)
  const ordinary = withNenCommitment(gumResuscitationBodyPlan(fighter, charged), fighter)
  const awake = onAwakeningBodyPlan({ fighter, frame: context.onAwakeningFrame, ordinary })
  const plan = armedCarryPlan(awake && closeBodyPlan(awake, fighter, context.rival), fighter)
  const handed =
    plan && fighter.id === 'feitan'
      ? feitanHandedPlan(plan, fighter)
      : plan && usesRightHandPose(fighter, plan.key) && fighter.facing === -1
        ? rightHandedPlan(plan)
        : plan
  const layered = withSecondaryMotion(handed, context.secondaryMotion)
  return layered && keepFightPosture(layered, fighter)
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
  const standing = stanceAt(fighterStance(fighter) ?? DEFAULT_STANCE, context.seconds)
  return reactionPlan(fighter, context, standing)
}

function specialBodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  return (
    pluggingWoundsPlan(fighter) ??
    biohazardBodyPlan(fighter) ??
    techniqueBodyPlan(fighter, context) ??
    hanzoAstralRestPlan(fighter, context.seconds)
  )
}

function unmirroredBodyPlan(fighter: ArcadeFighter, context: PlanContext): BodyPlan | null {
  const easterEgg = easterEggBodyPlan(fighter)
  if (easterEgg) return easterEgg
  const special = specialBodyPlan(fighter, context)
  if (special) return special
  // A released physical card is keyed to the simulation frame. Do not let the
  // idle breathing clock alter the wrist silhouette between identical replays.
  const stanceSeconds =
    fighter.id === 'hisoka' && fighter.attack?.kind === 'ranged' ? 0 : context.seconds
  const standing = stanceAt(fighterStance(fighter) ?? DEFAULT_STANCE, stanceSeconds)
  const personal = chrolloBodyStance(fighter, standing)
  if (fighter.attack) return attackingPlan(fighter, personal, context.poseFraction)
  return restingWithConstraint(fighter, context, personal)
}
function luiniBodyPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (!fighter.luiniPassage || fighter.hitStun > 0) return null
  return {
    key: 'luini-occupied-passage',
    plant: false,
    blend: 0.08,
    pose: stanceAt(fighterStance(fighter) ?? DEFAULT_STANCE, 0),
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
  const dance = bonolenovBodyPlan(fighter, context.seconds)
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

function restingPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  if (!STANDING_POSES.has(fighter.pose) || fighter.y > 0) return null
  const guarding = fighter.pose === 'guard'
  const plan = (pose: FightPose, key: string): BodyPlan => ({
    pose,
    plant: true,
    key,
    blend: 0.1,
  })
  const active = movementTechPose(fighter, standing) ?? locomotionPlan(fighter, standing)
  if (active) return active
  if (fighter.crouching) {
    const upper = pickJoints(guarding ? locomotionGuard(fighter, standing) : standing, UPPER_JOINTS)
    return plan(addPoses(upper, crouchPose(fighter)), 'crouch')
  }
  if (guarding) return plan(locomotionGuard(fighter, standing), 'guard')
  // A fighter never strolls: it shuffles in its whole stance, guard and legs.
  if (fighter.pose === 'walk') return { ...walkPose(fighter, standing), plant: true }
  return plan(standing, 'stance')
}

function locomotionPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  const dash = dashPose(fighter, standing)
  if (dash) return { pose: dash.pose, plant: true, key: `dash:${dash.forward}`, blend: 0.025 }
  const prejump = prejumpPose(fighter, standing)
  if (prejump) return { ...prejump, plant: true }
  const landing = landingPose(fighter, standing)
  return landing ? { ...landing, plant: true } : null
}

const weaponsByFigure = new WeakMap<import('three').Object3D, import('three').Object3D[]>()

function syncConfiscatedWeapons(figure: import('three').Object3D, fighter: ArcadeFighter): void {
  let weapons = weaponsByFigure.get(figure)
  if (!weapons) {
    weapons = [
      'theta-physical-handgun',
      'signature-katana',
      'signature-umbrella',
      'luini-physical-knife',
    ].flatMap((name) => {
      const weapon = figure.getObjectByName(name)
      return weapon ? [weapon] : []
    })
    weaponsByFigure.set(figure, weapons)
  }
  for (const weapon of weapons) weapon.visible = !fighter.weaponsConfiscated
}

function restingWithConstraint(
  fighter: ArcadeFighter,
  context: PlanContext,
  standing: FightPose,
): BodyPlan | null {
  const constraint = context.nenConstraint
  if (constraint) return { ...constraint, pose: addPoses(standing, constraint.pose) }
  return (
    feitanUmbrellaPlan(fighter, standing) ??
    feitanWoundedPlan(fighter, standing) ??
    feitanIconicPlan(fighter) ??
    pursuitRecoveryPose(fighter) ??
    withLocomotionInertia(restingPlan(fighter, standing), context.locomotionInertia) ??
    feitanAirPlan(fighter, standing) ??
    reactionPlan(fighter, context, standing)
  )
}
