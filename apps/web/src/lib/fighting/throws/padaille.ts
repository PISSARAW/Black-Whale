import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const PREPARE: FightPose = {
  body: [0.15, -0.1, 0],
  chest: [0.08, -0.15, 0],
  head: [-0.12, 0.12, 0],
  leadShoulder: [-0.4, 0.45, 0.95],
  rearShoulder: [-1.1, 0.1, -0.22],
  leadElbow: [-1.4, 0, 0],
  rearElbow: [-0.75, 0, 0],
  leadHip: [-0.4, 0, 0.18],
  leadKnee: [0.7, 0, 0],
  rearKnee: [0.4, 0, 0],
}
const TURN: FightPose = {
  ...PREPARE,
  body: [0.22, -0.42, 0.08],
  chest: [0.12, -0.3, 0],
  leadShoulder: [-0.65, 0.55, 1.05],
  rearShoulder: [-0.65, -0.18, -0.28],
  leadElbow: [-1.2, 0, 0],
  rearElbow: [-1.5, 0, 0],
  leadKnee: [0.85, 0, 0],
}
export const PADAILLE_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'padaille-lever-arm',
    name: 'Le bras de levier',
    effect: 'artisan',
    grip: 'left',
    rightHand: true,
    detail: { yaw: 0.45, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.3, 0.27, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [0.1, 2.9, 0.16],
        actorPath: [2.1, 0, 0.12],
      },
      {
        at: 0.57,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.16, 0.6, 0.08] },
        path: [0.85, 4.4, -0.15],
        actorPath: [0.9, 0, -0.12],
      },
      {
        at: 0.8,
        attacker: TURN,
        victim: { ...THROW_LAND, body: [-1.48, 0.6, 0.03] },
        path: [1, 0, 0],
      },
      {
        at: 1,
        attacker: PREPARE,
        victim: { ...THROW_LAND, body: [-1.48, 0.6, 0.03] },
        path: [1, 0, 0],
      },
    ],
    camera: [
      [0.45, 1.6, 1.15, 0.8],
      [-0.55, 2.65, 1.3, 0.86],
      [0.7, 0.68, 0.65, 0.86],
    ],
  },
  {
    id: 'padaille-worksite',
    name: 'Le levier de chantier',
    effect: 'artisan',
    grip: 'left',
    rightHand: true,
    detail: { yaw: -0.72, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: PREPARE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: {
          ...PREPARE,
          body: [-0.12, -0.3, 0.08],
          leadShoulder: [-0.7, 0.55, 1.05],
          rearShoulder: [-1.4, -0.1, -0.25],
          rearElbow: [-0.5, 0, 0],
          leadKnee: [0.65, 0, 0],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.6, -0.2475, 0.1],
          leadKnee: [0.8, 0, 0],
          rearKnee: [0.55, 0, 0],
        },
        path: [-0.06, 4.3, 0.16],
        actorPath: [2.1, 0, 0.12],
      },
      {
        at: 0.5,
        attacker: {
          ...TURN,
          body: [0.24, -0.6, 0.08],
          rearShoulder: [-0.5, -0.3, -0.35],
          rearElbow: [-1.55, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.36, -0.55, 0.08] },
        path: [0.7, 7.9, -0.15],
        actorPath: [0.9, 0, -0.12],
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
      [-0.72, 1.5, 1.15, 0.82],
      [0.65, 3.25, 1.6, 0.92],
      [-0.45, 3.7, 0.65, 0.89],
    ],
  },
]
