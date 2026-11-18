import { strikeTimeline } from './keyPoseContact'
import { FIGHT_JOINTS, type FightPose } from './fightPose'
import { fightStance } from './fightStance'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Absolute body targets are rebased against the real unarmed stance once. */
function fromStance(target: FightPose): FightPose {
  const standing = fightStance('bonolenov')!.pose
  const pose: FightPose = {}
  for (const joint of FIGHT_JOINTS) {
    const turn = target[joint]
    if (!turn) continue
    const rest = standing[joint] ?? [0, 0, 0]
    pose[joint] = [turn[0] - rest[0], turn[1] - rest[1], turn[2] - rest[2]]
  }
  return pose
}

function phrase(load: FightPose, contact: FightPose, recover: FightPose): MoveTimeline {
  return strikeTimeline(fromStance(load), fromStance(contact), fromStance(recover))
}

/** Video 1:37–1:42: right-handed spear, free arm balancing, body coiled behind the point. */
export const PROLOGUE_CARRY_POSE: FightPose = {
  body: [0.025, 0, 0],
  chest: [0.03, -0.28, 0],
  head: [0.015, 0, 0],
  leadShoulder: [-0.55, 0, 0.12],
  leadElbow: [-1.35, 0, 0],
  leadWrist: [0, 0, 0],
  rearShoulder: [-0.2, 0, -0.7],
  rearElbow: [-0.55, 0, 0],
  leadHip: [-0.25, 0, 0.1],
  leadKnee: [0.3, 0, 0],
  rearHip: [0.16, 0, -0.1],
  rearKnee: [0.1, 0, 0],
}

export const PROLOGUE_SPEAR_POSE = phrase(
  {
    ...PROLOGUE_CARRY_POSE,
    body: [-0.04, 0.2, 0],
    chest: [0.02, -0.48, 0],
    leadElbow: [-1.65, 0, 0],
    rearKnee: [0.3, 0, 0],
  },
  {
    root: [0, 0, 0.1],
    body: [0.08, 0, 0],
    chest: [0.03, 0, 0],
    leadShoulder: [-1.5, 0, 0.02],
    leadElbow: [-0.08, 0, 0],
    leadWrist: [0, 0, 0],
    rearShoulder: [0.25, 0, -0.7],
    rearElbow: [-0.5, 0, 0],
    leadHip: [-0.4, 0, 0.1],
    leadKnee: [0.45, 0, 0],
    rearHip: [0.22, 0, -0.1],
    rearKnee: [0.12, 0, 0],
  },
  { ...PROLOGUE_CARRY_POSE, body: [0.015, -0.08, 0], leadElbow: [-1.1, 0, 0] },
)

/** Duel normals adapt his open, rotational footwork; the clip does not attest nine named attacks. */
export const BONOLENOV_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardSpecial: PROLOGUE_SPEAR_POSE,
  standingLight: phrase(
    { chest: [0, 0.1, 0], leadShoulder: [-0.3, 0, 0.25], leadElbow: [-1.7, 0, 0] },
    {
      chest: [0.035, -0.35, 0],
      leadShoulder: [-1.25, 0, 0.1],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.12, 0, -0.65],
      rearElbow: [-0.3, 0, 0],
    },
    { chest: [0, -0.2, 0], leadShoulder: [-0.55, 0, 0.4], leadElbow: [-1.2, 0, 0] },
  ),
  standingHeavy: phrase(
    {
      body: [0, 0.35, 0],
      chest: [0.02, 0.35, 0],
      leadShoulder: [-0.7, -0.3, 0.5],
      leadElbow: [-2.1, 0, 0],
      rearShoulder: [-0.3, 0, -0.85],
    },
    {
      body: [0.06, -0.25, 0],
      chest: [0.08, -0.5, 0],
      leadShoulder: [-1.1, -0.5, 0.45],
      leadElbow: [-2.1, 0, 0],
      rearShoulder: [-0.6, 0, -0.85],
      rearElbow: [-0.35, 0, 0],
    },
    { body: [0.02, -0.1, 0], chest: [0, -0.25, 0], leadElbow: [-1.5, 0, 0] },
  ),
  lowLight: phrase(
    { body: [0.04, 0.15, 0], leadShoulder: [-0.3, 0, 0.6], rearShoulder: [-0.25, 0, -0.6] },
    {
      body: [0.15, -0.15, 0],
      chest: [0.12, -0.4, 0],
      leadShoulder: [-0.75, 0, 0.1],
      leadElbow: [-0.15, 0, 0],
      rearShoulder: [-0.25, 0, -0.85],
    },
    { body: [0.05, 0, 0], leadShoulder: [-0.3, 0, 0.5], leadElbow: [-0.7, 0, 0] },
  ),
  lowHeavy: phrase(
    {
      body: [0.1, 0.65, 0],
      chest: [0.04, 0.2, 0],
      leadShoulder: [-0.3, 0, 0.8],
      rearShoulder: [-0.6, 0, -0.8],
    },
    {
      body: [0.12, -0.3, 0],
      chest: [0.05, -0.35, 0],
      leadHip: [-1.2, 0.15, 0.2],
      leadKnee: [0.1, 0, 0],
      rearHip: [-0.7, 0, -0.12],
      rearKnee: [1.3, 0, 0],
      leadShoulder: [-0.4, 0, 0.9],
      rearShoulder: [-0.7, 0, -1],
    },
    { body: [0.08, -0.1, 0], chest: [0, -0.2, 0], leadHip: [-0.4, 0, 0.08], leadKnee: [0.6, 0, 0] },
  ),
  airLight: phrase(
    { chest: [0, 0.2, 0], leadShoulder: [-0.45, 0, 0.7], rearShoulder: [-0.45, 0, -0.9] },
    {
      body: [0.04, -0.15, -0.06],
      chest: [0, -0.35, 0],
      leadShoulder: [-1.3, 0, 0.12],
      leadElbow: [-0.18, 0, 0],
      rearShoulder: [-0.5, 0, -0.9],
      leadHip: [-0.95, 0, 0.2],
      leadKnee: [1.6, 0, 0],
    },
    { chest: [0, -0.2, 0], leadShoulder: [-0.55, 0, 0.6], leadElbow: [-0.8, 0, 0] },
  ),
  airHeavy: phrase(
    {
      body: [-0.04, 0.7, 0],
      chest: [0, 0.3, 0],
      leadHip: [-1.05, 0, 0.2],
      leadKnee: [1.75, 0, 0],
      leadShoulder: [-0.7, 0, 0.8],
      rearShoulder: [-0.6, 0, -1],
    },
    {
      body: [-0.15, -0.3, 0.08],
      chest: [0, -0.3, 0],
      leadHip: [-1.55, 0, 0.12],
      leadKnee: [0.12, 0, 0],
      leadShoulder: [-0.4, 0, 0.9],
      rearShoulder: [-0.9, 0, -0.9],
      rearKnee: [1.2, 0, 0],
    },
    { body: [0, -0.15, 0], leadHip: [-0.8, 0, 0.1], leadKnee: [1.4, 0, 0] },
  ),
  forwardLight: phrase(
    {
      body: [-0.025, 0.2, 0],
      chest: [0, 0.2, 0],
      leadHip: [-0.6, 0, 0.16],
      leadKnee: [0.9, 0, 0],
      leadShoulder: [-0.45, 0, 0.65],
    },
    {
      root: [0, 0, 0.065],
      body: [0.08, -0.1, 0],
      chest: [0.03, -0.35, 0],
      leadShoulder: [-1.3, 0, 0.16],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [0.12, 0, -0.8],
      leadHip: [-0.35, 0, 0.12],
      leadKnee: [0.4, 0, 0],
    },
    { body: [0.03, -0.1, 0], chest: [0, -0.2, 0], leadElbow: [-0.9, 0, 0] },
  ),
  forwardHeavy: phrase(
    {
      body: [0, 1.3, 0],
      chest: [0.02, 0.3, 0],
      leadShoulder: [-0.5, 0, 1],
      rearShoulder: [-0.65, 0, -1],
      rearHip: [-0.65, 0, -0.15],
      rearKnee: [1.1, 0, 0],
    },
    {
      body: [0.05, -0.25, 0],
      chest: [0.06, -0.45, 0],
      leadShoulder: [-1.25, 0, 0.2],
      leadElbow: [-0.25, 0, 0],
      rearShoulder: [-0.25, 0, -1],
      leadHip: [-0.4, 0, 0.12],
      leadKnee: [0.45, 0, 0],
    },
    {
      body: [0.03, -0.4, 0],
      chest: [0.02, -0.2, 0],
      leadShoulder: [-0.6, 0, 0.8],
      leadElbow: [-0.55, 0, 0],
    },
  ),
  backHeavy: phrase(
    {
      body: [-0.12, 0.4, 0],
      chest: [-0.04, 0.25, 0],
      leadShoulder: [-0.55, -0.35, 0.4],
      leadElbow: [-1.9, 0, 0],
    },
    {
      body: [-0.12, -0.25, 0],
      chest: [0, -0.45, 0],
      leadShoulder: [-1.1, 0.2, 0.35],
      leadElbow: [-0.35, 0, 0],
      rearShoulder: [-0.3, 0, -0.9],
      rearElbow: [-0.4, 0, 0],
    },
    { body: [-0.04, -0.1, 0], leadShoulder: [-0.45, 0, 0.5], leadElbow: [-1.1, 0, 0] },
  ),
}
