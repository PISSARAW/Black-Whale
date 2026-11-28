import { strikeTimeline } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

const feitanOpening = strikeTimeline(
  {
    root: [0, -0.065, -0.04],
    chest: [0.1, 0.5, 0.05],
    rearShoulder: [0.32, 0, 0.25],
    rearElbow: [-1.72, 0, 0],
    rearKnee: [0.52, 0, 0],
  },
  {
    root: [0, -0.055, 0.18],
    chest: [0.26, -0.42, 0],
    rearShoulder: [-1.36, 0.03, 0.22],
    rearElbow: [-0.19, 0, 0],
    rearWrist: [-0.35, 0, 0],
    leadHip: [-0.3, 0, 0],
  },
  {
    root: [0, -0.05, 0.1],
    chest: [0.16, -0.16, 0],
    rearShoulder: [-0.8, 0, 0.26],
    rearElbow: [-0.66, 0, 0],
  },
)

const feitanLow = strikeTimeline(
  {
    root: [0, -0.13, 0.04],
    chest: [0.4, -0.4, 0],
    rearShoulder: [-0.63, 0, -0.32],
    rearElbow: [-1.17, 0, 0],
    rearKnee: [0.64, 0, 0],
  },
  {
    root: [0, -0.23, 0.18],
    chest: [0.36, 0.57, -0.15],
    rearShoulder: [-0.89, 0, 0.64],
    rearElbow: [-0.28, 0, 0],
    rearWrist: [0.27, 0.27, 0.33],
    leadKnee: [0.56, 0, 0],
  },
  {
    root: [0, -0.17, 0.1],
    chest: [0.24, 0.45, 0],
    rearElbow: [-0.93, 0, 0],
    leadKnee: [0.55, 0, 0],
  },
)

const feitanFinish = strikeTimeline(
  {
    root: [0, -0.19, -0.12],
    pelvis: [0, 0.46, 0],
    chest: [0.18, 0.76, -0.08],
    rearShoulder: [-0.51, 0, -0.37],
    rearElbow: [-1.74, 0, 0],
    leadKnee: [0.62, 0, 0],
  },
  {
    root: [0, -0.055, 0.26],
    pelvis: [0, -0.57, 0],
    body: [0.26, -0.68, -0.16],
    rearShoulder: [-1.95, 0.26, 0.44],
    rearElbow: [-0.21, 0, 0],
    rearWrist: [-0.32, 0.26, 0.18],
    rearHip: [0.41, 0, 0],
  },
  {
    root: [0, -0.095, 0.17],
    chest: [0.23, -0.44, 0],
    rearShoulder: [-0.74, 0, 0.52],
    rearElbow: [-0.58, 0, 0],
  },
)

const kurapikaCast = strikeTimeline(
  {
    root: [0, -0.05, -0.03],
    chest: [0.12, 0.5, 0],
    leadShoulder: [-0.65, 0, -0.31],
    leadElbow: [-1.44, 0, 0],
  },
  {
    root: [0, -0.11, 0.06],
    chest: [0.28, -0.32, 0],
    leadShoulder: [-1.25, 0, -0.19],
    leadElbow: [-0.15, 0, 0],
    leadWrist: [0.38, 0, 0.14],
    leadKnee: [0.51, 0, 0],
  },
  { chest: [0.17, -0.13, 0], leadShoulder: [-0.83, 0, -0.18], leadElbow: [-0.76, 0, 0] },
)

const kurapikaPull = strikeTimeline(
  {
    root: [0, -0.04, 0.07],
    chest: [0.22, -0.38, 0],
    leadShoulder: [-1.44, 0, -0.18],
    leadElbow: [-0.14, 0, 0],
  },
  {
    root: [0, -0.09, -0.16],
    chest: [-0.24, 0.37, 0.07],
    leadShoulder: [-0.5, 0, -0.22],
    leadElbow: [-1.75, 0, 0],
    leadWrist: [-0.18, 0.13, 0],
    rearKnee: [0.51, 0, 0],
  },
  { root: [0, -0.07, -0.11], chest: [-0.13, 0.32, 0], leadElbow: [-1.35, 0, 0] },
)

const kurapikaHeel = strikeTimeline(
  {
    root: [0, -0.07, -0.04],
    pelvis: [0, 0.36, 0],
    body: [0.12, 0.43, 0],
    leadHip: [-0.49, 0, 0],
    leadKnee: [0.75, 0, 0],
    leadElbow: [-1.23, 0, 0],
  },
  {
    root: [0, -0.05, 0.16],
    pelvis: [0, -0.51, 0.18],
    body: [-0.14, -0.31, -0.15],
    leadHip: [-0.68, -0.25, 0.12],
    leadKnee: [0.05, 0, 0],
    leadFoot: [0.35, 0, 0],
    leadElbow: [-1.46, 0, 0],
  },
  {
    root: [0, -0.03, 0.06],
    body: [0.09, -0.26, 0],
    leadHip: [-0.31, 0, 0],
    leadKnee: [0.36, 0, 0],
  },
)

const PERSONAL_SIGNATURE_POSES: Readonly<Record<string, MoveTimeline>> = {
  'feitan:scabbard-reversal-opening': feitanOpening,
  'feitan:scabbard-reversal-transition': carry(feitanOpening, feitanLow),
  'feitan:scabbard-reversal': feitanFinish,
  'kurapika:chain-heel-opening': kurapikaCast,
  'kurapika:chain-heel-transition': carry(kurapikaCast, kurapikaPull),
  'kurapika:chain-heel': kurapikaHeel,
}

function carry(previous: MoveTimeline, next: MoveTimeline): MoveTimeline {
  return [{ phase: 'startup', at: 0, pose: previous[1].pose }, ...next]
}

/** The weapons stay on anatomical hands when the opponent changes sides. */
export function personalSignaturePose(fighter: ArcadeFighter): MoveTimeline | undefined {
  const timeline = PERSONAL_SIGNATURE_POSES[fighter.attack?.moveId ?? '']
  if (!timeline || fighter.facing === 1) return timeline
  return timeline.map((key) => ({ ...key, pose: switchHands(key.pose) }))
}

function switchHands(pose: FightPose): FightPose {
  return {
    ...pose,
    leadShoulder: pose.rearShoulder,
    rearShoulder: pose.leadShoulder,
    leadElbow: pose.rearElbow,
    rearElbow: pose.leadElbow,
    leadWrist: pose.rearWrist,
    rearWrist: pose.leadWrist,
    leadPalm: pose.rearPalm,
    rearPalm: pose.leadPalm,
  }
}
