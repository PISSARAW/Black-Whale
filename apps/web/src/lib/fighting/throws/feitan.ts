import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const HOOK: FightPose = {
  body: [0.32, -0.25, 0],
  chest: [0.15, -0.2, 0],
  head: [-0.25, 0.2, 0],
  leadShoulder: [-0.95, 0, 0.16],
  leadElbow: [-0.85, 0, 0],
  rearShoulder: [-1.15, 0.15, -0.35],
  rearElbow: [-0.8, 0, 0],
  leadHip: [-0.65, 0, 0.1],
  leadKnee: [1.15, 0, 0],
  rearKnee: [0.7, 0, 0],
}
const WIND: FightPose = {
  ...HOOK,
  body: [0.65, -0.95, 0.18],
  chest: [-0.2, -0.5, 0],
  leadShoulder: [-0.45, -0.3, 0.5],
  leadElbow: [-1.6, 0, 0],
  rearHip: [-0.85, 0.2, -0.4],
  rearKnee: [0.2, 0, 0],
}
const SCISSORS: FightPose = {
  body: [-0.5, -0.4, 0.65],
  chest: [0.1, -0.2, 0],
  head: [0.2, 0.3, -0.2],
  leadShoulder: [-0.5, 0, 0.7],
  rearShoulder: [-0.6, 0, -0.6],
  leadElbow: [-1, 0, 0],
  rearElbow: [-0.65, 0, 0],
  leadHip: [-1.5, 0.2, 0.48],
  rearHip: [-1.05, -0.3, -0.45],
  leadKnee: [0.9, 0, 0],
  rearKnee: [1.2, 0, 0],
}
export const FEITAN_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'feitan-umbrella',
    name: 'Le parapluie se referme',
    effect: 'umbrella',
    rightHand: true,
    grip: 'prop',
    detail: { yaw: 0.65, anchor: 'prop', victim: 'knee' },
    beats: [
      { at: 0, attacker: HOOK, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.32,
        attacker: WIND,
        victim: { ...THROW_CAPTURE, body: [0.45, -0.5, 0.35], leadHip: [-0.8, 0, 0.1] },
        path: [0.12, 2.4, 0.2],
      },
      {
        at: 0.61,
        attacker: { ...WIND, body: [0.75, -1.25, -0.1] },
        victim: { ...THROW_LAND, body: [-1.65, -0.6, 0.2] },
        path: [0.8, 3.4, -0.2],
      },
      { at: 0.8, attacker: HOOK, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: HOOK, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.65, 1.05, 0.7, 0.8],
      [-0.65, 1.1, 1.05, 0.8],
      [0.7, 0.52, 0.6, 0.78],
    ],
  },
  {
    id: 'feitan-wheel',
    name: 'La petite roue',
    effect: 'umbrella',
    grip: 'scissors',
    detail: { yaw: -0.4, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: HOOK, victim: THROW_CAPTURE, path: [0, 0, 0], actorPath: [0, 0, 0] },
      {
        at: 0.29,
        attacker: SCISSORS,
        victim: { ...THROW_CAPTURE, body: [0.25, -0.35, 0.15] },
        path: [0.15, 1.5, 0.12],
        actorPath: [4.5, 9, 0.25],
      },
      {
        at: 0.56,
        attacker: { ...SCISSORS, body: [-1.8, -0.8, -0.5] },
        victim: { ...THROW_LAND, body: [-2.1, -0.25, -0.25] },
        path: [0.55, 8.4, -0.15],
        actorPath: [4, 10.5, -0.25],
      },
      { at: 0.8, attacker: WIND, victim: THROW_LAND, path: [1, 0, 0], actorPath: [0, 0, 0] },
      { at: 1, attacker: HOOK, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.4, 1.2, 1, 0.8],
      [0.95, 2.7, 1.6, 0.88],
      [-0.65, 0.55, 0.65, 0.84],
    ],
  },
]
