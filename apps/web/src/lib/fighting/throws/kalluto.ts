import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const FAN: FightPose = {
  body: [0.06, -0.18, 0],
  chest: [0.05, -0.25, 0],
  head: [-0.1, 0.15, 0.08],
  leadShoulder: [-1.2, 0, 0.4],
  leadElbow: [-0.6, 0, 0],
  leadWrist: [0.4, 0.35, 0.2],
  rearShoulder: [-0.9, 0, -0.25],
  rearElbow: [-1, 0, 0],
  leadHip: [-0.25, 0, 0.15],
  leadKnee: [0.4, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const REVEAL: FightPose = {
  ...FAN,
  body: [0.2, -0.9, 0.08],
  chest: [0.05, -0.5, 0],
  leadShoulder: [-0.5, -0.3, 0.75],
  leadElbow: [-1.3, 0, 0],
  rearShoulder: [-1.5, 0.15, -0.2],
  rearElbow: [-0.25, 0, 0],
  leadHip: [-0.75, 0.35, 0.4],
  leadKnee: [0.15, 0, 0],
  rearKnee: [0.85, 0, 0],
}
const BOW: FightPose = {
  ...FAN,
  body: [0.45, -0.65, -0.12],
  chest: [0.15, -0.3, 0],
  head: [-0.2, 0.25, 0],
  leadShoulder: [-1.6, 0, 0.25],
  leadElbow: [-0.4, 0, 0],
  rearShoulder: [-0.65, -0.4, -0.65],
  rearElbow: [-1.6, 0, 0],
  leadHip: [-0.65, 0, 0.2],
  leadKnee: [1, 0, 0],
}
export const KALLUTO_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'kalluto-screen',
    name: 'Le paravent blanc',
    effect: 'paper',
    rightHand: true,
    detail: { yaw: -0.5, anchor: 'prop', victim: 'wrist' },
    beats: [
      { at: 0, attacker: FAN, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: REVEAL,
        victim: { ...THROW_CAPTURE, body: [0.55, -0.6, 0.35], leadShoulder: [-1.65, 0, 0.2] },
        path: [0.05, 3, 0.3],
      },
      {
        at: 0.64,
        attacker: BOW,
        victim: { ...THROW_LAND, body: [-1.85, -0.55, 0.15] },
        path: [0.8, 4.2, -0.25],
      },
      { at: 0.8, attacker: FAN, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: FAN, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.5, 1.6, 1.1, 0.78],
      [0.8, 2.7, 1.25, 0.85],
      [-0.45, 0.65, 0.6, 0.8],
    ],
  },
  {
    id: 'kalluto-bow',
    name: 'La révérence interrompue',
    effect: 'paper',
    rightHand: true,
    detail: { yaw: 0.7, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: FAN, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.27,
        attacker: BOW,
        victim: { ...THROW_CAPTURE, body: [0.75, 0.55, 0.2], leadShoulder: [-1.9, 0, 0.3] },
        path: [-0.12, 4.5, -0.35],
      },
      {
        at: 0.55,
        attacker: { ...REVEAL, body: [0.1, -1.55, 0] },
        victim: { ...THROW_LAND, body: [-2.2, 0.85, -0.2] },
        path: [0.55, 9.5, 0.45],
      },
      { at: 0.8, attacker: BOW, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: FAN, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.7, 1.45, 1.05, 0.8],
      [-0.9, 3.2, 1.65, 0.9],
      [0.65, 3.5, 0.65, 0.85],
    ],
  },
]
