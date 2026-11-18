import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const SWEEP: FightPose = {
  body: [0.3, -0.3, 0.08],
  chest: [0.12, -0.25, 0],
  head: [-0.15, 0.15, 0],
  leadShoulder: [-1.15, -0.1, 0.2],
  rearShoulder: [-1.05, 0.15, -0.35],
  leadElbow: [-0.65, 0, 0],
  rearElbow: [-1.2, 0, 0],
  leadHip: [-0.55, 0, 0.1],
  leadKnee: [0.85, 0, 0],
  rearKnee: [0.4, 0, 0],
}
const LEVER: FightPose = {
  ...SWEEP,
  body: [-0.2, -0.8, -0.08],
  chest: [-0.15, -0.4, 0],
  leadShoulder: [-1.4, 0, 0.55],
  rearShoulder: [-1.5, -0.15, -0.35],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-0.55, 0, 0],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.7, 0, 0],
}
export const SHIZUKU_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'shizuku-brush',
    name: 'Un coup de balai',
    effect: 'blinky',
    grip: 'prop',
    rightHand: true,
    detail: { yaw: 0.8, anchor: 'prop', victim: 'knee' },
    beats: [
      { at: 0, attacker: SWEEP, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: { ...SWEEP, body: [0.55, -0.7, 0.1] },
        victim: { ...THROW_CAPTURE, body: [0.65, -0.45, 0.25], leadHip: [-0.9, 0, 0.2] },
        path: [0.08, 2.2, 0.15],
      },
      {
        at: 0.62,
        attacker: LEVER,
        victim: { ...THROW_LAND, body: [-1.7, -0.6, -0.15] },
        path: [0.85, 4.2, -0.2],
      },
      { at: 0.8, attacker: SWEEP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SWEEP, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.8, 0.95, 0.75, 0.79],
      [-0.7, 1.7, 1.15, 0.83],
      [0.45, 0.48, 0.6, 0.8],
    ],
  },
  {
    id: 'shizuku-spring-clean',
    name: 'Le grand ménage',
    effect: 'blinky',
    grip: 'prop',
    rightHand: true,
    detail: { yaw: -0.55, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: SWEEP, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: LEVER,
        victim: { ...THROW_CAPTURE, body: [-0.6, 0.7, 0.25], rearKnee: [1.2, 0, 0] },
        path: [-0.1, 8, 0.45],
      },
      {
        at: 0.55,
        attacker: { ...LEVER, body: [0.1, -1.4, 0.15], rearShoulder: [-1.7, 0, -0.5] },
        victim: { ...THROW_LAND, body: [-2.2, -0.8, -0.2] },
        path: [0.5, 12.5, -0.4],
      },
      { at: 0.8, attacker: SWEEP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SWEEP, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.55, 1.2, 0.95, 0.81],
      [0.75, 3.25, 1.65, 0.91],
      [-0.8, 0.62, 0.6, 0.86],
    ],
  },
]
