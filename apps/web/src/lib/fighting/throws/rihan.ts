import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const WATCH: FightPose = {
  body: [0.15, -0.2, 0],
  chest: [0.05, -0.25, 0],
  head: [-0.12, 0.2, 0],
  leadShoulder: [-1.05, -0.1, 0.2],
  rearShoulder: [-0.95, 0.1, -0.3],
  leadElbow: [-0.9, 0, 0],
  rearElbow: [-1.2, 0, 0],
  leadHip: [-0.4, 0.1, 0.15],
  leadKnee: [0.5, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const TRAP: FightPose = {
  ...WATCH,
  body: [0.4, -0.7, 0.12],
  chest: [0.12, -0.45, 0],
  leadShoulder: [-0.7, -0.3, 0.35],
  rearShoulder: [-1.45, 0.15, -0.2],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.8, 0, 0.2],
  leadKnee: [0.9, 0, 0],
}
export const RIHAN_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'rihan-snare',
    name: 'Le piège patient',
    effect: 'hunter',
    detail: { yaw: -0.45, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: WATCH, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.36,
        attacker: TRAP,
        victim: { ...THROW_CAPTURE, body: [0.6, -0.55, 0.25], leadShoulder: [0.3, 0, 0.2] },
        path: [0.06, 1.5, 0.15],
        actorPath: [1.5, 0, -0.15],
      },
      {
        at: 0.64,
        attacker: { ...TRAP, body: [0.6, -1.15, 0] },
        victim: { ...THROW_LAND, body: [-1.75, -0.4, 0.18] },
        path: [0.9, 2.8, -0.1],
      },
      { at: 0.8, attacker: WATCH, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: WATCH, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.45, 1.65, 1.15, 0.76],
      [0.4, 2.4, 1.05, 0.82],
      [-0.7, 3.4, 0.65, 0.85],
    ],
  },
  {
    id: 'rihan-dead-end',
    name: 'L’impasse',
    effect: 'hunter',
    detail: { yaw: 0.7, anchor: 'head', victim: 'torso' },
    beats: [
      { at: 0, attacker: WATCH, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: { ...TRAP, body: [-0.15, -1.05, 0.1] },
        victim: { ...THROW_CAPTURE, body: [-0.6, 0.65, -0.2], rearKnee: [1.1, 0, 0] },
        path: [-0.1, 5.8, 0.3],
        actorPath: [6.5, 0, 0.4],
      },
      {
        at: 0.56,
        attacker: { ...TRAP, body: [0.75, -1.65, -0.1] },
        victim: { ...THROW_LAND, body: [-2.15, -0.8, 0.15] },
        path: [0.65, 8.6, -0.3],
        actorPath: [4, 0, -0.2],
      },
      { at: 0.8, attacker: TRAP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: WATCH, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.7, 1.75, 1.2, 0.8],
      [-0.95, 2.95, 1.55, 0.9],
      [0.55, 0.58, 0.62, 0.86],
    ],
  },
]
