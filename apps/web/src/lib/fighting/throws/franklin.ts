import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const SCOOP: FightPose = {
  body: [0.32, -0.12, 0],
  chest: [0.12, -0.2, 0],
  head: [-0.15, 0.1, 0],
  leadShoulder: [-1.05, 0, 0.32],
  rearShoulder: [-1, 0, -0.32],
  leadElbow: [-1.1, 0, 0],
  rearElbow: [-1.05, 0, 0],
  leadHip: [-0.5, 0, 0.2],
  leadKnee: [0.85, 0, 0],
  rearKnee: [0.7, 0, 0],
}
const TOSS: FightPose = {
  ...SCOOP,
  body: [-0.2, -0.2, 0],
  chest: [-0.12, -0.2, 0],
  head: [-0.3, 0.15, 0],
  leadShoulder: [-1.65, 0, 0.2],
  rearShoulder: [-1.6, 0, -0.2],
  leadElbow: [-0.15, 0, 0],
  rearElbow: [-0.2, 0, 0],
  leadKnee: [0.2, 0, 0],
  rearKnee: [0.18, 0, 0],
}
const CARRY: FightPose = {
  ...SCOOP,
  body: [-0.15, -0.5, 0.15],
  chest: [0.05, -0.4, 0],
  leadShoulder: [-1.2, -0.2, 0.65],
  rearShoulder: [-1.4, 0.2, -0.2],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.4, 0, 0],
}
export const FRANKLIN_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'franklin-cargo',
    name: 'Le lancer de cargaison',
    effect: 'giant',
    grip: 'waist',
    detail: { yaw: -0.45, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: SCOOP, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: TOSS,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.12, 0.2, 0.05],
          leadKnee: [0.6, 0, 0],
          rearKnee: [0.5, 0, 0],
        },
        path: [0.05, 14.5, 0.05],
      },
      {
        at: 0.55,
        attacker: { ...SCOOP, body: [0, 0, 0], head: [-0.4, 0.1, 0] },
        victim: { ...THROW_LAND, body: [-0.85, 0.4, 0.1] },
        path: [0.48, 16, 0.15],
      },
      { at: 0.8, attacker: SCOOP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SCOOP, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.45, 1.35, 1.3, 0.82],
      [0.6, 4.3, 2.2, 0.95],
      [-0.35, 0.72, 0.65, 0.84],
    ],
  },
  {
    id: 'franklin-unload',
    name: 'Le débarquement',
    effect: 'giant',
    grip: 'waist',
    detail: { yaw: 0.7, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: SCOOP, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.31,
        attacker: CARRY,
        victim: { ...THROW_LAND, body: [-1.15, 0.6, -0.2], leadKnee: [1.1, 0, 0] },
        path: [-0.25, 13, -0.2],
      },
      {
        at: 0.57,
        attacker: { ...TOSS, body: [0.3, -1, 0] },
        victim: { ...THROW_LAND, body: [-2.1, -0.65, 0.12] },
        path: [0.75, 19.5, 0.25],
      },
      { at: 0.8, attacker: SCOOP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SCOOP, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.7, 1.2, 1.3, 0.82],
      [-0.85, 4.8, 2.25, 1.02],
      [0.7, 4.2, 0.65, 0.9],
    ],
  },
]
