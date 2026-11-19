import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.12, -0.1, 0],
  chest: [0.04, -0.18, 0],
  head: [-0.12, 0.2, 0],
  leadShoulder: [-1.15, -0.1, 0.2],
  rearShoulder: [-0.8, 0.15, -0.28],
  leadElbow: [-0.5, 0, 0],
  rearElbow: [-1.25, 0, 0],
  leadWrist: [0.15, 0.3, 0],
  leadHip: [-0.28, 0, 0.12],
  leadKnee: [0.5, 0, 0],
  rearKnee: [0.24, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.22, -0.36, 0.06],
  chest: [0.08, -0.3, 0],
  leadShoulder: [-0.65, -0.25, 0.32],
  rearShoulder: [-1.5, 0.12, -0.2],
  leadElbow: [-1.4, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadKnee: [0.78, 0, 0],
}
export const FURYKOV_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'furykov-blind-angle',
    name: 'L’angle mort',
    effect: 'analyst',
    rightHand: true,
    detail: { yaw: 0.48, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.35, 0.1575, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [0.12, 2.1, 0.14],
      },
      {
        at: 0.58,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.18, 0.35, 0.1] },
        path: [0.86, 2.8, -0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.35, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.35, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.48, 1.55, 1.12, 0.79],
      [-0.42, 2.45, 1.2, 0.85],
      [0.72, 3.7, 0.65, 0.85],
    ],
  },
  {
    id: 'furykov-perfect-sequence',
    name: 'La séquence parfaite',
    effect: 'analyst',
    rightHand: true,
    detail: { yaw: -0.62, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [0.08, -0.38, 0.04],
          chest: [0.08, -0.32, 0],
          leadShoulder: [-0.85, -0.18, 0.3],
          rearShoulder: [-1.35, 0.18, -0.22],
          leadElbow: [-1.55, 0, 0],
          rearElbow: [-0.6, 0, 0],
          leadWrist: [0.15, 0.45, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.62, -0.2475, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [-0.08, 3.6, 0.23],
      },
      {
        at: 0.4,
        attacker: { ...TURN, body: [0.18, -0.48, 0.05], leadWrist: [0.15, 0.5, 0] },
        victim: { ...THROW_CAPTURE, body: [-0.95, -0.35, 0.1] },
        path: [0.25, 4.7, 0.04],
      },
      {
        at: 0.49,
        attacker: {
          ...TURN,
          body: [0.2, -0.58, 0.05],
          leadShoulder: [-0.55, -0.25, 0.42],
          rearElbow: [-0.3, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.35, -0.55, 0.1] },
        path: [0.68, 5.2, -0.2],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.55, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.55, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.62, 1.6, 1.2, 0.8],
      [0.78, 3.1, 1.5, 0.9],
      [-0.48, 0.7, 0.65, 0.87],
    ],
  },
]
