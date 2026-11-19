import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const LISTEN: FightPose = {
  body: [0.08, -0.2, 0],
  chest: [0.05, -0.15, 0],
  head: [-0.08, 0.25, 0.08],
  leadShoulder: [-1.05, 0, 0.35],
  rearShoulder: [-0.95, 0, -0.25],
  leadElbow: [-0.9, 0, 0],
  rearElbow: [-1.05, 0, 0],
  leadHip: [-0.3, 0, 0.2],
  leadKnee: [0.5, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const STEP: FightPose = {
  ...LISTEN,
  body: [0.25, -0.8, 0.1],
  chest: [0.1, -0.45, 0],
  leadShoulder: [-0.7, -0.3, 0.4],
  rearShoulder: [-1.4, 0.2, -0.25],
  leadElbow: [-1.45, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.7, 0.1, 0.3],
  leadKnee: [0.75, 0, 0],
  rearKnee: [0.2, 0, 0],
}
export const MELODY_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'melody-offbeat',
    name: 'Le contretemps',
    effect: 'flute',
    detail: { yaw: -0.3, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: LISTEN, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: STEP,
        victim: { ...THROW_CAPTURE, body: [0.55, -0.5, 0.2], leadHip: [-0.8, 0, 0.2] },
        path: [0.08, 2.5, 0.2],
        actorPath: [2, 0, -0.2],
      },
      {
        at: 0.64,
        attacker: { ...STEP, body: [0.4, -1.2, -0.1] },
        victim: { ...THROW_LAND, body: [-1.7, 0.45, 0.15] },
        path: [0.9, 3.2, -0.15],
      },
      { at: 0.8, attacker: LISTEN, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: LISTEN, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.3, 1.15, 0.85, 0.77],
      [0.65, 2.15, 1.05, 0.83],
      [-0.6, 0.5, 0.6, 0.79],
    ],
  },
  {
    id: 'melody-last-bar',
    name: 'La dernière mesure',
    effect: 'flute',
    detail: { yaw: 0.65, anchor: 'prop', victim: 'wrist' },
    beats: [
      { at: 0, attacker: LISTEN, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.26,
        attacker: { ...STEP, body: [-0.1, -0.7, 0.15] },
        victim: { ...THROW_CAPTURE, body: [-0.5, 0.65, 0.2], rearKnee: [1.15, 0, 0] },
        path: [-0.05, 6.5, 0.35],
        actorPath: [3.5, 0, -0.3],
      },
      {
        at: 0.53,
        attacker: { ...STEP, body: [0.5, -1.5, -0.1] },
        victim: { ...THROW_LAND, body: [-2.2, -0.7, -0.2] },
        path: [0.6, 9.8, -0.35],
        actorPath: [2, 0, 0.25],
      },
      { at: 0.8, attacker: STEP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: LISTEN, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.65, 1.2, 0.85, 0.8],
      [-0.85, 3.1, 1.4, 0.89],
      [0.45, 0.62, 0.6, 0.83],
    ],
  },
]
