import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.14, -0.18, 0],
  chest: [0.06, -0.2, 0],
  head: [-0.12, 0.14, 0],
  leadShoulder: [-1.05, -0.1, 0.28],
  rearShoulder: [-0.72, 0.2, -0.3],
  leadElbow: [-0.7, 0, 0],
  rearElbow: [-1.4, 0, 0],
  leadHip: [-0.4, 0.05, 0.14],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.24, -0.48, 0.08],
  chest: [0.12, -0.25, 0],
  leadShoulder: [-0.62, -0.3, 0.35],
  rearShoulder: [-1.5, 0.15, -0.18],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.4, 0, 0],
  leadHip: [-0.7, 0.12, 0.22],
  leadKnee: [0.85, 0, 0],
}
export const MUSSE_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'musse-guarded-passage',
    name: 'Le passage sous garde',
    effect: 'spy',
    rightHand: true,
    detail: { yaw: 0.68, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.35, 0.2205, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [0.12, 2.2, 0.14],
        actorPath: [2.8, 0, 0.18],
      },
      {
        at: 0.58,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.18, 0.49, 0.1] },
        path: [0.86, 2.9, -0.1],
        actorPath: [1.1, 0, -0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.49, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.49, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.68, 1.65, 1.15, 0.79],
      [-0.65, 2.5, 1.2, 0.86],
      [0.48, 3.8, 0.65, 0.87],
    ],
  },
  {
    id: 'musse-window-closes',
    name: 'La fenêtre se referme',
    effect: 'spy',
    rightHand: true,
    detail: { yaw: -0.78, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [0.15, -0.3, 0.06],
          chest: [0.08, -0.28, 0],
          leadShoulder: [-1.35, -0.12, 0.3],
          rearShoulder: [-0.95, 0.2, -0.3],
          leadElbow: [-0.65, 0, 0],
          rearElbow: [-1.4, 0, 0],
          leadKnee: [0.8, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.62, -0.1845, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [-0.08, 4.8, 0.23],
        actorPath: [2.8, 0, 0.18],
      },
      {
        at: 0.49,
        attacker: {
          ...TURN,
          body: [0.23, -0.52, 0.08],
          leadShoulder: [-0.55, -0.25, 0.4],
          rearShoulder: [-1.4, 0.15, -0.22],
          leadElbow: [-1.5, 0, 0],
          rearElbow: [-0.3, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.35, -0.41, 0.1] },
        path: [0.68, 7.2, -0.2],
        actorPath: [1.1, 0, -0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.41, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.41, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.78, 1.55, 1.15, 0.81],
      [0.55, 3.2, 1.55, 0.91],
      [-0.62, 0.6, 0.65, 0.88],
    ],
  },
]
