import { fighterKeyedMove } from './fighterKeyedMove'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import { pursuitGesture } from './pursuitMotion'
import { attackMotionAccent } from './fightAttackMotion'
import { strikePresentationFrame } from './fightStrikeRhythm'
import { strikeSupportPose } from './fightStrikeSupport'
import { strikeSilhouette } from './fightStrikeSilhouette'
import { postureSupportLeg } from './fightSupportCycle'
import { bridgeTarget } from './duelAttackBridges'
import { attackTransfer, recoveryTransfer } from './fightAttackWeight'
import { READY_ARMS } from './fightGestures'
import {
  addPoses,
  pickJoints,
  UPPER_JOINTS,
  STANCE_FRAME_JOINTS,
  type BodyPlan,
  type FightPose,
} from './fightPose'
import { AIR_POSE } from './fightStance'
import { attackData } from './frameData'
import { crouchPose } from './fightLocomotion'
import { hanzoAstralStrikePlan } from './hanzoAstralMotion'
import { sampleTimeline } from './keyPoseTimeline'
import { moveById } from './movesets'
import { strikingStance } from './strikingLegs'
import type { ArcadeFighter, AttackKind, AttackVariant, MoveSlot } from './types'
import { kurapikaGoldenHeavySupport } from './kurapikaGoldenHeavySupport'
import { kurapikaGoldenHeavyOutcomePose } from './kurapikaGoldenHeavyOutcome'
import { physicalAttackOutcomePose } from './fightAttackOutcome'
import { rosterWaveOneSupport } from './rosterWaveOneSupport'
import { standingStrikeSupport } from './standingStrikeMotion'
import { rosterWaveTwoSupport } from './rosterWaveTwoSupport'
import { rosterWaveThreeSupport } from './rosterWaveThreeSupport'

function basePose(fighter: ArcadeFighter, standing: FightPose, authored: boolean): FightPose {
  const variant = fighter.attack?.variant
  // Hand-keyed moves strike from the fighter's own guard; family gestures from a ready one.
  const upper = authored ? pickJoints(standing, UPPER_JOINTS) : READY_ARMS
  if (variant === 'low') return addPoses(upper, crouchPose(fighter))
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

function keyedAttackSupport(
  fighter: ArcadeFighter,
  slot: MoveSlot,
  frames: ReturnType<typeof attackData>,
) {
  const goldenSupport = kurapikaGoldenHeavySupport(fighter, frames)
  const support =
    standingStrikeSupport(fighter, slot, frames) ?? rosterWaveOneSupport(fighter, frames)
  const waveTwoSupport = rosterWaveTwoSupport(fighter, frames)
  const waveThreeSupport = rosterWaveThreeSupport(fighter, frames)
  return goldenSupport ?? support ?? waveTwoSupport ?? waveThreeSupport
}

export function attackPlan(
  fighter: ArcadeFighter,
  standing: FightPose,
  fraction = 0,
): BodyPlan | null {
  const attack = fighter.attack
  // A teched throw is drawn by the scene, both fighters breaking the grab together.
  if (!attack || hasTechedThrow(fighter)) return null
  const variant = attack.variant ?? 'standing'
  const slot = moveById(attack.moveId)?.slot ?? KIND_SLOTS[attack.kind][variant]
  const astral = hanzoAstralStrikePlan(fighter, slot, fraction)
  if (astral) return astral
  const { timeline, authored } = fighterKeyedMove(fighter, slot)
  const frames = attackData(attack.kind, fighter)
  const frame = attack.frame + fraction
  const pursuit = pursuitGesture(fighter, slot)
  const base = basePose(fighter, strikingStance(fighter.id, standing), authored)
  const transfer = attackTransfer(fighter, slot)
  const recovery = recoveryTransfer(fighter, { transfer, frame, frames })
  const support = keyedAttackSupport(fighter, slot, frames)
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
      physicalAttackOutcomePose(fighter, { slot, frame: at, frames }),
      kurapikaGoldenHeavyOutcomePose(fighter, { frame: at, frames }),
    )
  return {
    pose: recovery ? addPoses(poseAt(frame), recovery) : poseAt(frame),
    plant: attackOnGround(fighter, { variant, pursuit, frame, startup: frames.startup }),
    key: `attack:${attack.moveId ?? attack.kind}`,
    blend: 0,
    ...support,
    attackFlow: {
      frame,
      pursuit,
      startup: frames.startup,
      active: frames.active,
      recovery: frames.recovery,
      supportLeg: postureSupportLeg(fighter),
      loadAt: fightPhysicalProfile(fighter).loadAt,
      facing: fighter.facing,
      transfer,
      contact: bridgeContact(attack.moveId, { frame, startup: frames.startup, poseAt, pursuit }),
    },
  }
}

function attackOnGround(
  fighter: ArcadeFighter,
  timing: {
    variant: AttackVariant
    pursuit?: ReturnType<typeof pursuitGesture>
    frame: number
    startup: number
  },
): boolean {
  const { variant, pursuit, frame, startup } = timing
  if (fighter.hanzoProjection) return false
  if (pursuit && !pursuit.support) return false
  if (pursuit && fighter.y <= 0.15 && frame < startup) return true
  return fighter.y <= 0 && variant !== 'air'
}

function bridgeContact(
  moveId: string | undefined,
  timing: {
    frame: number
    startup: number
    poseAt: (frame: number) => FightPose
    pursuit?: ReturnType<typeof pursuitGesture>
  },
): FightPose | undefined {
  if (timing.frame < timing.startup && (bridgeTarget(moveId) || timing.pursuit))
    return timing.poseAt(timing.startup)
}

export function hasTechedThrow(fighter: ArcadeFighter): boolean {
  return fighter.attack?.variant === 'throw' && Boolean(fighter.throwTechFrames)
}
