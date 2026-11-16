import { READY_ARMS } from './fightGestures'
import { PADAILLE_RELEASE, type PadailleTool } from './padailleWeapon'
import type { KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FightJoint, FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

const HAMMER: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.8,
    pose: { leadShoulder: [-2.6, 0, 0.15], leadElbow: [-0.9, 0, 0], chest: [-0.1, -0.2, 0] },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: { leadShoulder: [-0.95, 0, 0], leadElbow: [-0.05, 0, 0], chest: [0.25, 0.2, 0] },
  },
  { phase: 'recovery', at: 0.8, pose: {} },
]
const DRILL: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.8,
    pose: { leadShoulder: [-0.7, 0, 0.1], leadElbow: [-1.6, 0, 0], chest: [0, -0.2, 0] },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: { leadShoulder: [-1.65, 0, 0], leadElbow: [0, 0, 0], chest: [0.1, 0.15, 0] },
  },
  { phase: 'recovery', at: 0.8, pose: {} },
]
const AXE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.8,
    pose: { leadShoulder: [-1.9, -0.6, 0.2], leadElbow: [-0.9, 0, 0], chest: [0, -0.5, 0] },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: { leadShoulder: [-1.1, 0.6, -0.15], leadElbow: [-0.1, 0, 0], chest: [0.1, 0.45, 0] },
  },
  { phase: 'recovery', at: 0.8, pose: {} },
]
const RESTORE: MoveTimeline = [
  { phase: 'startup', at: 0.5, pose: { leadShoulder: [-0.3, 0, 0], leadElbow: [-1, 0, 0] } },
]
const TOOLS: Record<PadailleTool, MoveTimeline> = { hammer: HAMMER, drill: DRILL, axe: AXE }

function rightHandPose(pose: FightPose, facing: 1 | -1): FightPose {
  return Object.fromEntries(
    Object.entries(pose).map(([joint, turn]) => {
      if (!joint.startsWith('lead')) return [joint, turn]
      const target = (facing === 1 ? joint : joint.replace('lead', 'rear')) as FightJoint
      const ready = READY_ARMS[target] ?? [0, 0, 0]
      return [target, turn.map((angle, index) => angle - ready[index])]
    }),
  )
}

/** Facing swaps the authored lead/rear labels, never Padaille's anatomical right arm. */
export function padailleKeyedMove(fighter: ArcadeFighter): KeyedMove | null {
  if (fighter.attack?.hatsuSource !== 'padaille') return null
  const restore = fighter.attack.moveId === PADAILLE_RELEASE
  const timeline = restore ? RESTORE : TOOLS[fighter.padailleTool ?? 'hammer']
  return {
    authored: false,
    timeline: timeline.map((key) => ({ ...key, pose: rightHandPose(key.pose, fighter.facing) })),
  }
}
