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
    body: [-0.68, -0.08 * hit.twist, 0.08],
    chest: [0.13, -0.2 * hit.twist, 0],
    head: [-0.15, 0, 0.1],
    leadShoulder: [-0.1, 0, 0.7],
    rearShoulder: [0.2, 0, -0.6],
    leadElbow: [-0.85, 0, 0],
    rearElbow: [-1.05, 0, 0],
    leadHip: [-0.52 * tuck, 0, 0.08],
    leadKnee: [tuck, 0, 0],
    rearHip: [-0.22, 0, -0.08],
    rearKnee: [0.5, 0, 0],
  }
  if (!context.grounded)
    return lerpPose(physicalHitPose(hit, 0), launch, Math.min(1, context.progress / 0.18))
  return sampleTimeline(fallKeys(launch), {
    frame: context.progress * 100,
    frames: { startup: 0, active: 0, recovery: 100 },
    settle: false,
    continuous: true,
  })
}

function fallKeys(launch: FightPose): MoveTimeline {
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
    { phase: 'recovery', at: 0, pose: launch },
    { phase: 'recovery', at: 0.25, pose: launch, ease: 'out' },
    { phase: 'recovery', at: 0.48, pose: lying, ease: 'in' },
    {
      phase: 'recovery',
      at: 0.57,
      pose: addPoses(lying, { chest: [0.12, 0, 0], leadKnee: [0.18, 0, 0] }),
      ease: 'out',
    },
    { phase: 'recovery', at: 0.7, pose: lying, ease: 'smooth' },
  ]
}
