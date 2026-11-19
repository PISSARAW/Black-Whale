import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.08, -0.16, 0],
  chest: [0.03, -0.12, 0],
  head: [-0.08, 0.22, 0],
  leadShoulder: [-0.8, -0.2, 0.68],
  rearShoulder: [-0.95, 0.2, -0.6],
  leadElbow: [-1.35, 0, 0],
  rearElbow: [-1.2, 0, 0],
  leadHip: [-0.32, 0, 0.16],
  leadKnee: [0.6, 0, 0],
  rearKnee: [0.4, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.2, -0.42, 0.1],
  chest: [0.1, -0.28, 0.08],
  leadShoulder: [-1.25, -0.2, 0.58],
  rearShoulder: [-0.55, 0.25, -0.65],
  leadElbow: [-0.65, 0, 0],
  rearElbow: [-1.55, 0, 0],
  leadHip: [-0.65, 0.15, 0.22],
  leadKnee: [0.9, 0, 0],
}
export const CLUCK_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'cluck-underwing',
    name: 'Sous l’aile',
    effect: 'aviary',
    rightHand: true,
    detail: { yaw: -0.8, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.35, 0.1733, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [0.12, 2.7, 0.14],
      },
      {
        at: 0.58,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.18, 0.385, 0.1] },
        path: [0.86, 3.2, -0.1],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.385, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.385, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.8, 1.7, 1.18, 0.8],
      [0.63, 2.65, 1.35, 0.87],
      [-0.65, 0.64, 0.65, 0.84],
    ],
  },
  {
    id: 'cluck-denied-flight',
    name: 'L’envol contrarié',
    effect: 'aviary',
    grip: 'waist',
    rightHand: true,
    detail: { yaw: 0.85, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [-0.18, -0.35, 0.12],
          chest: [0.1, -0.2, 0.1],
          leadShoulder: [-1.25, -0.2, 0.65],
          rearShoulder: [-1.2, 0.2, -0.65],
          leadElbow: [-0.75, 0, 0],
          rearElbow: [-0.8, 0, 0],
          leadKnee: [1.05, 0, 0],
          rearKnee: [0.9, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.62, -0.2318, 0.12],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.6, 0, 0],
        },
        path: [-0.08, 4.2, 0.23],
        actorPath: [1.6, 1.8, 0.15],
      },
      {
        at: 0.49,
        attacker: {
          ...TURN,
          body: [0.15, -0.58, 0.12],
          leadShoulder: [-0.5, -0.2, 0.85],
          rearShoulder: [-0.6, 0.2, -0.8],
          leadKnee: [0.95, 0, 0],
          rearKnee: [0.7, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.35, -0.515, 0.1] },
        path: [0.68, 7.4, -0.2],
        actorPath: [2.5, 2.4, -0.15],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.515, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.515, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.85, 1.6, 1.15, 0.82],
      [-0.72, 3.55, 1.7, 0.94],
      [0.6, 3.5, 0.65, 0.88],
    ],
  },
]
