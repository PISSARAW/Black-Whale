import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const GUARD: FightPose = {
  body: [0.15, -0.1, 0],
  chest: [0.08, -0.15, 0],
  head: [-0.1, 0.15, 0],
  leadShoulder: [-1.1, -0.1, 0.4],
  rearShoulder: [-1.05, 0.1, -0.3],
  leadElbow: [-0.75, 0, 0],
  rearElbow: [-1.1, 0, 0],
  leadHip: [-0.45, 0.1, 0.2],
  leadKnee: [0.6, 0, 0],
  rearKnee: [0.45, 0, 0],
}
const BRACE: FightPose = {
  ...GUARD,
  body: [0.4, -0.7, 0.1],
  chest: [0.1, -0.4, 0],
  leadShoulder: [-0.7, -0.3, 0.4],
  rearShoulder: [-1.45, 0.2, -0.25],
  leadElbow: [-1.4, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.75, 0.2, 0.25],
  leadKnee: [0.85, 0, 0],
  rearKnee: [0.65, 0, 0],
}
export const BILL_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'bill-stake',
    name: 'Le tuteur',
    effect: 'growth',
    detail: { yaw: 0.2, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: GUARD, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: BRACE,
        victim: { ...THROW_CAPTURE, body: [0.6, -0.45, 0.25], rearShoulder: [0.4, 0, -0.2] },
        path: [0.08, 2.1, 0.15],
        actorPath: [2, 0, 0.2],
      },
      {
        at: 0.64,
        attacker: { ...BRACE, body: [0.55, -1.15, -0.1] },
        victim: { ...THROW_LAND, body: [-1.7, 0.5, 0.15] },
        path: [0.9, 3.1, -0.15],
      },
      { at: 0.8, attacker: GUARD, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: GUARD, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.2, 1.6, 1.1, 0.77],
      [-0.55, 2.35, 1.05, 0.83],
      [0.65, 3.5, 0.65, 0.85],
    ],
  },
  {
    id: 'bill-living-shield',
    name: 'Le bouclier vivant',
    effect: 'growth',
    grip: 'waist',
    detail: { yaw: -0.6, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: GUARD, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.29,
        attacker: {
          ...GUARD,
          body: [-0.2, -0.5, 0.12],
          leadShoulder: [-1.6, 0, 0.4],
          rearShoulder: [-1.65, 0, -0.35],
          leadElbow: [-0.4, 0, 0],
          rearElbow: [-0.3, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.05, 0.6, -0.2] },
        path: [-0.1, 9.2, 0.25],
      },
      {
        at: 0.56,
        attacker: { ...BRACE, body: [0.75, -1.45, -0.1] },
        victim: { ...THROW_LAND, body: [-2.2, -0.75, 0.15] },
        path: [0.65, 10.6, -0.25],
      },
      { at: 0.8, attacker: BRACE, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: GUARD, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.6, 1.25, 0.95, 0.8],
      [0.75, 3.65, 1.7, 0.93],
      [-0.4, 4.1, 0.65, 0.89],
    ],
  },
]
