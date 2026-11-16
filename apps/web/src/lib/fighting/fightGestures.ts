import { scalePose, type FightPose } from './fightPose'
import type { KeyPose, MoveTimeline } from './keyPoseTimeline'

/**
 * A small library of strikes every fighter can be drawn with, as offsets on a
 * ready guard (`READY_ARMS`, the stance's legs and frame). Each gesture is the
 * three beats a 2D fighter is keyed in: the wind-up, the contact, and the
 * follow-through it settles out of.
 *
 * Signs follow `fightPose.ts`. Lead is the upstage limb, nearer the opponent.
 */
export interface Gesture {
  windup: FightPose
  contact: FightPose
  follow?: FightPose
}

/** Fists up, elbows tucked: the guard every archetype strikes from. */
export const READY_ARMS: FightPose = {
  leadShoulder: [-0.8, 0, 0.15],
  leadElbow: [-1.7, 0, 0],
  rearShoulder: [-0.6, 0, -0.15],
  rearElbow: [-2, 0, 0],
}

export const JAB: Gesture = {
  windup: { chest: [0, 0.1, 0], leadShoulder: [0.15, 0, 0], leadElbow: [-0.3, 0, 0] },
  contact: {
    root: [0, 0, 0.06],
    body: [0.06, 0, 0],
    chest: [0.04, -0.3, 0],
    leadShoulder: [-0.75, 0, -0.1],
    leadElbow: [1.6, 0, 0],
  },
  follow: { chest: [0, -0.15, 0], leadShoulder: [-0.45, 0, 0], leadElbow: [0.9, 0, 0] },
}

export const CROSS: Gesture = {
  windup: { chest: [0, -0.25, 0], rearElbow: [-0.2, 0, 0] },
  contact: {
    root: [0, 0, 0.1],
    body: [0.1, 0, 0],
    chest: [0.05, 0.55, 0],
    leadShoulder: [0.3, 0, 0],
    rearShoulder: [-0.95, 0, 0.15],
    rearElbow: [1.8, 0, 0],
    rearKnee: [0.15, 0, 0],
  },
  follow: { chest: [0, 0.3, 0], rearShoulder: [-0.5, 0, 0], rearElbow: [1, 0, 0] },
}

export const CHARGE: Gesture = {
  windup: {
    body: [-0.1, 0, 0],
    chest: [0, -0.35, 0],
    leadKnee: [0.3, 0, 0],
    rearKnee: [0.3, 0, 0],
  },
  contact: {
    root: [0, 0, 0.22],
    body: [0.25, 0, 0],
    chest: [0.05, 0.5, 0],
    leadShoulder: [0.3, 0, 0],
    rearShoulder: [-1, 0, 0.15],
    rearElbow: [1.85, 0, 0],
    leadHip: [-0.4, 0, 0],
    leadKnee: [0.4, 0, 0],
  },
  follow: { body: [0.1, 0, 0], chest: [0, 0.3, 0], rearShoulder: [-0.5, 0, 0] },
}

export const UPPERCUT: Gesture = {
  windup: {
    body: [0.08, 0, 0],
    chest: [0.1, -0.35, 0],
    leadKnee: [0.35, 0, 0],
    rearKnee: [0.35, 0, 0],
    rearShoulder: [0.5, 0, 0],
    rearElbow: [0.3, 0, 0],
  },
  contact: {
    body: [-0.1, 0, 0],
    chest: [-0.12, 0.5, 0],
    head: [-0.2, 0, 0],
    rearShoulder: [-1.9, 0, 0.1],
    rearElbow: [0.9, 0, 0],
    leadKnee: [-0.3, 0, 0],
    rearKnee: [-0.1, 0, 0],
  },
  follow: { chest: [0, 0.25, 0], rearShoulder: [-1.2, 0, 0], rearElbow: [0.6, 0, 0] },
}

export const HOOK: Gesture = {
  windup: { chest: [0, 0.35, 0], leadShoulder: [0.1, 0, 0.3] },
  contact: {
    body: [0.05, 0, 0],
    chest: [0, -0.6, 0],
    leadShoulder: [-0.6, 0, 0.9],
    leadElbow: [0.4, 0, 0],
  },
  follow: { chest: [0, -0.4, 0], leadShoulder: [-0.4, 0, 0.6] },
}

export const BACK_WHIP: Gesture = {
  windup: { root: [0, 0, -0.12], body: [-0.2, 0, 0], chest: [0, 0.4, 0] },
  contact: {
    root: [0, 0, -0.08],
    body: [-0.1, 0, 0],
    chest: [0, -0.5, 0],
    leadShoulder: [-0.9, 0, 0.5],
    leadElbow: [1.3, 0, 0],
    leadWrist: [0.4, 0, 0],
  },
  follow: { chest: [0, -0.3, 0], leadShoulder: [-0.5, 0, 0.3] },
}

export const HIGH_KICK: Gesture = {
  windup: {
    body: [-0.15, 0, 0],
    leadHip: [-1.3, 0, 0.1],
    leadKnee: [1.5, 0, 0],
    leadShoulder: [0.2, 0, 0.4],
    rearShoulder: [0, 0, -0.5],
  },
  contact: {
    body: [-0.35, 0, 0],
    chest: [-0.1, -0.3, 0],
    leadHip: [-1.85, 0, 0.15],
    leadKnee: [-0.35, 0, 0],
    leadShoulder: [0.3, 0, 0.6],
    rearShoulder: [0.1, 0, -0.7],
  },
  follow: { body: [-0.15, 0, 0], leadHip: [-0.9, 0, 0.05], leadKnee: [1, 0, 0] },
}

export const FRONT_KICK: Gesture = {
  windup: { body: [-0.08, 0, 0], leadHip: [-1.1, 0, 0], leadKnee: [1.4, 0, 0] },
  contact: {
    root: [0, 0, 0.05],
    body: [-0.2, 0, 0],
    leadHip: [-1.35, 0, 0],
    leadKnee: [-0.4, 0, 0],
  },
  follow: { leadHip: [-0.7, 0, 0], leadKnee: [0.8, 0, 0] },
}

export const SPIN_KICK: Gesture = {
  windup: { body: [0, 0, -0.1], chest: [0, 0.5, 0] },
  contact: {
    body: [-0.25, 0, -0.35],
    chest: [0, -0.9, 0],
    rearHip: [-1.3, 0, -0.6],
    rearKnee: [-0.1, 0, 0],
    leadShoulder: [0.2, 0, 0.5],
  },
  follow: { chest: [0, -0.4, 0], rearHip: [-0.5, 0, -0.2], rearKnee: [0.6, 0, 0] },
}

export const SLASH: Gesture = {
  windup: {
    chest: [0, 0.3, 0],
    leadShoulder: [-0.5, 0, -0.7],
    leadElbow: [-0.9, 0, 0],
    leadWrist: [-0.4, 0, 0],
  },
  contact: {
    root: [0, 0, 0.05],
    body: [0.05, 0, 0],
    chest: [0, -0.4, 0],
    leadShoulder: [-1.15, 0, 0.55],
    leadElbow: [0.7, 0, 0],
    leadWrist: [0.3, 0, 0],
  },
  follow: { chest: [0, -0.5, 0], leadShoulder: [-0.9, 0, 0.9], leadElbow: [0.5, 0, 0] },
}

export const THRUST: Gesture = {
  windup: { chest: [0, 0.25, 0], leadShoulder: [0.2, 0, 0], leadElbow: [-0.2, 0, 0] },
  contact: {
    root: [0, 0, 0.12],
    body: [0.12, 0, 0],
    chest: [0.05, -0.45, 0],
    leadShoulder: [-0.8, 0, -0.05],
    leadElbow: [1.65, 0, 0],
    leadWrist: [-0.3, 0, 0],
    leadHip: [-0.3, 0, 0],
    leadKnee: [0.35, 0, 0],
  },
  follow: { chest: [0, -0.25, 0], leadShoulder: [-0.5, 0, 0], leadElbow: [1, 0, 0] },
}

export const OVERHEAD: Gesture = {
  windup: {
    body: [-0.15, 0, 0],
    chest: [-0.1, 0.1, 0],
    leadShoulder: [-1.9, 0, 0.1],
    leadElbow: [1.2, 0, 0],
    rearShoulder: [-1.7, 0, -0.1],
    rearElbow: [1.4, 0, 0],
  },
  contact: {
    body: [0.25, 0, 0],
    chest: [0.12, -0.2, 0],
    head: [0.15, 0, 0],
    leadShoulder: [-0.7, 0, 0],
    leadElbow: [1.5, 0, 0],
    rearShoulder: [-0.9, 0, 0],
    rearElbow: [1.8, 0, 0],
    leadKnee: [0.25, 0, 0],
    rearKnee: [0.2, 0, 0],
  },
  follow: { body: [0.15, 0, 0], leadShoulder: [-0.3, 0, 0], leadElbow: [1, 0, 0] },
}

export const PALM_PUSH: Gesture = {
  windup: {
    chest: [0, 0.3, 0],
    leadShoulder: [0.3, 0, 0],
    leadElbow: [-0.2, 0, 0],
    leadWrist: [0.4, 0, 0],
  },
  contact: {
    root: [0, 0, 0.05],
    chest: [0, -0.4, 0],
    leadShoulder: [-0.8, 0, 0],
    leadElbow: [1.6, 0, 0],
    leadWrist: [-0.9, 0, 0],
  },
  follow: { leadShoulder: [-0.6, 0, 0], leadElbow: [1.3, 0, 0], leadWrist: [-0.5, 0, 0] },
}

export const DOUBLE_PALM: Gesture = {
  windup: {
    body: [-0.05, 0, 0],
    chest: [0, 0.15, 0],
    leadShoulder: [0.4, 0, 0.2],
    rearShoulder: [0.4, 0, -0.2],
    leadElbow: [-0.1, 0, 0],
    leadKnee: [0.2, 0, 0],
    rearKnee: [0.2, 0, 0],
  },
  contact: {
    root: [0, 0, 0.06],
    body: [0.12, 0, 0],
    chest: [0, -0.1, 0],
    leadShoulder: [-0.8, 0, -0.15],
    rearShoulder: [-1, 0, 0.2],
    leadElbow: [1.6, 0, 0],
    rearElbow: [1.9, 0, 0],
    leadWrist: [-0.9, 0, 0],
    rearWrist: [-0.9, 0, 0],
  },
  follow: {
    leadShoulder: [-0.5, 0, 0],
    rearShoulder: [-0.6, 0, 0],
    leadElbow: [1.2, 0, 0],
    rearElbow: [1.4, 0, 0],
  },
}

/** Low gestures are offsets on the crouch. */
export const LOW_JAB: Gesture = {
  windup: { chest: [0, 0.12, 0], leadElbow: [-0.3, 0, 0] },
  contact: {
    body: [0.12, 0, 0],
    chest: [0.1, -0.3, 0],
    leadShoulder: [-0.5, 0, -0.1],
    leadElbow: [1.55, 0, 0],
    leadWrist: [0.3, 0, 0],
  },
}

export const LOW_KICK: Gesture = {
  windup: { leadKnee: [0.25, 0, 0] },
  contact: { body: [-0.05, 0, 0], leadHip: [-0.15, 0, 0.05], leadKnee: [-1.7, 0, 0] },
  follow: { leadKnee: [-0.8, 0, 0] },
}

export const SWEEP: Gesture = {
  windup: { chest: [0, 0.4, 0], leadHip: [0.3, 0, 0], leadKnee: [0.2, 0, 0] },
  contact: {
    body: [0.15, 0, 0],
    chest: [0.1, -0.7, 0],
    leadHip: [-0.15, 0, 0.35],
    leadKnee: [-1.85, 0, 0],
    rearKnee: [0.15, 0, 0],
    rearShoulder: [0.4, 0, -0.3],
  },
  follow: { chest: [0, -0.35, 0], leadKnee: [-0.9, 0, 0] },
}

/** Air gestures are offsets on the air tuck. */
export const AIR_PUNCH: Gesture = {
  windup: { chest: [0, 0.15, 0], leadElbow: [-0.2, 0, 0] },
  contact: {
    body: [0.2, 0, 0],
    chest: [0.1, -0.25, 0],
    leadShoulder: [-0.4, 0, 0],
    leadElbow: [1.55, 0, 0],
    leadWrist: [0.35, 0, 0],
  },
}

export const AIR_SLASH: Gesture = {
  windup: { chest: [0, 0.3, 0], leadShoulder: [-1.4, 0, 0.1], leadElbow: [0.6, 0, 0] },
  contact: {
    body: [0.3, 0, 0],
    chest: [0.1, -0.3, 0],
    leadShoulder: [-0.2, 0, 0.3],
    leadElbow: [1.4, 0, 0],
    leadWrist: [0.5, 0, 0],
  },
}

export const DIVE_KICK: Gesture = {
  windup: { body: [-0.1, 0, 0], leadHip: [-0.4, 0, 0], leadKnee: [0.6, 0, 0] },
  contact: {
    body: [0.35, 0, 0],
    chest: [0, -0.3, 0],
    leadHip: [-0.5, 0, 0],
    leadKnee: [-1.25, 0, 0],
    leadShoulder: [0.7, 0, 0.3],
    rearShoulder: [0.5, 0, -0.3],
  },
}

/** Wind-up eases in, contact snaps on the first active frame and holds. */
export function strikeTimeline(gesture: Gesture, amount = 1): MoveTimeline {
  const keys: KeyPose[] = [
    { phase: 'startup', at: 0.6, ease: 'out', pose: scalePose(gesture.windup, amount) },
    { phase: 'active', at: 0, ease: 'snap', pose: scalePose(gesture.contact, amount) },
  ]
  if (gesture.follow) {
    keys.push({ phase: 'recovery', at: 0.35, ease: 'out', pose: scalePose(gesture.follow, amount) })
  }
  return keys
}
