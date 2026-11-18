import { fighterMotionProfile } from './fighterMotionProfile'
import { addPoses, lerpPose, pickJoints, scalePose, type FightPose } from './fightPose'
import {
  ROSTER_CHOREOGRAPHY,
  type RosterChoreography,
  type StrikeShape,
} from './rosterChoreography'
import type { AttackKind, FighterId, MoveSlot } from './types'

const LEGS = ['leadHip', 'leadKnee', 'rearHip', 'rearKnee'] as const
const TORSO = ['body', 'chest'] as const
const CHOREOGRAPHY: Partial<Record<FighterId, RosterChoreography>> = ROSTER_CHOREOGRAPHY
const NORMAL_STRENGTH: Record<AttackKind, number> = {
  light: 0.8,
  heavy: 1.1,
  special: 0.95,
  ranged: 0.7,
}
const TRANSFER_ACCENTS: Partial<Record<FighterId, { depth: number; reach: number; turn: number }>> =
  {
    franklin: { depth: 1.34, reach: 1.18, turn: 0.75 },
    illumi: { depth: 0.72, reach: 0.82, turn: 0.55 },
    bonolenov: { depth: 0.92, reach: 1, turn: 1.55 },
    shizuku: { depth: 1.3, reach: 0.96, turn: 1.1 },
  }

export interface AttackWeightTransfer {
  load: FightPose
  drive: FightPose
  release: FightPose
  peak: number
}

interface TransferOptions {
  id: FighterId
  kind: AttackKind
  slot: MoveSlot
  shape?: StrikeShape
}

const PROFILES = new Map<string, AttackWeightTransfer>()

export function attackWeightTransfer(options: TransferOptions): AttackWeightTransfer | undefined {
  const key = `${options.id}:${options.kind}:${options.slot}:${options.shape ?? ''}`
  const cached = PROFILES.get(key)
  if (cached) return cached
  const profile = buildTransfer(options)
  if (profile) PROFILES.set(key, profile)
  return profile
}

function buildTransfer(options: TransferOptions): AttackWeightTransfer | undefined {
  const { id, kind, slot, shape } = options
  const style = CHOREOGRAPHY[id]
  if (!style) return undefined
  const character = TRANSFER_ACCENTS[id] ?? { depth: 1, reach: 1, turn: 1 }
  const strength = style.amplitude * fighterMotionProfile(id).attack * NORMAL_STRENGTH[kind]
  const leadSupport = shape === 'spin' || (id === 'bonolenov' && slot === 'forwardSpecial')
  const kicks = leadSupport || isLeadKick(shape)
  const retreat = slot === 'backHeavy' || slot === 'backSpecial'
  const depth = character.depth * (slot === 'lowHeavy' || slot === 'lowLight' ? 1.16 : 1)
  const reach = character.reach * (retreat ? -0.7 : 1)
  const turn = Math.sign(style.load.chest?.[1] || -1) * character.turn
  const braced = usesBothFeet(options)
  const load: FightPose = {
    root: [0, 0, -0.093 * reach],
    body: [-0.055 * depth, 0.105 * turn, 0],
    chest: [0, -0.045 * turn, 0],
    [leadSupport ? 'leadHip' : 'rearHip']: [-0.115 * depth, 0, 0],
    [leadSupport ? 'leadKnee' : 'rearKnee']: [0.28 * depth, 0, 0],
  }
  const brace: FightPose = braced ? { leadKnee: [0.19 * depth, 0, 0], leadHip: [-0.1, 0, 0] } : {}
  const push: FightPose = {
    root: [0, 0, 0.072 * reach],
    body: [0.078 * reach, -0.085 * turn, 0],
    chest: [0, 0.05 * turn, 0],
    [kicks && !leadSupport ? 'rearKnee' : 'leadKnee']: [0.14 * depth, 0, 0],
  }
  const drive = scalePose(addPoses(push, scalePose(pickJoints(style.drive, TORSO), 0.3)), strength)
  return {
    load: scalePose(addPoses(load, brace, scalePose(pickJoints(style.load, LEGS), 0.35)), strength),
    drive,
    release: addPoses(
      scalePose(drive, 0.22),
      scalePose(pickJoints(style.release, [...LEGS, ...TORSO]), strength * 0.42),
    ),
    peak: 0.32 + style.anticipation * 0.23,
  }
}

function isLeadKick(shape: StrikeShape | undefined) {
  return shape === 'kick' || shape === 'lowKick' || shape === 'sweep'
}

function usesBothFeet({ id, slot, kind }: TransferOptions) {
  return (
    (id === 'franklin' && kind === 'special') || (id === 'shizuku' && slot === 'forwardSpecial')
  )
}

const smooth = (t: number) => t * t * (3 - 2 * t)

export function carryRecoveryWeight(options: {
  transfer: AttackWeightTransfer
  recovery: number
}): FightPose {
  const t = Math.min(1, Math.max(0, (options.recovery - 0.52) / 0.48))
  return scalePose(options.transfer.release, smooth(t))
}

/** Carry the previous support through the first beat, compress, then push into the new strike. */
export function transferAttackWeight(options: {
  from: FightPose
  pose: FightPose
  transfer: AttackWeightTransfer
  progress: number
}): FightPose {
  const { from, pose, transfer, progress } = options
  if (progress <= 0 || progress >= 1) return pose
  const lower = lerpPose(pickJoints(from, LEGS), pickJoints(pose, LEGS), smooth(progress))
  const load =
    progress <= transfer.peak
      ? smooth(progress / transfer.peak)
      : 1 - smooth(Math.min(1, (progress - transfer.peak) / (1 - transfer.peak)))
  // The push follows the compression and vanishes smoothly at authored contact.
  const drive = Math.sin(Math.PI * progress) ** 2 * progress
  return addPoses(
    { ...pose, ...lower },
    scalePose(transfer.load, load),
    scalePose(transfer.drive, drive),
  )
}
