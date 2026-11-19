import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const GUARD: FightPose = {
  body: [0.1, -0.2, 0],
  chest: [0.08, -0.2, 0],
  head: [-0.1, 0.15, 0],
  leadShoulder: [-1.1, 0, 0.15],
  leadElbow: [-0.9, 0, 0],
  rearShoulder: [-1.05, 0, -0.25],
  rearElbow: [-1.1, 0, 0],
  leadHip: [-0.25, 0, 0.1],
  leadKnee: [0.35, 0, 0],
  rearKnee: [0.25, 0, 0],
}
const LOCK: FightPose = {
  ...GUARD,
  body: [0.35, -0.75, 0.08],
  chest: [0.12, -0.3, 0],
  leadShoulder: [-0.65, -0.25, 0.55],
  leadElbow: [-1.55, 0, 0],
  rearShoulder: [-1.35, 0.15, -0.15],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.65, 0, 0.15],
  leadKnee: [0.9, 0, 0],
  rearKnee: [0.5, 0, 0],
}
const PIN: FightPose = {
  ...LOCK,
  root: [0, -0.2, 0],
  body: [0.55, -0.45, 0],
  leadShoulder: [-0.45, 0, 0.2],
  rearShoulder: [-0.5, 0, -0.2],
  leadHip: [-0.9, 0, 0.1],
  leadKnee: [1.4, 0, 0],
  rearKnee: [1.1, 0, 0],
}
export const THETA_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'theta-disarm',
    name: 'Désarmer la menace',
    effect: 'bodyguard',
    detail: { yaw: 0.45, anchor: 'hand', victim: 'wrist' },
    beats: [
      {
        at: 0,
        attacker: GUARD,
        victim: { ...THROW_CAPTURE, leadElbow: [-1.6, 0, 0] },
        path: [0, 0, 0],
      },
      {
        at: 0.36,
        attacker: LOCK,
        victim: { ...THROW_CAPTURE, body: [0.7, -0.65, 0.25], leadShoulder: [0.35, 0.2, 0.2] },
        path: [0.2, 1.6, -0.15],
      },
      {
        at: 0.66,
        attacker: PIN,
        victim: { ...THROW_LAND, body: [-1.35, -0.4, 0.18] },
        path: [0.9, 0.8, -0.1],
      },
      { at: 0.8, attacker: PIN, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: GUARD, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.45, 1.75, 1.2, 0.78],
      [-0.7, 2.1, 1.05, 0.8],
      [0.35, 3.9, 0.6, 0.8],
    ],
  },
  {
    id: 'theta-blind-spot',
    name: 'Angle mort',
    effect: 'bodyguard',
    detail: { yaw: -0.65, anchor: 'head', victim: 'wrist' },
    beats: [
      { at: 0, attacker: GUARD, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: { ...LOCK, body: [0.15, 0.7, -0.1] },
        victim: { ...THROW_CAPTURE, body: [-0.25, -0.7, 0.25], rearShoulder: [0.55, 0.2, -0.1] },
        path: [0.05, 2.6, 0.45],
        actorPath: [2, 0, -0.25],
      },
      {
        at: 0.59,
        attacker: { ...LOCK, body: [0.65, -0.95, 0] },
        victim: { ...THROW_LAND, body: [-1.9, 0.7, -0.15] },
        path: [0.62, 5.9, 0.25],
        actorPath: [2, 0, -0.15],
      },
      { at: 0.8, attacker: PIN, victim: THROW_LAND, path: [1, 0, 0], actorPath: [0, 0, 0] },
      { at: 1, attacker: GUARD, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.65, 1.8, 1.25, 0.8],
      [0.95, 2.8, 1.35, 0.88],
      [-0.65, 4.5, 0.65, 0.85],
    ],
  },
]
