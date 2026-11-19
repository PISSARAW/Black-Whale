import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const COLLAR: FightPose = {
  body: [0.18, -0.1, 0],
  chest: [0.08, -0.2, 0],
  head: [-0.18, 0.15, 0],
  leadShoulder: [-1.2, -0.1, 0.3],
  rearShoulder: [-0.9, 0.15, -0.3],
  leadElbow: [-0.55, 0, 0],
  rearElbow: [-1.2, 0, 0],
  leadHip: [-0.3, 0, 0.15],
  leadKnee: [0.4, 0, 0],
  rearKnee: [0.3, 0, 0],
}
const QUESTION: FightPose = {
  ...COLLAR,
  body: [0.4, -0.7, 0.1],
  chest: [0.15, -0.45, 0],
  leadShoulder: [-0.7, -0.3, 0.45],
  rearShoulder: [-1.5, 0.2, -0.25],
  leadElbow: [-1.55, 0, 0],
  rearElbow: [-0.3, 0, 0],
  leadHip: [-0.75, 0.15, 0.25],
  leadKnee: [0.8, 0, 0],
  rearKnee: [0.5, 0, 0],
}
export const LYNCH_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'lynch-answer-me',
    name: 'Répondez donc',
    effect: 'interrogator',
    detail: { yaw: 0.3, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: COLLAR, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: QUESTION,
        victim: { ...THROW_CAPTURE, body: [0.65, -0.55, 0.3], rearHip: [-0.9, 0, -0.2] },
        path: [0.1, 2.8, 0.2],
      },
      {
        at: 0.64,
        attacker: { ...QUESTION, body: [0.6, -1.2, -0.1] },
        victim: { ...THROW_LAND, body: [-1.8, 0.45, 0.15] },
        path: [0.9, 3.5, -0.15],
      },
      { at: 0.8, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.3, 1.9, 1.3, 0.78],
      [-0.5, 2.2, 1.1, 0.84],
      [0.75, 3.6, 0.65, 0.86],
    ],
  },
  {
    id: 'lynch-cross-examination',
    name: 'L’interrogatoire musclé',
    effect: 'interrogator',
    detail: { yaw: -0.65, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: COLLAR, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: { ...QUESTION, body: [-0.15, -0.9, 0.15], rearShoulder: [-1.75, 0, -0.35] },
        victim: { ...THROW_CAPTURE, body: [-0.65, 0.7, 0.25], rearKnee: [1.2, 0, 0] },
        path: [-0.1, 6.8, 0.3],
      },
      {
        at: 0.55,
        attacker: { ...QUESTION, body: [0.75, -1.6, -0.1] },
        victim: { ...THROW_LAND, body: [-2.25, -0.8, -0.2] },
        path: [0.6, 9.5, -0.3],
      },
      { at: 0.8, attacker: QUESTION, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.65, 1.7, 1.2, 0.79],
      [0.9, 3.3, 1.6, 0.91],
      [-0.45, 0.55, 0.62, 0.85],
    ],
  },
]
