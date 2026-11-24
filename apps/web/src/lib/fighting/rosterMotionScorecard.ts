import { FIGHT_JOINTS, type FightJoint, type FightPose } from './fightPose'
import { keyPoseSource, keyedMove, type KeyPoseSource } from './keyPoseMoves'
import { FIGHTING_ROSTER } from './roster'
import type { FighterId, MoveSlot } from './types'

export const MOTION_AUDIT_SLOTS = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
] as const satisfies readonly MoveSlot[]

const LOWER: readonly FightJoint[] = [
  'pelvis',
  'leadHip',
  'rearHip',
  'leadKnee',
  'rearKnee',
  'leadFoot',
  'rearFoot',
]
const DETAIL: readonly FightJoint[] = [
  'pelvis',
  'leadClavicle',
  'rearClavicle',
  'leadWrist',
  'rearWrist',
  'leadPalm',
  'rearPalm',
  'leadFoot',
  'rearFoot',
]

export interface MoveMotionScore {
  slot: MoveSlot
  source: KeyPoseSource
  keys: number
  joints: number
  lowerBody: boolean
  detailed: boolean
  stagedChain: boolean
  activeHold: boolean
  recoveryKeys: number
  score: number
}

export interface FighterMotionScore {
  id: FighterId
  score: number
  mechanics: number
  rhythm: number
  contact: number
  silhouette: number
  identity: number
  dedicatedMoves: number
  priorityMoves: MoveSlot[]
  moves: MoveMotionScore[]
}

export function rosterMotionScorecard(): FighterMotionScore[] {
  return FIGHTING_ROSTER.map(({ id }) => fighterMotionScore(id)).sort(
    (a, b) => a.score - b.score || a.id.localeCompare(b.id),
  )
}

export function fighterMotionScore(id: FighterId): FighterMotionScore {
  const moves = MOTION_AUDIT_SLOTS.map((slot) => moveMotionScore(id, slot))
  const average = (read: (move: MoveMotionScore) => number) =>
    moves.reduce((total, move) => total + read(move), 0) / moves.length
  const dedicated = average((move) => Number(move.source === 'dedicated'))
  const lowerBody = average((move) => Number(move.lowerBody))
  const staged = average((move) => Number(move.stagedChain))
  const hold = average((move) => Number(move.activeHold))
  const detail = average((move) => Number(move.detailed))
  const keyDensity = average((move) => clamp01((move.keys - 4) / 5))
  const recovery = average((move) => clamp01((move.recoveryKeys - 1) / 2))
  const jointDensity = average((move) => clamp01((move.joints - 8) / 10))
  const distinctContacts =
    new Set(moves.map(({ slot }) => JSON.stringify(contactPose(id, slot)))).size / moves.length
  const mechanics = round(5 + lowerBody * 3 + staged * 2)
  const rhythm = round(5 + keyDensity * 3 + recovery * 2)
  const contact = round(7 + hold * 3)
  const silhouette = round(5 + jointDensity * 3 + distinctContacts * 2)
  const identity = round(4 + dedicated * 4 + detail * 2)
  const score = round(
    mechanics * 0.25 + rhythm * 0.2 + contact * 0.2 + silhouette * 0.15 + identity * 0.2,
  )
  return {
    id,
    score,
    mechanics,
    rhythm,
    contact,
    silhouette,
    identity,
    dedicatedMoves: moves.filter((move) => move.source === 'dedicated').length,
    priorityMoves: [...moves]
      .sort((a, b) => a.score - b.score || a.slot.localeCompare(b.slot))
      .slice(0, 3)
      .map(({ slot }) => slot),
    moves,
  }
}

export function moveMotionScore(id: FighterId, slot: MoveSlot): MoveMotionScore {
  const timeline = keyedMove(id, slot).timeline
  const joints = new Set(timeline.flatMap(({ pose }) => jointsOf(pose)))
  const active = timeline.filter(({ phase }) => phase === 'active')
  const contact = active.find(({ at }) => at === 0)
  const hold = active.find(({ at }) => at === 1)
  const lowerBody = LOWER.some((joint) => joints.has(joint))
  const detailed = DETAIL.some((joint) => joints.has(joint))
  const stagedChain = timeline.some(
    ({ jointEase }) => jointEase && Object.keys(jointEase).length > 0,
  )
  const activeHold = Boolean(contact && hold && samePose(contact.pose, hold.pose))
  const recoveryKeys = timeline.filter(({ phase }) => phase === 'recovery').length
  const source = keyPoseSource(id, slot)
  const authored = source === 'dedicated' ? 1 : source === 'roster' ? 0.35 : 0
  const score = round(
    4 +
      authored * 2 +
      Number(lowerBody) * 0.8 +
      Number(detailed) * 0.7 +
      Number(stagedChain) * 0.8 +
      Number(activeHold) * 0.7 +
      clamp01((timeline.length - 4) / 5) * 0.6 +
      clamp01((recoveryKeys - 1) / 2) * 0.4,
  )
  return {
    slot,
    source,
    keys: timeline.length,
    joints: joints.size,
    lowerBody,
    detailed,
    stagedChain,
    activeHold,
    recoveryKeys,
    score,
  }
}

function contactPose(id: FighterId, slot: MoveSlot): FightPose {
  return (
    keyedMove(id, slot).timeline.find(({ phase, at }) => phase === 'active' && at === 0)?.pose ?? {}
  )
}

function jointsOf(pose: FightPose): FightJoint[] {
  return FIGHT_JOINTS.filter((joint) => pose[joint])
}

function samePose(a: FightPose, b: FightPose): boolean {
  return FIGHT_JOINTS.every(
    (joint) => JSON.stringify(a[joint] ?? [0, 0, 0]) === JSON.stringify(b[joint] ?? [0, 0, 0]),
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
