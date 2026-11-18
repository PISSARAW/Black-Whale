import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const SMILE: FightPose = {
  body: [0, -0.12, 0],
  chest: [0, -0.15, 0],
  head: [-0.1, 0.15, 0.14],
  leadShoulder: [-1.25, 0, 0.2],
  leadElbow: [-0.45, 0, 0],
  leadWrist: [0.3, 0.3, 0.1],
  rearShoulder: [-0.6, 0, -0.35],
  rearElbow: [-1.15, 0, 0],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const LESSON: FightPose = {
  ...SMILE,
  body: [0.2, -0.85, 0.05],
  chest: [0.08, -0.35, 0],
  leadShoulder: [-1.5, -0.15, 0.4],
  leadElbow: [-1.2, 0, 0],
  rearShoulder: [-0.9, 0.2, -0.2],
  rearElbow: [-0.5, 0, 0],
  leadHip: [-0.55, 0, 0.1],
  leadKnee: [0.8, 0, 0],
  rearKnee: [0.5, 0, 0],
}
const LIFT: FightPose = {
  body: [-0.22, -0.25, 0],
  chest: [-0.1, -0.3, 0],
  head: [0.1, 0.2, 0.12],
  leadShoulder: [-1.45, 0, 0.55],
  rearShoulder: [-1.4, 0, -0.5],
  leadElbow: [-0.55, 0, 0],
  rearElbow: [-0.65, 0, 0],
  leadHip: [-0.5, 0, 0.25],
  leadKnee: [0.7, 0, 0],
  rearKnee: [0.55, 0, 0],
}
export const BISCUIT_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'biscuit-lesson',
    name: 'La leçon de politesse',
    effect: 'shingen',
    detail: { yaw: -0.3, anchor: 'head', victim: 'wrist' },
    beats: [
      { at: 0, attacker: SMILE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: LESSON,
        victim: { ...THROW_CAPTURE, body: [0.65, 0.4, 0.25], leadShoulder: [-1.7, 0, 0.25] },
        path: [-0.1, 3.2, 0.15],
      },
      {
        at: 0.63,
        attacker: { ...LESSON, body: [0.35, -1.1, 0] },
        victim: { ...THROW_LAND, body: [-1.8, 0.45, -0.1] },
        path: [0.75, 5.5, -0.18],
      },
      { at: 0.8, attacker: SMILE, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SMILE, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.3, 1.15, 0.85, 0.8],
      [0.7, 2.4, 1.1, 0.86],
      [-0.3, 0.6, 0.6, 0.8],
    ],
  },
  {
    id: 'biscuit-correction',
    name: 'La correction magistrale',
    effect: 'shingen',
    grip: 'waist',
    detail: { yaw: 0.65, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: { ...LIFT, body: [0.3, 0, 0] }, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: LIFT,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.45, -0.3, 0.1],
          leadKnee: [1, 0, 0],
          rearKnee: [0.85, 0, 0],
        },
        path: [-0.12, 9.5, -0.15],
      },
      {
        at: 0.58,
        attacker: { ...LESSON, body: [0.2, -1.2, 0.08] },
        victim: { ...THROW_LAND, body: [-2.2, -0.6, 0.2] },
        path: [0.68, 11.5, 0.35],
      },
      { at: 0.8, attacker: LESSON, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SMILE, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.65, 0.9, 1, 0.8],
      [-0.8, 3.4, 1.8, 0.95],
      [0.65, 0.65, 0.65, 0.85],
    ],
  },
]
