import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const INSPECT: FightPose = {
  body: [0, 0, 0],
  chest: [0, -0.1, 0],
  head: [0.08, 0.15, -0.1],
  leadShoulder: [-1.05, 0, 0.22],
  leadElbow: [-0.75, 0, 0],
  leadWrist: [0.3, 0.4, 0],
  rearShoulder: [-0.3, 0, -0.3],
  rearElbow: [-1.1, 0, 0],
  leadKnee: [0.15, 0, 0],
  rearKnee: [0.1, 0, 0],
}
const ARRANGE: FightPose = {
  ...INSPECT,
  chest: [0.05, -0.4, 0],
  leadShoulder: [-1.45, -0.2, 0.25],
  leadElbow: [-0.3, 0, 0],
  rearShoulder: [-1.3, 0.2, -0.2],
  rearElbow: [-0.7, 0, 0],
  leadHip: [-0.35, 0, 0.15],
  leadKnee: [0.3, 0, 0],
}
const REMOVE: FightPose = {
  ...INSPECT,
  body: [-0.08, -0.65, 0],
  chest: [0, -0.25, 0],
  head: [0.12, 0.4, -0.1],
  leadShoulder: [-0.7, 0, 0.5],
  leadElbow: [-1.45, 0, 0],
  rearShoulder: [-0.35, 0, -0.6],
  rearElbow: [-0.3, 0, 0],
  leadHip: [-0.8, 0.3, 0.2],
  leadKnee: [0.12, 0, 0],
}
export const TSERRIEDNICH_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'tserriednich-collection',
    name: 'La pièce de collection',
    effect: 'collector',
    beats: [
      { at: 0, attacker: INSPECT, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.4,
        attacker: ARRANGE,
        victim: { ...THROW_CAPTURE, body: [0.15, -0.5, 0.15], leadShoulder: [-1.75, 0, 0.35] },
        path: [0.08, 0.5, 0.2],
      },
      {
        at: 0.64,
        attacker: REMOVE,
        victim: { ...THROW_LAND, body: [-1.25, -0.25, 0.18] },
        path: [0.8, 0.6, 0.1],
      },
      { at: 0.8, attacker: INSPECT, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: INSPECT, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0, 1.9, 1.25, 0.82],
      [0.05, 2.1, 1.1, 0.78],
      [0.6, 1.4, 0.65, 0.82],
    ],
  },
  {
    id: 'tserriednich-future',
    name: 'Le futur manqué',
    effect: 'collector',
    beats: [
      { at: 0, attacker: INSPECT, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: { ...ARRANGE, body: [0, 0.6, 0], chest: [0, -0.6, 0] },
        victim: { ...THROW_CAPTURE, body: [0.6, -0.7, -0.15], leadShoulder: [-1.7, 0, 0.2] },
        path: [-0.15, 2.2, -0.45],
      },
      {
        at: 0.57,
        attacker: { ...REMOVE, body: [0, -1, 0], leadShoulder: [-1.5, 0, 0.35] },
        victim: { ...THROW_LAND, body: [-1.9, 0.6, -0.1] },
        path: [0.55, 7, 0.4],
      },
      { at: 0.8, attacker: INSPECT, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: INSPECT, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0, 1.85, 1.2, 0.8],
      [-0.9, 2.45, 1.4, 0.86],
      [0.5, 1.2, 0.7, 0.84],
    ],
  },
]
