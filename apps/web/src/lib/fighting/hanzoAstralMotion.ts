import { attackData } from './frameData'
import { addPoses, scalePose, type BodyPlan, type FightPose } from './fightPose'
import { HANZO_FLOAT_POSE } from './keyPosesHanzo'
import { sampleTimeline, type MoveTimeline } from './keyPoseTimeline'
import type { ArcadeFighter, MoveSlot } from './types'

interface AstralStrike {
  load: FightPose
  hit: FightPose
  release: FightPose
}

const STRIKES: Partial<Record<MoveSlot, AstralStrike>> = {
  standingLight: {
    load: { leadElbow: [-0.6, 0, 0], chest: [0, 0.13, 0] },
    hit: { leadShoulder: [-1.02, 0, 0.08], leadElbow: [0.34, 0, 0], leadPalm: [-0.34, 0.22, 0] },
    release: { leadElbow: [-0.48, 0, 0], leadPalm: [-0.1, 0.17, 0] },
  },
  standingHeavy: {
    load: { chest: [0, 0.23, 0.16], rearShoulder: [-0.92, 0.23, -0.25], rearElbow: [-0.56, 0, 0] },
    hit: {
      chest: [0.04, -0.24, -0.11],
      rearShoulder: [-1.48, -0.15, -0.25],
      rearElbow: [0.35, 0, 0],
      rearPalm: [0.19, -0.27, 0],
    },
    release: { chest: [0, -0.11, 0], rearShoulder: [-0.5, 0, -0.16] },
  },
  lowLight: {
    load: { chest: [0.13, -0.11, 0.12], leadElbow: [-0.4, 0, 0] },
    hit: {
      root: [0, -0.05, 0.04],
      chest: [0.29, -0.1, 0.15],
      leadShoulder: [-0.24, 0, 0.18],
      leadPalm: [0.25, 0.23, 0],
      rearKnee: [0.25, 0, 0],
    },
    release: { chest: [0.14, 0, 0.07], leadElbow: [-0.25, 0, 0] },
  },
  lowHeavy: {
    load: { body: [-0.12, 0.24, 0.18], rearHip: [-0.49, 0, -0.12], rearKnee: [0.5, 0, 0] },
    hit: {
      root: [0, -0.07, 0],
      body: [0.06, -0.37, -0.25],
      rearHip: [-0.65, 0.29, -0.41],
      rearKnee: [-0.52, 0, 0],
      leadKnee: [0.22, 0, 0],
      rearShoulder: [0.11, 0, -0.42],
    },
    release: { body: [-0.08, -0.19, -0.14], rearHip: [-0.22, 0, -0.15], rearKnee: [0.35, 0, 0] },
  },
  airLight: {
    load: { chest: [-0.11, 0.14, -0.12], leadElbow: [-0.54, 0, 0], rearHip: [0.24, 0, -0.15] },
    hit: {
      root: [0, 0.1, 0.045],
      chest: [-0.03, -0.24, 0.15],
      leadShoulder: [-1.12, 0.19, 0.2],
      leadElbow: [0.32, 0, 0],
      rearKnee: [0.17, 0, 0],
    },
    release: { chest: [-0.07, -0.08, 0.08], leadShoulder: [-0.4, 0, 0.12] },
  },
  airHeavy: {
    load: {
      chest: [-0.1, 0.21, 0],
      leadShoulder: [-0.58, 0.2, 0.29],
      rearShoulder: [-0.64, 0.12, -0.3],
      leadElbow: [-0.54, 0, 0],
      rearElbow: [-0.65, 0, 0],
    },
    hit: {
      root: [0, 0.08, 0.065],
      chest: [0.12, -0.11, 0],
      leadShoulder: [-0.64, -0.37, -0.15],
      rearShoulder: [-1.43, 0.37, 0.12],
      leadElbow: [-0.61, 0, 0],
      rearElbow: [-0.57, 0, 0],
      leadKnee: [0.34, 0, 0],
      rearHip: [0.21, 0, -0.14],
    },
    release: { chest: [-0.08, 0.06, 0], leadElbow: [-0.35, 0, 0], rearShoulder: [-0.53, 0, -0.2] },
  },
  forwardLight: {
    load: { body: [-0.09, 0, 0], leadElbow: [-0.45, 0, 0], rearShoulder: [0.22, 0, -0.2] },
    hit: {
      root: [0, 0.025, 0.095],
      body: [0.15, 0, 0],
      leadShoulder: [-0.78, 0, 0.13],
      leadElbow: [0.4, 0, 0],
      leadPalm: [-0.22, 0.17, 0],
      rearHip: [0.29, 0, -0.1],
    },
    release: { root: [0, 0.035, 0.055], body: [0.08, 0, 0], leadElbow: [-0.32, 0, 0] },
  },
  forwardHeavy: {
    load: {
      body: [-0.1, 0.25, 0.09],
      rearShoulder: [-0.56, -0.22, -0.29],
      rearElbow: [-0.58, 0, 0],
    },
    hit: {
      root: [0, 0.04, 0.105],
      body: [0.13, -0.28, -0.14],
      rearShoulder: [-1.63, 0.12, -0.12],
      rearElbow: [0.42, 0, 0],
      leadShoulder: [0.22, 0, 0.22],
      rearHip: [0.33, 0, -0.1],
    },
    release: { body: [0.015, -0.13, -0.06], rearShoulder: [-0.72, 0, -0.17] },
  },
  backHeavy: {
    load: { root: [0, 0.03, -0.08], chest: [-0.06, -0.22, -0.12], leadElbow: [-0.55, 0, 0] },
    hit: {
      root: [0, 0.035, -0.095],
      chest: [-0.11, 0.38, 0.17],
      leadShoulder: [-0.52, -0.29, 0.37],
      leadElbow: [0.21, 0, 0],
      leadWrist: [0.23, 0.2, -0.32],
      leadHip: [-0.27, 0, 0.16],
    },
    release: { root: [0, 0.02, -0.04], chest: [-0.08, 0.17, 0.08], leadElbow: [-0.4, 0, 0] },
  },
}

function astralTimeline(strike: AstralStrike): MoveTimeline {
  return [
    { phase: 'startup', at: 0.26, pose: scalePose(strike.load, 0.52), ease: 'smooth' },
    { phase: 'startup', at: 0.7, pose: strike.load, ease: 'out' },
    { phase: 'active', at: 0, pose: strike.hit, ease: 'out' },
    { phase: 'active', at: 1, pose: strike.hit },
    { phase: 'recovery', at: 0.39, pose: strike.release, ease: 'smooth' },
    { phase: 'recovery', at: 0.79, pose: scalePose(strike.release, 0.24), ease: 'out' },
  ]
}

const TIMELINES: Partial<Record<MoveSlot, MoveTimeline>> = Object.fromEntries(
  Object.entries(STRIKES).map(([slot, strike]) => [slot, astralTimeline(strike)]),
)

export function hanzoAstralNormal(
  fighter: ArcadeFighter,
  slot: MoveSlot,
): MoveTimeline | undefined {
  if (fighter.id !== 'hanzo' || !fighter.hanzoProjection) return undefined
  const attack = fighter.attack
  if (
    attack &&
    (attack.variant === 'throw' || (attack.kind !== 'light' && attack.kind !== 'heavy'))
  )
    return undefined
  return TIMELINES[slot]
}

export function hanzoAstralStrikePlan(
  fighter: ArcadeFighter,
  slot: MoveSlot,
  fraction: number,
): BodyPlan | null {
  const timeline = hanzoAstralNormal(fighter, slot)
  const attack = fighter.attack
  if (!timeline || !attack) return null
  const strike = sampleTimeline(timeline, {
    frames: attackData(attack.kind, fighter),
    frame: attack.frame + fraction,
    continuous: true,
  })
  return {
    pose: addPoses(HANZO_FLOAT_POSE, strike),
    key: `astral-double:attack:${slot}`,
    plant: false,
    blend: 0.035,
  }
}

export function hanzoAstralRestPlan(fighter: ArcadeFighter, seconds: number): BodyPlan | null {
  if (!fighter.hanzoProjection || fighter.attack) return null
  const ownDouble = fighter.id === 'hanzo' && fighter.hanzoProjection.startupFrames <= 0
  const gliding = ownDouble && fighter.pose === 'walk'
  const drift = ownDouble ? Math.sin(seconds * 4.8) : 0
  const suspension: FightPose = {
    root: [0, 0.028 * drift, 0],
    chest: [0, 0.053 * drift, 0.035 * drift],
    rearKnee: [0.07 * drift, 0, 0],
  }
  const glide: FightPose = {
    body: [0.13, 0, 0.09],
    leadShoulder: [-0.15, 0.08, 0.13],
    rearShoulder: [0.24, 0.08, -0.2],
    leadHip: [0.16, 0, 0],
    rearHip: [0.21, 0, -0.13],
    rearKnee: [-0.2, 0, 0],
  }
  return {
    pose: addPoses(HANZO_FLOAT_POSE, suspension, gliding ? glide : {}),
    key: gliding ? 'astral-double:glide' : 'astral-double',
    plant: false,
    blend: 0.12,
  }
}
