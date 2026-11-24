import { scalePose, type FightPose } from './fightPose'
import type { PhaseFrames } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'

export type GoldenHeavyOutcome = 'pending' | 'hit' | 'block' | 'whiff'

const OUTCOME_POSES: Record<Exclude<GoldenHeavyOutcome, 'pending'>, FightPose> = {
  hit: {
    root: [0, -0.008, -0.018],
    pelvis: [-0.02, -0.06, 0],
    chest: [-0.035, -0.08, 0.025],
    rearShoulder: [0.08, -0.03, 0.04],
    rearElbow: [-0.1, 0, 0],
    rearWrist: [0.08, -0.04, 0],
  },
  block: {
    root: [0, -0.012, -0.045],
    pelvis: [-0.035, -0.12, 0],
    body: [-0.035, 0, 0],
    chest: [-0.06, -0.18, 0.035],
    rearShoulder: [0.18, -0.08, 0.08],
    rearElbow: [-0.22, 0, 0],
    leadElbow: [-0.08, 0, 0],
  },
  whiff: {
    root: [0, 0, 0.035],
    pelvis: [0.035, 0.14, 0],
    body: [0.025, 0, 0],
    chest: [0.025, 0.2, -0.02],
    neck: [-0.015, -0.08, 0.01],
    rearShoulder: [-0.12, 0.06, -0.04],
    rearElbow: [0.14, 0, 0],
    rearWrist: [-0.06, 0.04, 0],
  },
}

export function goldenHeavyOutcome(
  fighter: ArcadeFighter,
  frames: PhaseFrames,
): GoldenHeavyOutcome {
  const attack = fighter.attack
  if (!attack || attack.moveId !== 'kurapika:standingHeavy') return 'pending'
  if (attack.confirmedBlock) return 'block'
  if (attack.confirmedHit) return 'hit'
  return attack.frame >= frames.startup + frames.active ? 'whiff' : 'pending'
}

/** Outcome-specific follow-through begins only after the shared active silhouette. */
export function kurapikaGoldenHeavyOutcomePose(
  fighter: ArcadeFighter,
  input: { frame: number; frames: PhaseFrames },
): FightPose {
  const outcome = goldenHeavyOutcome(fighter, input.frames)
  if (outcome === 'pending') return {}
  const start = input.frames.startup + input.frames.active
  if (input.frame < start || input.frame >= start + input.frames.recovery) return {}
  const progress = Math.min(
    1,
    Math.max(0, (input.frame - start) / Math.max(1, input.frames.recovery)),
  )
  const early = 1 - smooth(progress)
  const impulse = outcome === 'whiff' ? Math.min(1, progress / 0.12) * early : early
  return scalePose(OUTCOME_POSES[outcome], impulse)
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value)
}
