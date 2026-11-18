import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.08, 0.12, 0],
  chest: [0.02, -0.18, 0],
  head: [-0.06, 0.2, 0.04],
  leadShoulder: [-1.1, -0.05, 0.22],
  rearShoulder: [-0.72, 0.2, -0.3],
  leadElbow: [-0.45, 0, 0],
  rearElbow: [-1.2, 0, 0],
  leadHip: [-0.25, 0.1, 0.14],
  leadKnee: [0.45, 0, 0],
  rearKnee: [0.25, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.17, -0.35, 0.08],
  chest: [0.08, -0.28, 0],
  leadShoulder: [-0.6, -0.25, 0.4],
  rearShoulder: [-1.25, 0.2, -0.22],
  leadElbow: [-1.45, 0, 0],
  rearElbow: [-0.55, 0, 0],
  leadKnee: [0.7, 0, 0],
}
export const VOCONTE_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'voconte-after-you',
    name: 'Après vous',
    effect: 'gatekeeper',
    grip: 'both',
    rightHand: true,
    detail: { yaw: 0.55, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.3, 0.2475, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [0.1, 1.8, 0.16],
        actorPath: [2.5, 0, -0.25],
      },
      {
        at: 0.57,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.16, 0.55, 0.08] },
        path: [0.85, 2.8, -0.15],
        actorPath: [1, 0, 0.12],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.55, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.55, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.55, 1.7, 1.15, 0.8],
      [-0.75, 2.5, 1.2, 0.86],
      [0.4, 3.7, 0.65, 0.87],
    ],
  },
  {
    id: 'voconte-wrong-entrance',
    name: 'La mauvaise entrée',
    effect: 'gatekeeper',
    grip: 'both',
    rightHand: true,
    detail: { yaw: -0.8, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [0.12, -0.3, 0.08],
          chest: [0.04, -0.35, 0],
          leadShoulder: [-1.25, -0.2, 0.3],
          rearShoulder: [-1.1, 0.2, -0.32],
          leadElbow: [-0.65, 0, 0],
          rearElbow: [-1.1, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.6, -0.135, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [-0.06, 3.8, 0.16],
        actorPath: [2.5, 0, -0.25],
      },
      {
        at: 0.5,
        attacker: {
          ...TURN,
          body: [0.23, -0.58, 0.08],
          rearShoulder: [-1.4, 0.12, -0.2],
          rearElbow: [-0.35, 0, 0],
          leadHip: [-0.65, 0.15, 0.2],
        },
        victim: { ...THROW_LAND, body: [-1.36, -0.3, 0.08] },
        path: [0.7, 6.8, -0.15],
        actorPath: [1, 0, 0.12],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.3, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.3, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.8, 1.65, 1.18, 0.81],
      [0.6, 3.2, 1.55, 0.91],
      [-0.55, 0.62, 0.65, 0.88],
    ],
  },
]
