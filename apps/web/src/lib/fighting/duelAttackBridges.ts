import { rightHandedPose } from './fightHandedPose'
import { addPoses, lerpPose, scalePose, type FightPose } from './fightPose'

const BRIDGES: Readonly<Record<string, FightPose>> = {
  'kurapika:standingLight>kurapika:standingHeavy': {
    chest: [0.05, 0.32, 0],
    leadShoulder: [0.26, 0, -0.26],
    leadElbow: [-0.8, 0, 0],
    rearKnee: [0.16, 0, 0],
  },
  'kurapika:standingHeavy>kurapika:forwardSpecial': {
    chest: [0.07, 0.16, 0],
    leadShoulder: [0.23, 0, 0.24],
    leadElbow: [-0.44, 0, 0],
    leadWrist: [-0.22, 0, 0],
  },
  'hisoka:standingLight>hisoka:standingHeavy': {
    chest: [-0.05, 0.24, 0.05],
    leadHip: [-0.56, 0, 0.04],
    leadKnee: [1.05, 0, 0],
    leadShoulder: [0, 0, 0.28],
    rearKnee: [0.13, 0, 0],
  },
  'hisoka:standingHeavy>hisoka:neutralSpecial': {
    chest: [0.08, -0.1, 0],
    leadKnee: [0.65, 0, 0],
    leadElbow: [-0.5, 0, 0],
    leadWrist: [0.24, 0, 0],
  },
}

export function duelBridge(from: string, to: string, facing: 1 | -1): FightPose | undefined {
  const pose = BRIDGES[`${from}>${to}`]
  return pose && facing === -1 && to.startsWith('kurapika:') ? rightHandedPose(pose) : pose
}

export function bridgeTarget(moveId?: string): boolean {
  return (
    moveId === 'kurapika:standingHeavy' ||
    moveId === 'kurapika:forwardSpecial' ||
    moveId === 'hisoka:standingHeavy' ||
    moveId === 'hisoka:neutralSpecial'
  )
}

/** The preparation is made from the outgoing gesture and the incoming point of contact. */
export function flowThroughBridge(options: {
  from: FightPose
  contact: FightPose
  load: FightPose
  progress: number
}): FightPose {
  const { from, contact, load, progress } = options
  if (progress <= 0) return from
  if (progress >= 1) return contact
  const guide = addPoses(lerpPose(from, contact, 0.45), scalePose(load, 2))
  return lerpPose(lerpPose(from, guide, progress), lerpPose(guide, contact, progress), progress)
}
