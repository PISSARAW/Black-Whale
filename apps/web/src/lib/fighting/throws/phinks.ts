import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const GRAB: FightPose = {
  body: [0.2, -0.15, 0],
  chest: [0.12, -0.3, 0],
  head: [-0.15, 0.2, 0],
  leadShoulder: [-1.2, 0, 0.25],
  rearShoulder: [-1.1, 0, -0.3],
  leadElbow: [-0.8, 0, 0],
  rearElbow: [-1.1, 0, 0],
  leadHip: [-0.35, 0, 0.2],
  leadKnee: [0.55, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const SPIN: FightPose = {
  ...GRAB,
  body: [-0.1, -1.1, 0.15],
  chest: [0.15, -0.75, 0],
  leadShoulder: [-0.8, -0.4, 0.65],
  leadElbow: [-0.25, 0, 0],
  rearShoulder: [-0.95, 0.2, -0.6],
  rearElbow: [-0.45, 0, 0],
  leadHip: [-0.55, 0.3, 0.25],
  leadKnee: [0.8, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const REVERSE: FightPose = {
  ...GRAB,
  body: [0.6, 0.9, -0.15],
  chest: [0.15, 0.5, 0],
  leadShoulder: [-1.65, 0.25, 0.4],
  rearShoulder: [-1.5, -0.2, -0.4],
  leadElbow: [-0.6, 0, 0],
  rearElbow: [-0.65, 0, 0],
  leadHip: [-0.8, 0, 0.2],
  leadKnee: [1, 0, 0],
  rearKnee: [0.6, 0, 0],
}
export const PHINKS_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'phinks-wringer',
    name: 'L’essoreuse',
    effect: 'powerhouse',
    grip: 'waist',
    detail: { yaw: -0.5, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: GRAB, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: SPIN,
        victim: { ...THROW_LAND, body: [-1, 0.85, -0.2] },
        path: [-0.15, 4.8, 0.6],
      },
      {
        at: 0.58,
        attacker: { ...SPIN, body: [-0.1, -2.6, 0.12] },
        victim: { ...THROW_LAND, body: [-1.3, -1.1, 0.1] },
        path: [0.65, 5.5, -0.6],
      },
      { at: 0.8, attacker: GRAB, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: GRAB, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.5, 1.75, 1.2, 0.82],
      [0.95, 2.5, 1.3, 0.85],
      [-0.8, 1, 0.65, 0.82],
    ],
  },
  {
    id: 'phinks-reverse',
    name: 'Le changement de vitesse',
    effect: 'powerhouse',
    grip: 'waist',
    detail: { yaw: 0.7, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: GRAB, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.29,
        attacker: SPIN,
        victim: { ...THROW_CAPTURE, body: [-0.65, 0.7, 0.2] },
        path: [0.95, 5, 0.5],
      },
      {
        at: 0.46,
        attacker: REVERSE,
        victim: { ...THROW_LAND, body: [-1.85, -0.75, -0.3] },
        path: [-0.2, 9.5, -0.5],
      },
      {
        at: 0.64,
        attacker: { ...REVERSE, body: [0.65, 1.3, 0] },
        victim: { ...THROW_LAND, body: [-1.45, 0.35, 0.15] },
        path: [0.82, 4.5, 0.15],
      },
      { at: 0.8, attacker: GRAB, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: GRAB, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.7, 1.7, 1.25, 0.8],
      [-0.95, 3, 1.6, 0.9],
      [0.8, 3.8, 0.65, 0.86],
    ],
  },
]
