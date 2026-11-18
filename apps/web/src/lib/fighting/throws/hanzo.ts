import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const NINJA: FightPose = {
  body: [0.2, -0.25, 0],
  chest: [0.05, -0.3, 0],
  head: [-0.15, 0.2, 0],
  leadShoulder: [-1.05, -0.1, 0.4],
  rearShoulder: [-1, 0.15, -0.3],
  leadElbow: [-0.8, 0, 0],
  rearElbow: [-1.1, 0, 0],
  leadHip: [-0.5, 0.1, 0.25],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.5, 0, 0],
}
const TURN: FightPose = {
  ...NINJA,
  body: [0.35, -1.1, 0.15],
  chest: [-0.1, -0.6, 0],
  leadShoulder: [-1.4, -0.2, 0.35],
  rearShoulder: [-0.65, 0.3, -0.45],
  leadElbow: [-0.35, 0, 0],
  rearElbow: [-1.5, 0, 0],
  leadHip: [-0.9, 0.2, 0.3],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.9, 0, 0],
}
const ROLL: FightPose = {
  ...NINJA,
  body: [-0.75, -0.55, 0.55],
  chest: [0.05, -0.3, 0],
  leadShoulder: [-1.5, 0, 0.4],
  rearShoulder: [-1.4, 0, -0.35],
  leadHip: [-1.55, 0.1, 0.5],
  rearHip: [-1.25, -0.25, -0.45],
  leadKnee: [1.05, 0, 0],
  rearKnee: [0.9, 0, 0],
}
export const HANZO_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'hanzo-blind-side',
    name: 'Dans votre dos',
    effect: 'ninja',
    detail: { yaw: -0.6, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: NINJA, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.32,
        attacker: TURN,
        victim: { ...THROW_CAPTURE, body: [0.45, 0.8, -0.15] },
        path: [0.1, 2.5, -0.25],
        actorPath: [5, 0, 0.35],
      },
      {
        at: 0.62,
        attacker: { ...TURN, body: [0.7, -1.8, -0.1] },
        victim: { ...THROW_LAND, body: [-1.9, 0.6, 0.15] },
        path: [0.85, 4.8, 0.15],
        actorPath: [3, 0, -0.2],
      },
      { at: 0.8, attacker: NINJA, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: NINJA, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.6, 1.4, 1.05, 0.77],
      [1.1, 2.65, 1.25, 0.87],
      [-0.85, 0.65, 0.6, 0.82],
    ],
  },
  {
    id: 'hanzo-moonfall',
    name: 'La chute de la lune',
    effect: 'ninja',
    grip: 'scissors',
    detail: { yaw: 0.85, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: NINJA, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.27,
        attacker: ROLL,
        victim: { ...THROW_CAPTURE, body: [0.15, -0.3, 0.2] },
        path: [0.1, 2, 0.15],
        actorPath: [4.7, 10, 0.25],
      },
      {
        at: 0.52,
        attacker: { ...ROLL, body: [-2.1, -1.05, -0.55] },
        victim: { ...THROW_LAND, body: [-2.45, -0.55, -0.2] },
        path: [0.4, 10.2, -0.2],
        actorPath: [4.4, 12, -0.3],
      },
      {
        at: 0.7,
        attacker: { ...TURN, body: [-3.8, -1.2, 0.1] },
        victim: { ...THROW_LAND, body: [-1.65, 0.2, 0.1] },
        path: [0.9, 4.5, 0.1],
        actorPath: [1.5, 5.5, 0.15],
      },
      { at: 0.8, attacker: NINJA, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: NINJA, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.85, 1.3, 1.1, 0.8],
      [-1, 3.45, 1.8, 0.93],
      [0.65, 0.5, 0.62, 0.88],
    ],
  },
]
