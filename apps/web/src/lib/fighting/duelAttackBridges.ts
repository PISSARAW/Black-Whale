import { rightHandedPose } from './fightHandedPose'
import { addPoses, lerpPose, scalePose, type FightPose } from './fightPose'
import { rosterComboBridge } from './rosterComboMotion'
import { groundStrikeMove } from './rosterStrikeMotion'

const BRIDGES: Readonly<Record<string, FightPose>> = {
  'kurapika:backHeavy>kurapika:forwardLight': {
    body: [0.04, 0.08, 0],
    chest: [0.02, 0.2, 0],
    leadShoulder: [0.18, 0, -0.12],
    leadElbow: [-0.55, 0, 0],
    leadWrist: [-0.1, 0, 0],
    rearKnee: [0.14, 0, 0],
  },
  'kurapika:forwardLight>kurapika:standingHeavy': {
    body: [-0.04, 0.12, 0],
    chest: [0.06, 0.38, 0],
    leadShoulder: [0.3, 0, -0.3],
    leadElbow: [-0.95, 0, 0],
    leadWrist: [-0.18, 0, 0],
    rearShoulder: [-0.08, 0, 0.08],
    leadKnee: [0.12, 0, 0],
    rearKnee: [0.22, 0, 0],
  },
  'kurapika:standingLight>kurapika:standingHeavy': {
    chest: [0.05, 0.32, 0],
    leadShoulder: [0.26, 0, -0.26],
    leadElbow: [-0.8, 0, 0],
    rearKnee: [0.16, 0, 0],
  },
  'kurapika:standingHeavy>kurapika:forwardSpecial': {
    body: [0.02, 0.12, 0],
    chest: [0.04, 0.28, 0],
    leadShoulder: [0.12, 0, -0.22],
    leadElbow: [-0.62, 0, 0],
    leadWrist: [-0.35, 0, 0],
    rearShoulder: [-0.12, 0, 0.05],
    rearKnee: [0.16, 0, 0],
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
  const pose = BRIDGES[`${from}>${to}`] ?? rosterComboBridge(from, to)
  const id = to.split(':')[0]
  const keepHand = ['kurapika', 'chrollo', 'luini', 'shizuku'].includes(id)
  return pose && facing === -1 && keepHand ? rightHandedPose(pose) : pose
}

export function bridgeTarget(moveId?: string): boolean {
  return Boolean(groundStrikeMove(moveId)) || moveId === 'hisoka:neutralSpecial'
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
