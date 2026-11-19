import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const READ: FightPose = {
  chest: [0.05, -0.15, 0],
  head: [0.2, 0.15, 0],
  leadShoulder: [-0.75, -0.35, 0.75],
  leadElbow: [-1.4, 0, 0],
  leadWrist: [0.2, 0, 0],
  rearShoulder: [-1.25, 0, -0.1],
  rearElbow: [-0.35, 0, 0],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.15, 0, 0],
}
const TURN: FightPose = {
  ...READ,
  body: [0.15, -0.7, 0],
  chest: [0.05, -0.45, 0],
  head: [0.18, 0.1, 0],
  rearShoulder: [-1.65, -0.4, -0.15],
  rearElbow: [-1.25, 0, 0],
  rearHip: [-0.7, 0, -0.15],
  rearKnee: [0.8, 0, 0],
}
const DISCARD: FightPose = {
  ...READ,
  body: [-0.1, -0.9, 0],
  chest: [0.05, 0.15, 0],
  rearShoulder: [-0.45, -0.5, -0.7],
  rearElbow: [-0.1, 0, 0],
  leadHip: [-0.45, 0.2, 0.1],
  leadKnee: [0.6, 0, 0],
}
export const CHROLLO_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'chrollo-page',
    name: 'La page tournée',
    effect: 'book',
    rightHand: true,
    beats: [
      { at: 0, attacker: READ, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.36,
        attacker: TURN,
        victim: { ...THROW_CAPTURE, body: [-0.55, 0.6, 0.2] },
        path: [0.18, 3.6, 0.25],
      },
      {
        at: 0.64,
        attacker: DISCARD,
        victim: { ...THROW_LAND, body: [-1.28, 0.45, 0.1] },
        path: [0.8, 3, -0.15],
      },
      { at: 0.8, attacker: READ, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: READ, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.45, 1.8, 1.3, 0.75],
      [0.95, 2.25, 1.1, 0.82],
      [0.15, 1.2, 0.7, 0.84],
    ],
  },
  {
    id: 'chrollo-public',
    name: 'Le public participe',
    effect: 'book',
    rightHand: true,
    beats: [
      { at: 0, attacker: READ, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: { ...TURN, body: [0.25, -1, 0.08] },
        victim: { ...THROW_CAPTURE, body: [0.4, -0.6, 0.25], rearShoulder: [-1.8, 0, -0.3] },
        path: [0.42, 2, 0.55],
      },
      {
        at: 0.58,
        attacker: { ...DISCARD, rearShoulder: [-1.8, 0, -0.55] },
        victim: { ...THROW_LAND, body: [-1.75, -0.7, -0.15] },
        path: [0.75, 7.8, 0.3],
      },
      { at: 0.8, attacker: READ, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: READ, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.55, 1.8, 1.2, 0.8],
      [-0.7, 2.5, 1.35, 0.9],
      [-0.25, 1.1, 0.65, 0.85],
    ],
  },
]
