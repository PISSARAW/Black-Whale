import { bonolenovHasSpear, spearNormal } from './bonolenovArmedProfile'
import { fightStance } from './fightStance'
import {
  addPoses,
  FIGHT_JOINTS,
  lerpPose,
  pickJoints,
  scalePose,
  type BodyPlan,
  type FightPose,
} from './fightPose'
import { PROLOGUE_CARRY_POSE } from './keyPosesBonolenov'
import { keyPoseTimeline, type KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import type { ArcadeFighter, MoveSlot } from './types'

type Phrase = { load: FightPose; strike: FightPose; finish: FightPose }

const CARRY_ARMS = {
  leadShoulder: [-0.58, 0, 0.17],
  leadElbow: [-1.39, 0, 0],
  leadWrist: [0, 0, 0],
  rearShoulder: [-0.46, -0.38, -0.47],
  rearElbow: [-0.7, 0, 0],
  rearWrist: [-0.14, 0, 0],
} as const satisfies FightPose

const ARM_JOINTS = FIGHT_JOINTS.filter((joint) =>
  /^(lead|rear)(Shoulder|Elbow|Wrist|Palm|Clavicle)$/.test(joint),
)
const FOOTWORK = FIGHT_JOINTS.filter((joint) => !ARM_JOINTS.includes(joint))

const ARMED: Partial<Record<MoveSlot, Phrase>> = {
  standingLight: {
    load: { leadShoulder: [-0.72, -0.15, 0.26], leadElbow: [-1.59, 0, 0], chest: [0, -0.29, 0] },
    strike: {
      leadShoulder: [-1.52, 0, 0.03],
      leadElbow: [-0.12, 0, 0],
      rearShoulder: [-0.36, 0.26, -0.58],
      chest: [0.06, -0.05, 0],
    },
    finish: { leadShoulder: [-0.83, -0.09, 0.18], leadElbow: [-1.12, 0, 0] },
  },
  standingHeavy: {
    load: {
      leadShoulder: [-1.6, 0.62, 0.59],
      leadElbow: [-1.29, 0, 0],
      leadWrist: [0.13, 0, -0.25],
      chest: [-0.07, 0.46, 0],
      pelvis: [0, 0.34, 0],
    },
    strike: {
      leadShoulder: [-1.31, -0.47, 0.36],
      leadElbow: [-0.51, 0, 0],
      leadWrist: [-0.18, 0.17, 0.4],
      rearShoulder: [-0.26, 0.4, -0.64],
      pelvis: [0, -0.38, 0],
      chest: [0.16, -0.36, -0.1],
    },
    finish: {
      leadShoulder: [-1.07, -0.67, 0.23],
      leadElbow: [-0.93, 0, 0],
      leadWrist: [-0.14, 0.2, 0.26],
      pelvis: [0, -0.34, 0],
    },
  },
  lowLight: {
    load: { leadShoulder: [-0.47, -0.4, 0.35], leadElbow: [-1.53, 0, 0], chest: [0.09, -0.19, 0] },
    strike: {
      leadShoulder: [-0.92, -0.18, 0.24],
      leadElbow: [-0.22, 0, 0],
      leadWrist: [0.13, 0, 0.09],
      chest: [0.22, -0.22, 0.1],
    },
    finish: { leadShoulder: [-0.51, -0.24, 0.26], leadElbow: [-1.11, 0, 0] },
  },
  lowHeavy: {
    load: { leadShoulder: [-0.86, -0.77, 0.44], leadElbow: [-1.25, 0, 0], pelvis: [0, -0.55, 0] },
    strike: {
      leadShoulder: [-0.85, 0.42, 0.56],
      leadElbow: [-0.36, 0, 0],
      leadWrist: [0.2, -0.21, -0.16],
      rearShoulder: [-0.23, -0.51, -0.54],
      chest: [0.28, 0.31, 0.16],
      pelvis: [0, 0.61, 0],
    },
    finish: { leadShoulder: [-0.68, 0.62, 0.43], leadElbow: [-0.89, 0, 0], pelvis: [0, 0.34, 0] },
  },
  airLight: {
    load: {
      leadShoulder: [-0.97, 0.27, 0.42],
      leadElbow: [-1.42, 0, 0],
      chest: [-0.14, 0.29, 0.15],
    },
    strike: {
      leadShoulder: [-1.14, -0.24, 0.15],
      leadElbow: [-0.17, 0, 0],
      leadWrist: [0.12, 0, 0.11],
      rearShoulder: [-0.45, -0.29, -0.59],
      chest: [0.15, -0.34, -0.1],
    },
    finish: { leadShoulder: [-0.82, -0.39, 0.31], leadElbow: [-0.96, 0, 0] },
  },
  airHeavy: {
    load: {
      leadShoulder: [-2.04, 0.36, 0.58],
      leadElbow: [-0.54, 0, 0],
      leadWrist: [-0.18, 0.16, -0.2],
      chest: [-0.13, 0.35, 0.11],
    },
    strike: {
      leadShoulder: [-0.91, -0.36, 0.38],
      leadElbow: [-0.13, 0, 0],
      leadWrist: [0.33, 0.15, 0.21],
      rearShoulder: [0.17, -0.34, -0.61],
      chest: [0.45, -0.28, -0.19],
    },
    finish: {
      leadShoulder: [-0.58, -0.28, 0.36],
      leadElbow: [-0.91, 0, 0],
      chest: [0.21, 0.06, -0.09],
    },
  },
  forwardLight: {
    load: { leadShoulder: [-0.71, 0.34, 0.41], leadElbow: [-1.62, 0, 0], chest: [0.08, 0.27, 0] },
    strike: {
      leadShoulder: [-1.53, -0.07, 0.13],
      leadElbow: [-0.05, 0, 0],
      rearShoulder: [0.27, -0.37, -0.6],
      chest: [0.18, -0.25, 0],
    },
    finish: { leadShoulder: [-0.92, -0.31, 0.21], leadElbow: [-1.04, 0, 0] },
  },
  forwardHeavy: {
    load: {
      leadShoulder: [-1.09, -0.82, 0.63],
      leadElbow: [-1.53, 0, 0],
      leadWrist: [-0.18, -0.28, -0.3],
      pelvis: [0, -0.65, 0],
    },
    strike: {
      leadShoulder: [-1.51, 0.41, 0.47],
      leadElbow: [-0.42, 0, 0],
      leadWrist: [0.16, -0.24, 0.32],
      rearShoulder: [-0.44, -0.56, -0.63],
      chest: [0.16, 0.48, 0.19],
      pelvis: [0, 0.72, 0],
    },
    finish: { leadShoulder: [-1.16, 0.51, 0.36], leadElbow: [-0.83, 0, 0], pelvis: [0, 0.44, 0] },
  },
  backHeavy: {
    load: {
      leadShoulder: [-0.74, 0.46, 0.53],
      leadElbow: [-1.44, 0, 0],
      chest: [-0.08, 0.49, -0.12],
    },
    strike: {
      leadShoulder: [-0.93, -0.44, 0.46],
      leadElbow: [-0.83, 0, 0],
      leadWrist: [-0.33, 0.16, -0.24],
      chest: [0.06, -0.46, 0.2],
      pelvis: [0, -0.61, 0],
    },
    finish: { leadShoulder: [-0.75, -0.52, 0.33], leadElbow: [-1.18, 0, 0], pelvis: [0, -0.31, 0] },
  },
}

const CACHE = new Map<MoveSlot, MoveTimeline>()

export function bonolenovArmedNormal(
  fighter: ArcadeFighter,
  slot: MoveSlot,
): KeyedMove | undefined {
  if (!spearNormal(fighter, slot)) return undefined
  const cached = CACHE.get(slot)
  if (cached) return { timeline: cached, authored: true }
  const phrase = ARMED[slot]
  const native = keyPoseTimeline('bonolenov', slot)
  if (!phrase || !native) return undefined
  const timeline = native.map((key) => ({
    ...key,
    pose: addPoses(scalePose(pickJoints(key.pose, FOOTWORK), 0.43), armedBeat(key, phrase)),
  }))
  CACHE.set(slot, timeline)
  return { timeline, authored: true }
}

function armedBeat(key: MoveTimeline[number], { load, strike, finish }: Phrase): FightPose {
  const accent =
    key.phase === 'startup'
      ? lerpPose({}, load, Math.min(1, key.at * 2))
      : key.phase === 'active'
        ? strike
        : lerpPose(finish, {}, key.at)
  const pose: FightPose = { ...CARRY_ARMS, ...accent }
  const standing = fightStance('bonolenov')!.pose
  for (const joint of ARM_JOINTS) {
    if (!pose[joint]) continue
    const rest = standing[joint] ?? [0, 0, 0]
    const turn = pose[joint]!
    pose[joint] = [turn[0] - rest[0], turn[1] - rest[1], turn[2] - rest[2]]
  }
  return pose
}

export function armedCarryPlan(plan: BodyPlan | null, fighter: ArcadeFighter): BodyPlan | null {
  if (!plan || !bonolenovHasSpear(fighter) || fighter.attack || fighter.hitStun > 0) return plan
  if (plan.key.startsWith('bonolenov:') || fighter.knockdownFrames > 0) return plan
  const guard: FightPose = fighter.blocking
    ? {
        leadShoulder: [-1.05, -0.54, 0.26],
        leadElbow: [-1.12, 0, 0],
        rearShoulder: [-0.71, -0.43, -0.31],
      }
    : {}
  return {
    ...plan,
    pose: { ...plan.pose, ...pickJoints(PROLOGUE_CARRY_POSE, ARM_JOINTS), ...guard },
  }
}
