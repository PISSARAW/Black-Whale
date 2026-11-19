import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.1, -0.12, 0],
  chest: [0.04, -0.22, 0],
  head: [-0.1, 0.28, 0],
  leadShoulder: [-1.1, -0.12, 0.2],
  rearShoulder: [-0.8, 0.2, -0.32],
  leadElbow: [-0.55, 0, 0],
  rearElbow: [-1.3, 0, 0],
  leadHip: [-0.3, 0.08, 0.15],
  leadKnee: [0.5, 0, 0],
  rearKnee: [0.3, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.18, -0.38, 0.07],
  chest: [0.06, -0.32, 0],
  head: [-0.1, 0.4, 0],
  leadShoulder: [-0.6, -0.2, 0.35],
  rearShoulder: [-1.3, 0.16, -0.2],
  leadElbow: [-1.45, 0, 0],
  rearElbow: [-0.5, 0, 0],
  leadKnee: [0.8, 0, 0],
}
export const SAYIRD_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'sayird-out-of-sight',
    name: 'Hors du champ',
    effect: 'scout',
    grip: 'both',
    rightHand: true,
    detail: { yaw: -0.35, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.3, 0.2025, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [0.1, 1.9, 0.16],
        actorPath: [3, 0, 0.24],
      },
      {
        at: 0.57,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.16, 0.45, 0.08] },
        path: [0.85, 2.7, -0.15],
        actorPath: [1.4, 0, -0.18],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.45, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.45, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.35, 1.75, 1.18, 0.79],
      [0.75, 2.4, 1.22, 0.85],
      [-0.6, 3.6, 0.65, 0.86],
    ],
  },
  {
    id: 'sayird-reverse-view',
    name: 'Le changement de perspective',
    effect: 'scout',
    grip: 'both',
    rightHand: true,
    detail: { yaw: 0.7, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [0.15, -0.4, 0.06],
          chest: [0.06, -0.35, 0],
          leadShoulder: [-1.3, -0.1, 0.25],
          rearShoulder: [-1.1, 0.2, -0.3],
          leadElbow: [-0.7, 0, 0],
          rearElbow: [-0.85, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.6, -0.18, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [-0.06, 3.5, 0.16],
        actorPath: [3, 0, 0.24],
      },
      {
        at: 0.5,
        attacker: {
          ...TURN,
          body: [0.22, -0.62, 0.06],
          head: [-0.12, 0.35, 0],
          rearShoulder: [-1.45, 0.12, -0.22],
          leadElbow: [-1.6, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.36, -0.4, 0.08] },
        path: [0.7, 6.1, -0.15],
        actorPath: [1.4, 0, -0.18],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.4, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.4, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.7, 1.7, 1.2, 0.81],
      [-0.7, 3.1, 1.5, 0.91],
      [0.5, 0.6, 0.65, 0.86],
    ],
  },
]
