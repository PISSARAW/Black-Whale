import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const OFFER: FightPose = {
  body: [0.02, -0.1, 0],
  chest: [0, -0.12, 0],
  head: [-0.12, 0.15, 0],
  leadShoulder: [-0.9, -0.1, 0.35],
  rearShoulder: [-1.05, 0.1, -0.25],
  leadElbow: [-1.1, 0, 0],
  rearElbow: [-0.65, 0, 0],
  leadWrist: [0.35, 0, 0],
  leadKnee: [0.18, 0, 0],
  rearKnee: [0.12, 0, 0],
}
const DISMISS: FightPose = {
  ...OFFER,
  body: [0.15, -0.65, 0.08],
  chest: [0.05, -0.35, 0],
  leadShoulder: [-0.65, -0.3, 0.3],
  rearShoulder: [-1.4, 0.15, -0.25],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.3, 0, 0],
  leadHip: [-0.6, 0.1, 0.2],
  leadKnee: [0.5, 0, 0],
}
export const CAMILLA_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'camilla-kiss-hand',
    name: 'Le baisemain forcé',
    effect: 'royal',
    detail: { yaw: -0.15, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: OFFER, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: DISMISS,
        victim: { ...THROW_CAPTURE, body: [0.85, -0.5, 0.2], leadShoulder: [-1.8, 0, 0.25] },
        path: [0.05, 1.3, 0.1],
      },
      {
        at: 0.64,
        attacker: { ...DISMISS, body: [0.2, -1.1, -0.1] },
        victim: { ...THROW_LAND, body: [-1.6, 0.4, -0.15] },
        path: [0.9, 3.4, -0.15],
      },
      { at: 0.8, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.15, 1.65, 1.2, 0.75],
      [0.5, 2.45, 1.05, 0.83],
      [-0.65, 3.7, 0.65, 0.86],
    ],
  },
  {
    id: 'camilla-dismissal',
    name: 'L’audience est levée',
    effect: 'royal',
    rightHand: true,
    detail: { yaw: 0.75, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: OFFER, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: { ...DISMISS, body: [-0.05, -0.8, 0.1] },
        victim: {
          ...THROW_CAPTURE,
          body: [0.75, 0.65, 0.2],
          leadKnee: [1.4, 0, 0],
          rearKnee: [1.25, 0, 0],
        },
        path: [-0.1, 5.4, 0.25],
      },
      {
        at: 0.55,
        attacker: { ...DISMISS, body: [0.35, -1.45, -0.1], rearShoulder: [-1.6, 0, -0.3] },
        victim: { ...THROW_LAND, body: [-2.05, -0.65, -0.15] },
        path: [0.6, 8.2, -0.25],
      },
      { at: 0.8, attacker: DISMISS, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.75, 1.45, 1.05, 0.79],
      [-0.7, 3.15, 1.5, 0.9],
      [0.4, 4.2, 0.62, 0.88],
    ],
  },
]
