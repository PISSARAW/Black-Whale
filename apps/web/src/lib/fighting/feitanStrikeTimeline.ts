import { fightStance } from './fightStance'
import { addPoses, type FightPose } from './fightPose'
import type { MoveTimeline } from './keyPoseTimeline'

interface BladeBeats {
  load: FightPose
  contact: FightPose
  cut?: FightPose
  catch: FightPose
}

/** Absolute arm angles prevent idle changes from turning every blade cut into a jab. */
function fromGuard(pose: FightPose): FightPose {
  const next = { ...pose },
    standing = fightStance('feitan')!.pose
  for (const joint of [
    'leadShoulder',
    'leadElbow',
    'leadWrist',
    'rearShoulder',
    'rearElbow',
    'rearWrist',
  ] as const) {
    if (!pose[joint]) continue
    const base = standing[joint] ?? [0, 0, 0],
      turn = pose[joint]
    next[joint] = [turn[0] - base[0], turn[1] - base[1], turn[2] - base[2]]
  }
  return next
}

export function feitanStrike(beats: BladeBeats): MoveTimeline {
  const cut = beats.cut ?? beats.contact
  return [
    { phase: 'startup', at: 0.62, ease: 'out', pose: fromGuard(beats.load) },
    { phase: 'active', at: 0, ease: 'in', pose: fromGuard(beats.contact) },
    { phase: 'active', at: 0.85, ease: 'out', pose: fromGuard(cut) },
    { phase: 'recovery', at: 0.2, ease: 'out', pose: fromGuard(cut) },
    { phase: 'recovery', at: 0.72, ease: 'smooth', pose: fromGuard(beats.catch) },
  ]
}

export const FEITAN_BLADE_SUPPORT: FightPose = {
  leadHip: [-0.68, 0, 0.08],
  leadKnee: [0.94, 0, 0],
  rearHip: [-0.25, 0, -0.08],
  rearKnee: [0.62, 0, 0],
}

export function bladeDrive(pose: FightPose): FightPose {
  return addPoses(FEITAN_BLADE_SUPPORT, pose)
}
