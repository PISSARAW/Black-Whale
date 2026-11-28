import { addPoses, scalePose, type FightPose } from './fightPose'
import type { PhaseFrames } from './keyPoseTimeline'
import type { ArcadeFighter, MoveSlot } from './types'

export type PhysicalAttackOutcome = 'pending' | 'hit' | 'block' | 'whiff'

const PHYSICAL_SLOTS = new Set<MoveSlot>([
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
])

const OUTCOME_POSES: Record<Exclude<PhysicalAttackOutcome, 'pending'>, FightPose> = {
  hit: {
    root: [0, 0, 0.026],
    pelvis: [-0.025, 0.08, 0],
    body: [-0.018, 0, 0],
    chest: [-0.04, 0.11, -0.025],
    leadShoulder: [-0.1, 0.035, -0.04],
    rearShoulder: [0.07, -0.025, 0.045],
    leadElbow: [0.1, 0, 0],
    rearKnee: [0.08, 0, 0],
  },
  block: {
    root: [0, -0.012, -0.052],
    pelvis: [-0.04, -0.13, 0],
    body: [-0.045, 0, 0],
    chest: [-0.075, -0.2, 0.045],
    leadShoulder: [0.2, -0.08, 0.1],
    rearShoulder: [0.12, 0.05, -0.05],
    leadElbow: [-0.25, 0, 0],
    leadWrist: [0.16, -0.06, 0],
    rearKnee: [0.12, 0, 0],
  },
  whiff: {
    root: [0, 0, 0.052],
    pelvis: [0.045, 0.16, 0],
    body: [0.035, 0, 0],
    chest: [0.035, 0.23, -0.035],
    neck: [-0.025, -0.09, 0.015],
    leadShoulder: [-0.15, 0.07, -0.05],
    leadElbow: [0.18, 0, 0],
    leadWrist: [-0.08, 0.05, 0],
    rearKnee: [0.06, 0, 0],
  },
}

export function physicalAttackOutcome(
  fighter: ArcadeFighter,
  slot: MoveSlot,
  frames: PhaseFrames,
): PhysicalAttackOutcome {
  const attack = fighter.attack
  if (!attack || !PHYSICAL_SLOTS.has(slot)) return 'pending'
  if (attack.confirmedBlock) return 'block'
  if (attack.confirmedHit) return 'hit'
  return attack.frame >= frames.startup + frames.active ? 'whiff' : 'pending'
}

/**
 * Presentation-only recoil and follow-through after the shared contact pose.
 * It reads public attack confirmation but never changes timing, collision or damage.
 */
export function physicalAttackOutcomePose(
  fighter: ArcadeFighter,
  input: { slot: MoveSlot; frame: number; frames: PhaseFrames },
): FightPose {
  if (fighter.id === 'kurapika' && input.slot === 'standingHeavy') return {}
  const outcome = physicalAttackOutcome(fighter, input.slot, input.frames)
  if (outcome === 'pending') return {}
  const start = input.frames.startup + input.frames.active
  if (input.frame < start || input.frame >= start + input.frames.recovery) return {}
  const progress = clamp((input.frame - start) / Math.max(1, input.frames.recovery))
  const release = 1 - smooth(progress)
  const appears = outcome === 'whiff' ? smooth(Math.min(1, progress / 0.14)) : 1
  const attack = fighter.attack!
  const power = attack.kind === 'heavy' ? 1 : 0.66
  const air = attack.variant === 'air'
  const low = attack.variant === 'low'
  const directional = ['forwardHeavy', 'backHeavy'].includes(input.slot) ? 1.12 : 1
  const semantic = outcomeLimbPose(outcome, air, low)
  const pose = addPoses(OUTCOME_POSES[outcome], semantic)
  if (air) delete pose.root
  return scalePose(pose, power * directional * appears * release)
}

function outcomeLimbPose(
  outcome: Exclude<PhysicalAttackOutcome, 'pending'>,
  air: boolean,
  low: boolean,
): FightPose {
  return air
    ? {
        root: [0, outcome === 'block' ? -0.018 : 0.012, 0],
        leadHip: [outcome === 'whiff' ? -0.12 : 0.08, 0, 0],
        rearKnee: [outcome === 'hit' ? 0.12 : -0.06, 0, 0],
      }
    : low
      ? {
          pelvis: [outcome === 'block' ? -0.06 : 0.045, 0, 0],
          leadKnee: [outcome === 'whiff' ? 0.16 : -0.06, 0, 0],
          rearFoot: [outcome === 'block' ? 0.08 : -0.03, 0, 0],
        }
      : {}
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value)
}
