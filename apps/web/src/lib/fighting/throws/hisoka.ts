import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const OFFER: FightPose = {
  body: [-0.08, 0, 0.06],
  chest: [-0.1, -0.25, 0],
  head: [0, 0.2, 0.15],
  leadShoulder: [-1.4, 0, 0.2],
  leadElbow: [-0.2, 0, 0],
  leadWrist: [0.5, 0, 0.15],
  rearShoulder: [-0.2, 0, -0.4],
  rearElbow: [-1, 0, 0],
  leadKnee: [0.28, 0, 0],
}
const RECALL: FightPose = {
  body: [-0.25, -0.4, 0.16],
  chest: [-0.15, -0.4, 0],
  head: [0.1, 0.3, 0.15],
  leadShoulder: [-0.55, 0.2, 0.65],
  leadElbow: [-1.8, 0, 0],
  leadWrist: [0.4, 0.6, 0],
  rearShoulder: [-1.4, 0, -0.6],
  rearElbow: [-0.7, 0, 0],
  leadHip: [-0.45, 0, 0.1],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const DUCK: FightPose = {
  root: [0, -0.3, 0],
  body: [0.55, -0.75, -0.12],
  chest: [0.1, -0.35, 0],
  head: [-0.4, 0.3, 0.1],
  leadShoulder: [-1.8, 0, 0.45],
  leadElbow: [-0.4, 0, 0],
  rearShoulder: [-1.25, 0, -0.5],
  rearElbow: [-0.3, 0, 0],
  leadHip: [-0.85, 0, 0.1],
  leadKnee: [1.25, 0, 0],
  rearKnee: [0.9, 0, 0],
}
export const HISOKA_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'hisoka-return',
    name: 'Retour à l’envoyeur',
    effect: 'gum',
    beats: [
      { at: 0, attacker: OFFER, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: OFFER,
        victim: { ...THROW_CAPTURE, body: [-0.4, 0, 0.1] },
        path: [1.4, 2.4, 0],
      },
      {
        at: 0.52,
        attacker: RECALL,
        victim: { ...THROW_CAPTURE, body: [0.7, 0.3, -0.1] },
        path: [-0.12, 4.6, 0.25],
      },
      { at: 0.78, attacker: DUCK, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.12, 1.8, 1.2, 0.8],
      [-0.55, 2.2, 1.25, 0.8],
      [0.5, 0.85, 0.6, 0.8],
    ],
  },
  {
    id: 'hisoka-trapeze',
    name: 'Le trapèze',
    effect: 'gum',
    beats: [
      { at: 0, attacker: OFFER, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: DUCK,
        victim: { ...THROW_CAPTURE, body: [-0.65, 0.2, 0.2], leadKnee: [1.1, 0, 0] },
        path: [-0.3, 7.5, 0.35],
      },
      {
        at: 0.53,
        attacker: { ...RECALL, leadShoulder: [-2.5, 0, 0.25], leadElbow: [-0.3, 0, 0] },
        victim: { ...THROW_LAND, body: [-2.1, 0.55, -0.1] },
        path: [0.35, 11, -0.35],
      },
      { at: 0.8, attacker: RECALL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: OFFER, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.3, 1.5, 1.1, 0.84],
      [0.85, 3.2, 1.8, 0.92],
      [-0.15, 0.9, 0.65, 0.84],
    ],
  },
]
