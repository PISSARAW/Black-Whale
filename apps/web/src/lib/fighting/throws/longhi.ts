import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.1, 0.12, 0],
  chest: [0.02, -0.2, 0],
  head: [-0.06, 0.18, 0.04],
  leadShoulder: [-1.15, 0, 0.18],
  rearShoulder: [-0.75, 0.1, -0.25],
  leadElbow: [-0.4, 0, 0],
  rearElbow: [-1.3, 0, 0],
  leadWrist: [0.2, 0.4, 0],
  rearWrist: [0.12, -0.25, 0],
  leadHip: [-0.25, 0.05, 0.12],
  leadKnee: [0.45, 0, 0],
  rearKnee: [0.28, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.18, -0.45, 0.06],
  chest: [0.06, -0.3, 0],
  leadShoulder: [-0.7, -0.28, 0.32],
  rearShoulder: [-1.35, 0.12, -0.22],
  leadElbow: [-1.45, 0, 0],
  rearElbow: [-0.5, 0, 0],
  leadHip: [-0.52, 0.12, 0.2],
  leadKnee: [0.75, 0, 0],
}
export const LONGHI_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'longhi-exit-clause',
    name: 'La clause de sortie',
    effect: 'agreement',
    rightHand: true,
    detail: { yaw: 0.3, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.35, 0.2047, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [0.12, 1.7, 0.14],
        actorPath: [2.4, 0, -0.16],
      },
      {
        at: 0.58,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.18, 0.455, 0.1] },
        path: [0.86, 2.6, -0.1],
        actorPath: [1.2, 0, 0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.455, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.455, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.3, 1.65, 1.12, 0.78],
      [-0.6, 2.2, 1.1, 0.84],
      [0.52, 3.6, 0.65, 0.86],
    ],
  },
  {
    id: 'longhi-non-negotiable',
    name: 'Le point non négociable',
    effect: 'agreement',
    rightHand: true,
    detail: { yaw: -0.5, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [0.12, -0.35, 0.04],
          chest: [0.04, -0.4, 0],
          head: [-0.08, 0.3, 0.04],
          leadShoulder: [-0.8, -0.2, 0.25],
          rearShoulder: [-1.2, 0.15, -0.2],
          leadElbow: [-1.65, 0, 0],
          rearElbow: [-0.6, 0, 0],
          leadWrist: [0.2, 0.35, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.62, -0.2003, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [-0.08, 3.9, 0.23],
        actorPath: [2.4, 0, -0.16],
      },
      {
        at: 0.49,
        attacker: {
          ...TURN,
          body: [0.2, -0.48, 0.06],
          leadShoulder: [-0.65, -0.2, 0.4],
          rearElbow: [-0.35, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.35, -0.445, 0.1] },
        path: [0.68, 6.6, -0.2],
        actorPath: [1.2, 0, 0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.445, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.445, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.5, 1.7, 1.2, 0.81],
      [0.68, 2.95, 1.45, 0.9],
      [-0.58, 0.68, 0.65, 0.86],
    ],
  },
]
