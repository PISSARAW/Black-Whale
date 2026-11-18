import { attackData } from './frameData'
import { fightExpressionProfile } from './fightExpressionProfiles'
import type { ArcadeFighter, FighterId } from './types'

export type FightEmotion = 'concentration' | 'effort' | 'pain' | 'rest'
export interface FightFacePose {
  eye: number
  brow: number
  lift: number
  effort: number
  pain: number
  smile: number
  headPitch: number
  headYaw: number
  gaze: number
  headRoll: number
  shoulder: number
}
export const REST_FACE: Readonly<FightFacePose> = {
  eye: 1,
  brow: 0,
  lift: 0,
  effort: 0,
  pain: 0,
  smile: 0,
  headPitch: 0,
  headYaw: 0,
  gaze: 0,
  headRoll: 0,
  shoulder: 0,
}
export const FACE_CONTROLS = Object.keys(REST_FACE) as (keyof FightFacePose)[]
export const hasFightExpression = (id: FighterId) => Boolean(fightExpressionProfile({ id }))
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function fightExpressionTarget(fighter: ArcadeFighter, progress: number, activity = 0) {
  const profile = fightExpressionProfile(fighter)
  if (!profile || fighter.easterEgg) return { mode: 'rest' as const, pose: { ...REST_FACE } }
  const stimulus = expressionStimulus(fighter, clamp(progress), clamp(activity))
  const pain = stimulus.pain * profile.intensity
  const effort = stimulus.effort * profile.intensity
  const eyes = profile.eyeResponse ?? 1,
    brows = profile.browResponse ?? 1,
    body = profile.bodyResponse ?? 1
  const pose: FightFacePose = {
    eye: Math.max(0.18, profile.eye - (pain * 0.53 + effort * 0.16) * eyes),
    brow: profile.brow + (effort * 0.18 - pain * 0.38) * brows,
    lift: (-0.002 - effort * 0.004 + pain * 0.009) * brows,
    effort: clamp(effort),
    pain: clamp(pain),
    smile: profile.smile * (1 - clamp(pain)) * (1 - effort * 0.6),
    headPitch: (0.025 + effort * 0.035 - pain * 0.05) * body,
    // Open the face to the camera while the pupils continue aiming at the opponent.
    headYaw: -fighter.facing * (profile.opening ?? 0.42),
    gaze: fighter.facing * (profile.gaze ?? 0.005),
    headRoll: pain * 0.045 * body,
    shoulder: profile.shoulder * (0.3 + effort + pain * 0.65),
  }
  return { mode: stimulus.mode, pose: constrainExpression(fighter, pose) }
}

function constrainExpression(fighter: ArcadeFighter, pose: FightFacePose) {
  if (fighter.health <= 0) pose.eye = 0.1
  if (fighter.parallelEyesClosed) {
    pose.eye = 1
    pose.gaze = 0
  }
  if (fighter.melodyPerformance) {
    pose.effort = 0
    pose.smile = 0
    pose.headPitch = 0
    pose.headYaw = 0
    pose.headRoll = 0
    pose.gaze = 0
    pose.shoulder = 0
  }
  return pose
}

function expressionStimulus(fighter: ArcadeFighter, progress: number, activity: number) {
  // An interrupted attack must never keep a smile/effort expression over a received hit.
  if (fighter.health <= 0 || fighter.pose === 'ko')
    return { mode: 'pain' as const, pain: 0.8, effort: 0 }
  if (fighter.hitStun > 0 || fighter.pose === 'hit' || fighter.pose === 'down')
    return { mode: 'pain' as const, pain: 1 - progress * 0.4, effort: 0 }
  if (fighter.pose === 'wakeup')
    return { mode: 'pain' as const, pain: (1 - progress) * 0.4, effort: 0 }
  if (fighter.attack) return { mode: 'effort' as const, pain: 0, effort: attackEffort(fighter) }
  if (fighter.blockStun > 0) return { mode: 'effort' as const, pain: 0, effort: 0.5 }
  if (activity > 0) return { mode: 'effort' as const, pain: 0, effort: activity }
  return { mode: 'concentration' as const, pain: 0, effort: 0 }
}

function attackEffort(fighter: ArcadeFighter) {
  const attack = fighter.attack!
  const frames = attackData(attack.kind, fighter)
  const recovery = Math.max(0, attack.frame - frames.startup - frames.active)
  const settle = 1 - clamp(recovery / Math.max(1, frames.recovery)) * 0.8
  const force = attack.kind === 'light' ? 0.55 : 0.9
  return force * settle
}
