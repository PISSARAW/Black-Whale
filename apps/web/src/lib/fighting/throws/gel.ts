import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const OFFER: FightPose = {
  body: [0.05, -0.2, 0],
  chest: [0, -0.2, 0],
  head: [-0.08, 0.2, 0],
  leadShoulder: [-0.95, 0, 0.4],
  rearShoulder: [-1.15, 0, -0.2],
  leadElbow: [-1, 0, 0],
  rearElbow: [-0.4, 0, 0],
  leadWrist: [0.3, 0.25, 0],
  rearWrist: [0.25, -0.2, 0],
  leadKnee: [0.3, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const WIND: FightPose = {
  ...OFFER,
  body: [-0.12, -0.75, 0.12],
  chest: [0.1, -0.45, 0],
  leadShoulder: [-0.65, -0.35, 0.35],
  rearShoulder: [-1.5, 0.2, -0.3],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.2, 0, 0],
  leadHip: [-0.5, 0.15, 0.2],
  leadKnee: [0.55, 0, 0],
  rearKnee: [0.45, 0, 0],
}
export const GEL_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'gel-bracelet',
    name: 'Le bracelet vivant',
    effect: 'serpent',
    grip: 'prop',
    rightHand: true,
    detail: { yaw: 1.05, anchor: 'prop', victim: 'wrist' },
    beats: [
      { at: 0, attacker: OFFER, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: WIND,
        victim: { ...THROW_CAPTURE, body: [0.7, -0.6, 0.25], leadShoulder: [0.4, 0, 0.2] },
        path: [0.05, 3.5, 0.2],
      },
      {
        at: 0.63,
        attacker: { ...WIND, body: [0.3, -1.2, -0.1] },
        victim: { ...THROW_LAND, body: [-1.85, 0.55, 0.15] },
        path: [0.88, 4.8, -0.2],
      },
      { at: 0.8, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [1.05, 1.45, 1.05, 0.77],
      [0.7, 2.75, 1.3, 0.87],
      [-0.8, 0.6, 0.65, 0.83],
    ],
  },
  {
    id: 'gel-royal-coil',
    name: 'L’anneau du serpent',
    effect: 'serpent',
    grip: 'prop',
    rightHand: true,
    detail: { yaw: 0.8, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: OFFER, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: { ...WIND, body: [-0.15, -1, 0.15] },
        victim: { ...THROW_CAPTURE, body: [-0.8, 0.75, 0.2], leadHip: [-1.05, 0, 0.2] },
        path: [-0.1, 7.8, 0.45],
      },
      {
        at: 0.54,
        attacker: { ...WIND, body: [0.3, -1.75, -0.12] },
        victim: { ...THROW_LAND, body: [-2.4, -0.85, -0.2] },
        path: [0.45, 11.2, -0.45],
      },
      { at: 0.8, attacker: WIND, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.8, 1.55, 1.15, 0.8],
      [-0.95, 3.45, 1.65, 0.92],
      [0.55, 0.58, 0.62, 0.86],
    ],
  },
]
