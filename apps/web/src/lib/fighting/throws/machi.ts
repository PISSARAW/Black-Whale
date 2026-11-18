import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const THREAD: FightPose = {
  body: [0.08, -0.2, 0],
  chest: [0.05, -0.25, 0],
  head: [-0.1, 0.2, 0],
  leadShoulder: [-1.1, 0, 0.35],
  rearShoulder: [-1.05, 0, -0.35],
  leadElbow: [-0.45, 0, 0],
  rearElbow: [-0.55, 0, 0],
  leadWrist: [0.4, 0.25, 0.2],
  rearWrist: [0.4, -0.25, -0.2],
  leadKnee: [0.3, 0, 0],
  rearKnee: [0.25, 0, 0],
}
const CROSS: FightPose = {
  ...THREAD,
  body: [-0.12, -0.55, 0.1],
  chest: [0.1, -0.4, 0],
  leadShoulder: [-0.75, -0.6, -0.25],
  rearShoulder: [-1.15, 0.55, 0.2],
  leadElbow: [-1.45, 0, 0],
  rearElbow: [-1.25, 0, 0],
  leadHip: [-0.45, 0, 0.15],
  leadKnee: [0.6, 0, 0],
}
const WIND: FightPose = {
  ...THREAD,
  body: [0.25, -1.05, 0],
  chest: [0.1, -0.6, 0],
  leadShoulder: [-1.45, -0.2, 0.65],
  rearShoulder: [-0.6, 0.2, -0.65],
  leadElbow: [-0.25, 0, 0],
  rearElbow: [-1.6, 0, 0],
  leadHip: [-0.65, 0.3, 0.3],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.75, 0, 0],
}
export const MACHI_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'machi-cross-stitch',
    name: 'Le point de croix',
    effect: 'thread',
    grip: 'prop',
    detail: { yaw: 0.5, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: THREAD, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: CROSS,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.55, 0.4, 0.35],
          leadShoulder: [-1.8, 0, 0.2],
          rearHip: [-1.15, 0, -0.3],
        },
        path: [0.15, 4.6, 0.2],
      },
      {
        at: 0.63,
        attacker: WIND,
        victim: { ...THROW_LAND, body: [-1.9, 0.65, -0.2] },
        path: [0.78, 5.2, -0.25],
      },
      { at: 0.8, attacker: CROSS, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: THREAD, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.5, 1.65, 1.15, 0.78],
      [-0.8, 2.9, 1.4, 0.86],
      [0.5, 0.8, 0.65, 0.82],
    ],
  },
  {
    id: 'machi-spool',
    name: 'La bobine',
    effect: 'thread',
    grip: 'prop',
    detail: { yaw: -0.7, anchor: 'hand', victim: 'knee' },
    beats: [
      { at: 0, attacker: THREAD, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: WIND,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.9, 0.7, 0.3],
          leadHip: [-1.1, 0, 0.2],
          rearKnee: [1.2, 0, 0],
        },
        path: [-0.1, 7.8, 0.6],
      },
      {
        at: 0.53,
        attacker: { ...CROSS, body: [-0.15, -1.7, 0.1] },
        victim: { ...THROW_LAND, body: [-2.35, -1, -0.2] },
        path: [0.4, 11.5, -0.55],
      },
      { at: 0.8, attacker: CROSS, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: THREAD, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.7, 1.05, 0.85, 0.8],
      [0.95, 3.6, 1.8, 0.92],
      [-0.65, 0.65, 0.65, 0.85],
    ],
  },
]
