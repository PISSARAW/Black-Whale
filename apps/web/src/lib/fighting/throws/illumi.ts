import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const TOUCH: FightPose = {
  body: [0, -0.08, 0],
  chest: [0, -0.15, 0],
  head: [0.08, 0.1, 0.05],
  leadShoulder: [-1.05, 0, 0.15],
  leadElbow: [-0.55, 0, 0],
  leadWrist: [0.35, 0.3, 0],
  rearShoulder: [-0.9, 0, -0.2],
  rearElbow: [-1, 0, 0],
  leadKnee: [0.15, 0, 0],
  rearKnee: [0.12, 0, 0],
}
const FOLD: FightPose = {
  ...TOUCH,
  body: [0.12, -0.6, 0],
  chest: [0.05, -0.35, 0],
  leadShoulder: [-0.65, -0.35, 0.3],
  leadElbow: [-1.6, 0, 0],
  rearShoulder: [-1.25, 0.2, -0.1],
  rearElbow: [-0.4, 0, 0],
  leadHip: [-0.4, 0, 0.1],
  leadKnee: [0.5, 0, 0],
}
const DISPLAY: FightPose = {
  ...TOUCH,
  body: [-0.08, -0.9, 0.08],
  chest: [0.05, -0.4, 0],
  leadShoulder: [-1.6, 0, 0.45],
  rearShoulder: [-1.4, 0.2, -0.5],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-0.6, 0, 0],
}
export const ILLUMI_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'illumi-joint',
    name: 'L’articulation inutile',
    effect: 'needle',
    detail: { yaw: -0.2, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: TOUCH, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: FOLD,
        victim: {
          ...THROW_CAPTURE,
          body: [0.7, -0.6, 0.3],
          leadShoulder: [0.65, -0.2, 0.2],
          rearElbow: [-1.8, 0, 0],
        },
        path: [0.12, 1.7, 0.1],
      },
      {
        at: 0.65,
        attacker: { ...FOLD, body: [0.2, -1, 0] },
        victim: { ...THROW_LAND, body: [-1.35, -0.4, 0.25] },
        path: [0.9, 1, -0.1],
      },
      { at: 0.8, attacker: TOUCH, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: TOUCH, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.2, 1.8, 1.2, 0.78],
      [0.25, 2.1, 1.05, 0.8],
      [-0.25, 3.7, 0.65, 0.82],
    ],
  },
  {
    id: 'illumi-puppet',
    name: 'Le pantin désaccordé',
    effect: 'needle',
    detail: { yaw: 0.65, anchor: 'head', victim: 'wrist' },
    beats: [
      { at: 0, attacker: TOUCH, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: DISPLAY,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.3, 0.55, -0.15],
          leadShoulder: [-2, 0, 0.3],
          rearShoulder: [0.6, 0, -0.25],
          leadHip: [-0.8, 0, 0.3],
        },
        path: [0, 5.5, -0.25],
      },
      {
        at: 0.57,
        attacker: FOLD,
        victim: {
          ...THROW_LAND,
          body: [-2, 0.7, -0.25],
          leadKnee: [1.25, 0, 0],
          rearKnee: [1.1, 0, 0],
        },
        path: [0.6, 7.2, 0.25],
      },
      { at: 0.8, attacker: TOUCH, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: TOUCH, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.65, 1.9, 1.3, 0.8],
      [-0.65, 2.8, 1.45, 0.86],
      [0.55, 0.9, 0.65, 0.82],
    ],
  },
]
