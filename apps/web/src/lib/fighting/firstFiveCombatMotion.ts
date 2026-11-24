import { addPoses, NEUTRAL_POSE, scalePose, type FightPose } from './fightPose'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, FighterId } from './types'
import { secondFiveLocomotion } from './secondFiveLocomotion'
import { thirdFiveLocomotion } from './thirdFiveLocomotion'
import { fourthFiveLocomotion } from './fourthFiveLocomotion'
import { fifthFiveLocomotion } from './fifthFiveLocomotion'
import { sixthFiveLocomotion } from './sixthFiveLocomotion'
import { seventhFiveLocomotion } from './seventhFiveLocomotion'
import { eighthFiveLocomotion } from './eighthFiveLocomotion'
import { KURAPIKA_1999_GUARD } from './kurapikaLocomotion'

export interface CombatLocomotion {
  stride: number
  stepScale: number
  advance: FightPose
  retreat: FightPose
  weight: FightPose
  swing: FightPose
  guard: FightPose
  jump: FightPose
  takeoff?: FightPose
  landing?: FightPose
}

interface CombatMotion extends CombatLocomotion {
  loadAt: number
  settleAt: number
  load: FightPose
  strike: FightPose
  settle: FightPose
}

const MOTION: Partial<Record<FighterId, CombatMotion>> = {
  kurapika: {
    stride: 0.87,
    stepScale: 0.72,
    loadAt: 0.45,
    settleAt: 0.31,
    advance: { chest: [0, -0.16, 0], leadShoulder: [-0.18, 0, 0.08] },
    retreat: { chest: [0, -0.12, 0], leadElbow: [-0.2, 0, 0], rearKnee: [0.12, 0, 0] },
    weight: { root: [0, -0.014, 0], rearHip: [-0.08, 0, 0], rearKnee: [0.13, 0, 0] },
    swing: { leadPalm: [0.19, 0.23, -0.08], leadWrist: [-0.13, 0, 0.12] },
    guard: KURAPIKA_1999_GUARD,
    jump: { chest: [0, -0.16, 0], leadShoulder: [-0.15, 0, 0.07], rearKnee: [0.18, 0, 0] },
    load: { chest: [0, 0.13, 0], rearKnee: [0.18, 0, 0], rearShoulder: [0.14, 0, 0] },
    strike: { chest: [0, -0.08, 0], rearShoulder: [0.21, 0, -0.12] },
    settle: { body: [-0.11, 0, 0], rearKnee: [0.18, 0, 0], chest: [0, -0.12, 0] },
  },
  hisoka: {
    stride: 1.16,
    stepScale: 1.25,
    loadAt: 0.66,
    settleAt: 0.58,
    advance: { chest: [-0.07, 0.17, 0.06], leadShoulder: [0.12, 0, 0.15] },
    retreat: { body: [-0.13, 0, 0.09], chest: [0, 0.13, -0.07] },
    weight: { root: [0, -0.066, 0], body: [0.14, 0, 0], chest: [-0.12, 0, 0] },
    swing: { body: [0, 0, 0.12], chest: [0, 0.19, -0.12], head: [0, -0.12, 0.1] },
    guard: { chest: [-0.1, 0.25, 0.08], rearShoulder: [-0.3, 0, -0.17], leadElbow: [0.13, 0, 0] },
    jump: { chest: [0, 0.25, -0.13], leadHip: [-0.2, 0, 0.13], rearHip: [0.17, 0, -0.1] },
    load: { body: [-0.08, 0, 0.22], chest: [0, 0.29, -0.14], rearKnee: [0.23, 0, 0] },
    strike: { chest: [0, -0.16, 0.11], head: [0, 0.09, -0.15] },
    settle: { body: [-0.12, 0, -0.13], chest: [0, -0.26, 0.09], head: [0, 0, 0.13] },
  },
  chrollo: {
    stride: 1.04,
    stepScale: 0.82,
    loadAt: 0.36,
    settleAt: 0.45,
    advance: { body: [-0.05, 0.06, 0], chest: [-0.02, -0.1, 0], rearElbow: [-0.13, 0, 0] },
    retreat: { body: [0.05, -0.09, 0], leadShoulder: [-0.22, 0, 0.13] },
    weight: { root: [0, -0.009, 0], pelvis: [0, -0.16, 0], chest: [0, 0.08, 0] },
    swing: { pelvis: [0, 0.17, 0], chest: [0, -0.13, 0], head: [0, 0.08, 0] },
    guard: { body: [-0.05, 0, 0], chest: [0, 0.19, 0], leadShoulder: [-0.26, 0, 0.17] },
    jump: { chest: [-0.12, 0.08, 0], pelvis: [0, -0.16, 0], rearElbow: [-0.16, 0, 0] },
    load: { pelvis: [0, 0.18, 0], chest: [0, -0.13, 0], head: [-0.08, 0, 0] },
    strike: { pelvis: [0, -0.13, 0], chest: [0, 0.11, 0], neck: [-0.08, 0, 0] },
    settle: { chest: [-0.08, 0.19, 0], rearElbow: [-0.14, 0, 0] },
  },
  benjamin: {
    stride: 1.25,
    stepScale: 1.13,
    loadAt: 0.54,
    settleAt: 0.65,
    advance: { root: [0, -0.04, 0], body: [0.11, 0, 0], leadShoulder: [-0.12, 0, 0.12] },
    retreat: { root: [0, -0.045, 0], body: [0.09, 0, 0], leadKnee: [0.18, 0, 0] },
    weight: { root: [0, -0.055, 0], leadKnee: [0.19, 0, 0], rearKnee: [0.21, 0, 0] },
    swing: { pelvis: [0, 0.08, 0.05], chest: [0, -0.07, -0.065] },
    guard: {
      body: [0.13, 0, 0],
      leadKnee: [0.17, 0, 0],
      rearKnee: [0.19, 0, 0],
      leadElbow: [-0.22, 0, 0],
    },
    jump: {
      body: [0.12, 0, 0],
      leadKnee: [0.19, 0, 0],
      rearKnee: [0.22, 0, 0],
      leadElbow: [-0.16, 0, 0],
    },
    load: { root: [0, -0.045, -0.02], body: [0.1, 0, 0], rearKnee: [0.25, 0, 0] },
    strike: { body: [0.13, 0, 0], neck: [-0.1, 0, 0], rearHip: [0.13, 0, 0] },
    settle: { root: [0, -0.04, 0], body: [0.1, 0, 0], rearKnee: [0.23, 0, 0] },
  },
  tserriednich: {
    stride: 0.74,
    stepScale: 0.59,
    loadAt: 0.76,
    settleAt: 0.25,
    advance: { chest: [-0.11, 0.2, 0], head: [0.04, -0.18, 0], leadShoulder: [0.16, 0, 0] },
    retreat: { body: [-0.12, 0, 0], chest: [-0.06, 0.24, 0], head: [0.04, -0.2, 0] },
    weight: { root: [0, -0.008, 0], rearHip: [-0.13, 0, 0], rearKnee: [0.16, 0, 0] },
    swing: { pelvis: [0, 0.1, 0], chest: [0, -0.085, 0], head: [0, -0.045, 0] },
    guard: { chest: [-0.12, 0.28, 0], head: [0.04, -0.24, 0], rearElbow: [-0.23, 0, 0] },
    jump: { body: [-0.15, 0, 0], chest: [0, 0.16, 0], head: [0, -0.15, 0], rearKnee: [0.2, 0, 0] },
    load: { body: [-0.16, 0, 0], head: [0.08, -0.18, 0], rearKnee: [0.16, 0, 0] },
    strike: { chest: [0, 0.21, 0], head: [0, -0.2, 0], rearShoulder: [0.1, 0, 0] },
    settle: { body: [-0.15, 0, 0], chest: [-0.07, 0.18, 0], head: [0.04, -0.16, 0] },
  },
}

export function combatLocomotion(fighter: ArcadeFighter): CombatLocomotion | undefined {
  return (
    MOTION[fighter.id] ??
    secondFiveLocomotion(fighter) ??
    thirdFiveLocomotion(fighter) ??
    fourthFiveLocomotion(fighter) ??
    fifthFiveLocomotion(fighter) ??
    sixthFiveLocomotion(fighter) ??
    seventhFiveLocomotion(fighter) ??
    eighthFiveLocomotion(fighter)
  )
}

export function combatWalk(
  profile: CombatLocomotion,
  phase: number,
  advancing: boolean,
): FightPose {
  const swing = Math.sin(phase)
  const weight = Math.cos(phase) ** 2
  return addPoses(
    advancing ? profile.advance : profile.retreat,
    scalePose(profile.swing, swing * (advancing ? 1 : -0.85)),
    scalePose(profile.weight, weight),
  )
}

export function firstFiveStrike(
  fighter: ArcadeFighter,
  timing: { frames: AttackFrameData; frame: number },
): FightPose {
  const profile = MOTION[fighter.id]
  const attack = fighter.attack
  if (!profile || !attack || (attack.kind !== 'light' && attack.kind !== 'heavy')) {
    return NEUTRAL_POSE
  }
  if (attack.variant === 'throw' || attack.moveId === 'kurapika:standingHeavy') return NEUTRAL_POSE

  const { frames, frame } = timing
  const weight = attack.kind === 'heavy' ? 1 : 0.66
  if (frame < frames.startup) {
    const progress = frame / frames.startup
    return addPoses(
      scalePose(profile.load, motionBeat(progress, profile.loadAt) * weight),
      scalePose(profile.strike, progress ** 3 * weight),
    )
  }
  const recoveryStart = frames.startup + frames.active
  if (frame < recoveryStart) return scalePose(profile.strike, weight)
  const recovery = Math.min(1, (frame - recoveryStart) / Math.max(1, frames.recovery))
  return addPoses(
    scalePose(profile.strike, (1 - recovery) ** 2 * weight),
    scalePose(profile.settle, motionBeat(recovery, profile.settleAt) * weight),
  )
}

function motionBeat(progress: number, peak: number): number {
  const phase = progress < peak ? progress / peak : 1 + (progress - peak) / (1 - peak)
  return Math.sin((phase * Math.PI) / 2)
}
