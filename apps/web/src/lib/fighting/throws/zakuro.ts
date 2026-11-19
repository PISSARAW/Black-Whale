import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const CALL: FightPose = {
  body: [0.1, -0.15, 0],
  chest: [0, -0.2, 0],
  head: [-0.05, 0.15, 0],
  leadShoulder: [-1.1, 0, 0.3],
  rearShoulder: [-1, 0, -0.3],
  leadElbow: [-0.5, 0, 0],
  rearElbow: [-0.8, 0, 0],
  leadWrist: [0.3, 0.2, 0],
  rearWrist: [0.25, -0.2, 0],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const REEL: FightPose = {
  ...CALL,
  body: [-0.1, -0.65, 0.1],
  chest: [0.1, -0.4, 0],
  leadShoulder: [-0.55, -0.35, 0.4],
  rearShoulder: [-1.35, 0.3, -0.4],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.55, 0.2, 0.2],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.4, 0, 0],
}
export const ZAKURO_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'zakuro-red-step',
    name: 'Le faux pas écarlate',
    effect: 'blood',
    detail: { yaw: 0.55, anchor: 'hand', victim: 'knee' },
    beats: [
      { at: 0, attacker: CALL, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: REEL,
        victim: { ...THROW_CAPTURE, body: [0.65, -0.6, 0.3], rearHip: [-1.1, 0, -0.25] },
        path: [0.05, 3.2, 0.25],
      },
      {
        at: 0.63,
        attacker: { ...REEL, body: [0.3, -1.15, -0.1] },
        victim: { ...THROW_LAND, body: [-1.85, 0.5, -0.15] },
        path: [0.85, 4.6, -0.2],
      },
      { at: 0.8, attacker: CALL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: CALL, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.55, 0.9, 0.7, 0.78],
      [-0.65, 2.2, 1.15, 0.84],
      [0.75, 0.5, 0.62, 0.8],
    ],
  },
  {
    id: 'zakuro-red-spiral',
    name: 'La spirale écarlate',
    effect: 'blood',
    detail: { yaw: -0.8, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: CALL, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.27,
        attacker: { ...REEL, body: [-0.15, -0.9, 0.1] },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.85, 0.7, 0.25],
          leadShoulder: [-1.9, 0, 0.2],
          rearKnee: [1.2, 0, 0],
        },
        path: [-0.15, 7.5, 0.5],
      },
      {
        at: 0.54,
        attacker: { ...REEL, body: [0.35, -1.8, -0.1], leadShoulder: [-1.45, 0, 0.5] },
        victim: { ...THROW_LAND, body: [-2.4, -1.1, -0.2] },
        path: [0.4, 11.8, -0.5],
      },
      { at: 0.8, attacker: REEL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: CALL, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.8, 1.6, 1.15, 0.8],
      [1, 3.65, 1.7, 0.93],
      [-0.55, 0.55, 0.62, 0.85],
    ],
  },
]
