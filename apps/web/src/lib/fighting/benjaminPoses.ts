import { PALM_PUSH, strikeTimeline } from './fightGestures'
import type { KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FightJoint, FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

const GUN_POSE = {
  body: [0.08, 0, 0],
  leadShoulder: [-1.25, 0.2, 0.4],
  leadElbow: [-0.5, 0, 0],
  rearShoulder: [-1.1, -0.2, -0.3],
  rearElbow: [-1.2, 0, 0],
} as const

const GUN_TIMELINE: MoveTimeline = [
  { phase: 'startup', at: 0.5, pose: GUN_POSE },
  { phase: 'active', at: 0, pose: GUN_POSE, ease: 'snap' },
  { phase: 'active', at: 1, pose: { ...GUN_POSE, body: [-0.05, 0, 0] } },
  { phase: 'recovery', at: 0.5, pose: GUN_POSE },
]

const RECTANGLE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.2,
    pose: {
      leadShoulder: [-1, 0.3, 0.6],
      rearShoulder: [-1, -0.3, -0.6],
      leadElbow: [-1, 0, 0],
      rearElbow: [-1, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    pose: {
      leadShoulder: [-1.4, 0.2, 0.7],
      rearShoulder: [-1.4, -0.2, -0.7],
      leadElbow: [-0.5, 0, 0],
      rearElbow: [-0.5, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 1,
    pose: {
      leadShoulder: [-1.4, 0.2, 0.7],
      rearShoulder: [-1.4, -0.2, -0.7],
      leadElbow: [-0.5, 0, 0],
      rearElbow: [-0.5, 0, 0],
    },
  },
]

const PALM_TIMELINE = strikeTimeline(PALM_PUSH)
const ARM_PAIRS: Partial<Record<FightJoint, FightJoint>> = {
  leadShoulder: 'rearShoulder',
  rearShoulder: 'leadShoulder',
  leadElbow: 'rearElbow',
  rearElbow: 'leadElbow',
  leadWrist: 'rearWrist',
  rearWrist: 'leadWrist',
}

const LEFT_PALM_REAR = PALM_TIMELINE.map((key) => ({ ...key, pose: swapHands(key.pose) }))

function swapHands(pose: FightPose): FightPose {
  return Object.fromEntries(
    Object.entries(pose).map(([joint, turn]) => [ARM_PAIRS[joint as FightJoint] ?? joint, turn]),
  )
}

export function benjaminKeyedMove(fighter: ArcadeFighter): KeyedMove | null {
  const attack = fighter.attack
  if (fighter.id !== 'benjamin' || !attack) return null
  if (attack.kind === 'ranged') return { timeline: GUN_TIMELINE, authored: false }
  if (attack.kind !== 'special') return null
  if (attack.moveId === 'benjamin:downSpecial') return { timeline: RECTANGLE, authored: false }
  if (!attack.moveId || attack.moveId === 'benjamin:neutralSpecial')
    return { timeline: fighter.facing === 1 ? LEFT_PALM_REAR : PALM_TIMELINE, authored: false }
  return { timeline: PALM_TIMELINE, authored: false }
}
