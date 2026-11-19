import { addPoses, lerpPose, type FightPose } from './fightPose'
import { physicalHitPose, type PhysicalHit } from './fightHitResponse'
import { sampleTimeline, type MoveTimeline } from './keyPoseTimeline'

/** Articulated loss of balance, rather than rotating a rigid standing body onto the floor. */
export function physicalFallPose(
  hit: PhysicalHit,
  context: { progress: number; grounded: boolean },
): FightPose {
  const tuck = hit.profile.tuck
  const launch: FightPose = {
    body: [-0.48, -0.12 * hit.twist, 0.1 * hit.twist],
    chest: [hit.crush ? 0.32 : -0.1, -0.25 * hit.twist, 0],
    head: [-0.15, 0, 0.1],
    leadShoulder: [-0.1, 0, 0.7],
    rearShoulder: [0.2, 0, -0.6],
    leadElbow: [-0.85, 0, 0],
    rearElbow: [-1.05, 0, 0],
    leadHip: [-0.72 * tuck, 0.12 * hit.twist, 0.08],
    leadKnee: [1.3 * tuck, 0, 0],
    rearHip: [-0.32, -0.08 * hit.twist, -0.08],
    rearKnee: [0.65 * tuck, 0, 0],
  }
  if (!context.grounded)
    return lerpPose(physicalHitPose(hit, 0), launch, Math.min(1, context.progress / 0.28))
  return sampleTimeline(fallKeys(hit, launch), {
    frame: context.progress * 100,
    frames: { startup: 0, active: 0, recovery: 100 },
    settle: false,
    continuous: true,
  })
}

function fallKeys(hit: PhysicalHit, launch: FightPose): MoveTimeline {
  const lying: FightPose = {
    body: [-1.48, -0.12, 0.03],
    chest: [0.05, -0.12, 0],
    head: [0.2, 0, 0.12],
    leadShoulder: [-0.15, 0, 0.82],
    rearShoulder: [-0.2, 0, -0.8],
    leadElbow: [-0.55, 0, 0],
    rearElbow: [-0.75, 0, 0],
    leadHip: [-0.25, 0, 0.08],
    leadKnee: [0.65, 0, 0],
    rearHip: [-0.05, 0, -0.08],
    rearKnee: [0.22, 0, 0],
  }
  return [
    { phase: 'recovery', at: 0, pose: physicalHitPose(hit, 0.15) },
    { phase: 'recovery', at: 0.12, pose: launch, ease: 'out' },
    {
      phase: 'recovery',
      at: 0.23,
      pose: addPoses(launch, {
        body: [-0.42, 0, 0],
        leadHip: [-0.25, 0, 0],
        rearKnee: [0.35, 0, 0],
        leadShoulder: [0, 0, 0.22],
        rearElbow: [-0.35, 0, 0],
      }),
      ease: 'in',
    },
    { phase: 'recovery', at: 0.32, pose: lying, ease: 'in' },
    {
      phase: 'recovery',
      at: 0.36,
      pose: addPoses(lying, {
        chest: [0.12, 0, 0],
        leadKnee: [0.18, 0, 0],
        rearShoulder: [0, 0, -0.18],
      }),
      ease: 'out',
    },
    { phase: 'recovery', at: 0.4, pose: lying, ease: 'smooth' },
  ]
}
