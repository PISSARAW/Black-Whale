import { strikeTimeline } from './keyPoseContact'
import { CHROLLO_NORMAL_POSES } from './keyPosesChrolloNormals'
import { rightHandedPose } from './fightHandedPose'
import { historicalBladeStrike } from './historicalWeapons'
import { chrolloKnifeHand } from './chrolloWeapon'
import type { KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import type { ArcadeFighter, MoveSlot } from './types'

const LEFT_PALM = strikeTimeline(
  { chest: [0, -0.18, 0], rearElbow: [-0.9, 0, 0] },
  { chest: [0.05, 0.25, 0], rearShoulder: [-1.25, 0, -0.1], rearElbow: [0.02, 0, 0] },
  { chest: [0, 0.08, 0], rearShoulder: [-0.4, 0, 0], rearElbow: [-0.45, 0, 0] },
)
const LEFT_COUNTER = strikeTimeline(
  { body: [0.05, 0, 0], rearElbow: [-0.9, 0, 0] },
  {
    root: [0, 0, -0.05],
    body: [-0.16, 0, 0],
    chest: [0, 0.3, 0],
    rearShoulder: [-1.15, 0, -0.25],
    rearElbow: [0.05, 0, 0],
    rearWrist: [0.3, 0, 0],
  },
  { body: [-0.025, 0, 0], rearShoulder: [-0.4, 0, 0], rearElbow: [-0.5, 0, 0] },
)
const ELBOW = strikeTimeline(
  { chest: [0, -0.28, 0], rearShoulder: [-0.5, 0, -0.3], rearElbow: [-1.2, 0, 0] },
  {
    root: [0, 0, 0.07],
    body: [0.14, 0, 0],
    chest: [0.04, 0.45, 0],
    rearShoulder: [-1.25, 0, -0.35],
    rearElbow: [-1.1, 0, 0],
  },
  {
    body: [0.025, 0, 0],
    chest: [0, 0.15, 0],
    rearShoulder: [-0.35, 0, 0],
    rearElbow: [-0.7, 0, 0],
  },
)
const FRONT_KICK = strikeTimeline(
  { body: [-0.08, 0, 0], leadHip: [-1.15, 0, 0], leadKnee: [1.2, 0, 0], rearElbow: [-0.8, 0, 0] },
  {
    body: [-0.2, 0, 0],
    leadHip: [-1.5, 0, 0.05],
    leadKnee: [-0.04, 0, 0],
    rearShoulder: [0.12, 0, -0.2],
  },
  { body: [-0.04, 0, 0], leadHip: [-0.6, 0, 0], leadKnee: [0.7, 0, 0] },
)
const PHYSICAL: Partial<Record<MoveSlot, MoveTimeline>> = {
  ...CHROLLO_NORMAL_POSES,
  forwardLight: LEFT_PALM,
  backHeavy: LEFT_COUNTER,
  forwardHeavy: ELBOW,
  standingHeavy: FRONT_KICK,
  airHeavy: FRONT_KICK,
}
const KNIFE = strikeTimeline(
  {
    chest: [0, -0.2, 0],
    rearShoulder: [-0.5, 0, -0.15],
    rearElbow: [-1.05, 0, 0],
    rearWrist: [-0.25, 0, 0],
  },
  {
    root: [0, 0, 0.035],
    chest: [0.04, 0.3, 0],
    rearShoulder: [-1.1, 0, -0.3],
    rearElbow: [0.05, 0, 0],
    rearWrist: [0.35, 0, -0.15],
  },
  { chest: [0, 0.1, 0], rearShoulder: [-0.35, 0, 0], rearElbow: [-0.6, 0, 0] },
)
const RIGHT_KNIFE = KNIFE.map((key) => ({ ...key, pose: rightHandedPose(key.pose) }))

/** The anatomical right hand supports the book; only the available knife hand cuts. */
export function chrolloPhysicalMove(fighter: ArcadeFighter): KeyedMove | null {
  const attack = fighter.attack
  if (!attack || !['light', 'heavy'].includes(attack.kind) || attack.variant === 'throw')
    return null
  if (fighter.historicalWeaponThrow === 'ben-knife' || historicalBladeStrike(fighter))
    return { timeline: chrolloKnifeHand(fighter) === 'right' ? RIGHT_KNIFE : KNIFE, authored: true }
  const slot = physicalSlot(attack)
  const timeline = PHYSICAL[slot]
  return timeline ? { timeline, authored: true } : null
}
function physicalSlot(attack: NonNullable<ArcadeFighter['attack']>): MoveSlot {
  return (attack.moveId?.split(':')[1] ??
    (attack.kind === 'light' ? 'standingLight' : 'standingHeavy')) as MoveSlot
}
