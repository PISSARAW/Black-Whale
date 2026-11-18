import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.2, -0.08, 0],
  chest: [0.1, -0.15, 0],
  head: [-0.15, 0.1, 0],
  leadShoulder: [-1.05, 0, 0.38],
  rearShoulder: [-1, 0, -0.35],
  leadElbow: [-1.15, 0, 0],
  rearElbow: [-1.1, 0, 0],
  leadHip: [-0.5, 0.05, 0.23],
  rearHip: [0.12, 0, -0.15],
  leadKnee: [0.9, 0, 0],
  rearKnee: [0.75, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [-0.18, -0.3, 0.08],
  chest: [-0.08, -0.2, 0],
  leadShoulder: [-1.65, 0, 0.28],
  rearShoulder: [-1.6, 0, -0.27],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-0.28, 0, 0],
  leadKnee: [0.3, 0, 0],
  rearKnee: [0.25, 0, 0],
}
export const BEYOND_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'beyond-mountain-pass',
    name: 'Le col du géant',
    effect: 'explorer',
    grip: 'waist',
    rightHand: true,
    detail: { yaw: -0.42, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.35, 0.189, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [0.12, 4.1, 0.14],
      },
      {
        at: 0.58,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.18, 0.42, 0.1] },
        path: [0.86, 4.8, -0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.42, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.42, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.42, 1.15, 1.25, 0.82],
      [0.5, 3.15, 1.55, 0.89],
      [-0.55, 0.55, 0.65, 0.86],
    ],
  },
  {
    id: 'beyond-unconquered-summit',
    name: 'Le sommet infranchissable',
    effect: 'explorer',
    grip: 'waist',
    rightHand: true,
    detail: { yaw: 0.58, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [-0.15, -0.24, 0.06],
          chest: [-0.08, -0.22, 0],
          leadShoulder: [-1.55, 0, 0.35],
          rearShoulder: [-1.5, 0, -0.33],
          leadElbow: [-0.5, 0, 0],
          rearElbow: [-0.45, 0, 0],
          leadKnee: [0.65, 0, 0],
          rearKnee: [0.5, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.62, -0.216, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [-0.08, 6.8, 0.23],
      },
      {
        at: 0.49,
        attacker: {
          ...TURN,
          body: [0.22, -0.5, 0.08],
          leadShoulder: [-1.8, 0, 0.3],
          rearShoulder: [-1.75, 0, -0.28],
          leadElbow: [-0.2, 0, 0],
          rearElbow: [-0.18, 0, 0],
          leadKnee: [0.2, 0, 0],
          rearKnee: [0.18, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.35, -0.48, 0.1] },
        path: [0.68, 9.8, -0.2],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.48, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.48, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.58, 1.2, 1.3, 0.84],
      [-0.68, 4, 1.9, 0.96],
      [0.4, 4.2, 0.65, 0.92],
    ],
  },
]
