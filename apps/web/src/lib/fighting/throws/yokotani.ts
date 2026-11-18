import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.1, -0.12, 0],
  chest: [0.02, -0.15, 0],
  head: [-0.07, 0.15, 0],
  leadShoulder: [-1, -0.1, 0.3],
  rearShoulder: [-0.85, 0.1, -0.3],
  leadElbow: [-0.7, 0, 0],
  rearElbow: [-1.1, 0, 0],
  leadHip: [-0.3, 0, 0.12],
  leadKnee: [0.55, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.2, -0.32, 0.06],
  chest: [0.08, -0.25, 0],
  leadShoulder: [-0.6, -0.2, 0.4],
  rearShoulder: [-1.35, 0.12, -0.25],
  leadElbow: [-1.4, 0, 0],
  rearElbow: [-0.5, 0, 0],
  leadKnee: [0.8, 0, 0],
}
export const YOKOTANI_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'yokotani-objection',
    name: 'Fin de non-recevoir',
    effect: 'bailiff',
    grip: 'both',
    rightHand: true,
    detail: { yaw: -0.25, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.3, 0.1125, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [0.1, 1.1, 0.16],
        actorPath: [1.8, 0, 0.15],
      },
      {
        at: 0.57,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.16, 0.25, 0.08] },
        path: [0.85, 2.1, -0.15],
        actorPath: [0.8, 0, -0.12],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.25, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.25, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [-0.25, 1.7, 1.15, 0.78],
      [0.65, 2.35, 1.15, 0.84],
      [-0.55, 3.8, 0.65, 0.85],
    ],
  },
  {
    id: 'yokotani-dismissed',
    name: 'Veuillez quitter les lieux',
    effect: 'bailiff',
    grip: 'both',
    rightHand: true,
    detail: { yaw: 0.6, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [0.14, -0.28, 0.06],
          chest: [0.06, -0.3, 0],
          leadShoulder: [-1.3, -0.1, 0.3],
          rearShoulder: [-1.25, 0.12, -0.28],
          leadElbow: [-0.65, 0, 0],
          rearElbow: [-0.7, 0, 0],
          leadKnee: [0.75, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.6, -0.225, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [-0.06, 2.9, 0.16],
        actorPath: [1.8, 0, 0.15],
      },
      {
        at: 0.5,
        attacker: {
          ...TURN,
          body: [0.24, -0.5, 0.07],
          leadShoulder: [-0.55, -0.25, 0.45],
          rearElbow: [-0.35, 0, 0],
          leadHip: [-0.65, 0, 0.18],
        },
        victim: { ...THROW_LAND, body: [-1.36, -0.5, 0.08] },
        path: [0.7, 5.4, -0.15],
        actorPath: [0.8, 0, -0.12],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, -0.5, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, -0.5, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.6, 1.6, 1.15, 0.8],
      [-0.65, 2.85, 1.4, 0.89],
      [0.55, 0.6, 0.65, 0.86],
    ],
  },
]
