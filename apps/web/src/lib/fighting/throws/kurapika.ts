import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const CATCH: FightPose = {
  body: [0.12, -0.12, 0],
  chest: [0, -0.25, 0],
  head: [-0.1, 0.2, 0],
  leadShoulder: [-1.35, 0, 0.12],
  leadElbow: [-0.35, 0, 0],
  leadWrist: [0.1, 0.4, 0],
  rearShoulder: [-0.7, 0, -0.18],
  rearElbow: [-1.15, 0, 0],
  leadHip: [-0.25, 0, 0],
  leadKnee: [0.4, 0, 0],
}
const PULL: FightPose = {
  body: [-0.12, -0.65, 0.08],
  chest: [0.1, -0.65, 0],
  head: [0.05, 0.35, 0],
  leadShoulder: [-0.8, -0.4, 0.55],
  leadElbow: [-1.5, 0, 0],
  leadWrist: [0.2, 0.55, 0],
  rearShoulder: [-1.1, 0.15, -0.3],
  rearElbow: [-0.8, 0, 0],
  leadHip: [-0.45, 0, 0.15],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.18, 0, 0],
}
const SWEEP: FightPose = {
  body: [0.3, -0.9, 0],
  chest: [-0.15, -0.35, 0],
  head: [-0.2, 0.5, 0],
  leadShoulder: [-0.25, -0.2, 0.7],
  leadElbow: [-1.6, 0, 0],
  rearShoulder: [-1.3, 0, -0.15],
  rearElbow: [-0.5, 0, 0],
  leadHip: [-0.9, 0.3, 0.45],
  leadKnee: [0.12, 0, 0],
  rearKnee: [0.75, 0, 0],
}
export const KURAPIKA_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'kurapika-pendulum',
    name: 'Le pendule du jugement',
    effect: 'chain',
    rightHand: true,
    beats: [
      { at: 0, attacker: CATCH, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.32,
        attacker: PULL,
        victim: { ...THROW_CAPTURE, body: [-0.35, 0.55, -0.2] },
        path: [0.25, 3, 0.32],
      },
      {
        at: 0.62,
        attacker: SWEEP,
        victim: { ...THROW_LAND, body: [-1.2, 0.75, 0.12] },
        path: [0.78, 3.7, 0.2],
      },
      { at: 0.8, attacker: PULL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: CATCH, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.12, 1.9, 1.18, 0.83],
      [0.8, 2.3, 1.2, 0.78],
      [0.4, 0.95, 0.65, 0.8],
    ],
  },
  {
    id: 'kurapika-last-link',
    name: 'Le dernier maillon',
    effect: 'chain',
    rightHand: true,
    beats: [
      {
        at: 0,
        attacker: { ...CATCH, body: [0.4, 0, 0], leadShoulder: [-0.7, 0, 0.1] },
        victim: THROW_CAPTURE,
        path: [0, 0, 0],
      },
      {
        at: 0.3,
        attacker: { ...PULL, leadShoulder: [-2.3, 0, 0.3], leadElbow: [-0.2, 0, 0] },
        victim: { ...THROW_CAPTURE, body: [-0.75, 0, 0.15], leadHip: [-1.25, 0, 0.2] },
        path: [0.12, 5.8, -0.15],
      },
      {
        at: 0.56,
        attacker: SWEEP,
        victim: { ...THROW_LAND, body: [-2.3, 0.25, 0.1], leadHip: [-1.2, 0, 0.1] },
        path: [0.58, 8.2, -0.25],
      },
      { at: 0.8, attacker: PULL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: CATCH, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.3, 1.15, 0.9, 0.82],
      [-0.65, 3.1, 1.45, 0.88],
      [-0.2, 0.8, 0.6, 0.8],
    ],
  },
]
