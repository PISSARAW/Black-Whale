import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const DRAW: FightPose = {
  body: [0.08, -0.25, 0],
  chest: [0.03, -0.3, 0],
  head: [-0.1, 0.2, 0],
  leadShoulder: [-1.25, -0.15, 0.35],
  rearShoulder: [-0.85, 0.2, -0.4],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-1.6, 0, 0],
  leadHip: [-0.35, 0.1, 0.15],
  leadKnee: [0.4, 0, 0],
  rearKnee: [0.3, 0, 0],
}
const RELEASE: FightPose = {
  ...DRAW,
  body: [0.35, -0.9, 0.12],
  chest: [0.1, -0.5, 0],
  leadShoulder: [-0.65, -0.35, 0.4],
  rearShoulder: [-1.55, 0.15, -0.3],
  leadElbow: [-1.4, 0, 0],
  rearElbow: [-0.25, 0, 0],
  leadHip: [-0.7, 0.2, 0.2],
  leadKnee: [0.7, 0, 0],
  rearKnee: [0.5, 0, 0],
}
export const HALKENBURG_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'halkenburg-broken-line',
    name: 'La ligne brisée',
    effect: 'archer',
    detail: { yaw: 0.4, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: DRAW, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: RELEASE,
        victim: { ...THROW_CAPTURE, body: [-0.4, 0.65, 0.25], leadShoulder: [-1.65, 0, 0.3] },
        path: [0.08, 3.8, 0.2],
      },
      {
        at: 0.64,
        attacker: { ...RELEASE, body: [0.5, -1.3, -0.1] },
        victim: { ...THROW_LAND, body: [-1.9, -0.55, 0.15] },
        path: [0.88, 4.4, -0.2],
      },
      { at: 0.8, attacker: DRAW, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: DRAW, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.4, 1.65, 1.15, 0.78],
      [-0.6, 2.65, 1.2, 0.86],
      [0.7, 0.58, 0.65, 0.82],
    ],
  },
  {
    id: 'halkenburg-rampart',
    name: 'Le rempart du prince',
    effect: 'archer',
    grip: 'waist',
    detail: { yaw: -0.7, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: DRAW, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...DRAW,
          body: [-0.25, -0.6, 0.1],
          leadShoulder: [-1.8, 0, 0.35],
          rearShoulder: [-1.65, 0, -0.3],
          rearElbow: [-0.35, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.1, 0.65, -0.15] },
        path: [-0.1, 10.8, 0.3],
      },
      {
        at: 0.55,
        attacker: { ...RELEASE, body: [0.7, -1.55, -0.1] },
        victim: { ...THROW_LAND, body: [-2.3, -0.8, 0.2] },
        path: [0.6, 12.2, -0.3],
      },
      { at: 0.8, attacker: RELEASE, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: DRAW, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.7, 1.6, 1.15, 0.81],
      [0.85, 3.9, 1.8, 0.95],
      [-0.45, 0.65, 0.65, 0.87],
    ],
  },
]
