import { addPoses, type FightPose } from './fightPose'
import type { MoveTimeline } from './keyPoseTimeline'
import type { KeyedMove } from './keyPoseMoves'
import { padailleNenActive, type PadailleTool } from './padailleWeapon'
import type { ArcadeFighter } from './types'

const RIGHT_STRIKES = new Set([
  'padaille:standingHeavy',
  'padaille:forwardLight',
  'padaille:forwardHeavy',
  'padaille:airHeavy',
])

export function padailleRightStrike(moveId: string | undefined): boolean {
  return moveId !== undefined && RIGHT_STRIKES.has(moveId)
}

export function padailleNormalTool(fighter: ArcadeFighter): PadailleTool | undefined {
  if (fighter.id !== 'padaille' || !padailleRightStrike(fighter.attack?.moveId)) return
  return padailleNenActive(fighter) ? fighter.padailleTool : undefined
}

const TOOL_POSES: Record<PadailleTool, { load: FightPose; contact: FightPose; follow: FightPose }> =
  {
    hammer: {
      load: {
        leadShoulder: [-0.71, 0.08, 0.16],
        leadElbow: [-0.31, 0, 0],
        chest: [-0.13, 0.17, 0],
      },
      contact: {
        leadShoulder: [-0.89, -0.04, 0.18],
        leadElbow: [-0.38, 0, 0],
        leadWrist: [-0.23, 0, 0.04],
      },
      follow: { leadShoulder: [0.28, 0.08, 0], leadWrist: [-0.23, 0, 0] },
    },
    drill: {
      load: { leadShoulder: [0.2, 0.08, 0], leadElbow: [-0.52, 0, 0], chest: [0.06, 0.08, 0] },
      contact: {
        leadShoulder: [-1.16, 0.05, 0.1],
        leadElbow: [-0.09, 0, 0],
        leadWrist: [0.05, 0, 0.02],
      },
      follow: { leadElbow: [-0.41, 0, 0], chest: [0.08, 0, 0] },
    },
    axe: {
      load: {
        leadShoulder: [-0.42, -0.38, 0.13],
        leadElbow: [-0.48, 0, 0],
        chest: [0, -0.24, 0.1],
      },
      contact: {
        leadShoulder: [-0.89, 0.31, 0.18],
        leadElbow: [-0.31, 0, 0],
        leadWrist: [-0.16, 0.27, 0.18],
      },
      follow: { leadShoulder: [0.14, 0.23, 0], chest: [0.09, 0.16, 0] },
    },
  }

const CACHE: Record<PadailleTool, WeakMap<MoveTimeline, MoveTimeline>> = {
  hammer: new WeakMap(),
  drill: new WeakMap(),
  axe: new WeakMap(),
}

export function padailleArmedNormal(fighter: ArcadeFighter, move: KeyedMove): KeyedMove {
  const tool = padailleNormalTool(fighter)
  if (!tool) return move
  const cached = CACHE[tool].get(move.timeline)
  if (cached) return { ...move, timeline: cached }
  const { load, contact, follow } = TOOL_POSES[tool]
  const timeline = move.timeline.map((key) => ({
    ...key,
    pose:
      key.phase === 'active'
        ? { ...key.pose, ...contact }
        : addPoses(key.pose, key.phase === 'startup' ? load : follow),
  }))
  CACHE[tool].set(move.timeline, timeline)
  return { ...move, timeline }
}
