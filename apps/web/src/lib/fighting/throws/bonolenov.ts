import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const BEAT: FightPose = {
  body: [0.12, -0.25, 0.1],
  chest: [0.1, -0.3, 0],
  head: [-0.1, 0.2, 0],
  leadShoulder: [-1.1, 0, 0.5],
  rearShoulder: [-0.95, 0, -0.45],
  leadElbow: [-0.75, 0, 0],
  rearElbow: [-1, 0, 0],
  leadHip: [-0.4, 0.2, 0.2],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.25, 0, 0],
}
const STEP: FightPose = {
  ...BEAT,
  body: [-0.12, -0.75, -0.1],
  chest: [0.1, -0.45, 0],
  leadShoulder: [-1.45, -0.2, 0.6],
  rearShoulder: [-0.6, 0.2, -0.65],
  leadElbow: [-0.35, 0, 0],
  rearElbow: [-1.45, 0, 0],
  leadHip: [-0.7, 0.2, 0.3],
  leadKnee: [0.2, 0, 0],
  rearKnee: [0.8, 0, 0],
}
const FINALE: FightPose = {
  ...BEAT,
  body: [0.4, -1.2, 0.12],
  chest: [0.05, -0.6, 0],
  leadShoulder: [-1.55, 0, 0.2],
  rearShoulder: [-1.2, -0.2, -0.5],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-0.55, 0, 0],
  leadHip: [-0.6, 0, 0.15],
  leadKnee: [0.85, 0, 0],
  rearKnee: [0.6, 0, 0],
}
export const BONOLENOV_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'bonolenov-waltz',
    name: 'La valse du guerrier',
    effect: 'music',
    detail: { yaw: 0.35, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: BEAT, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.22,
        attacker: STEP,
        victim: { ...THROW_CAPTURE, body: [0.25, 0.35, 0.15] },
        path: [0.1, 1.5, 0.4],
      },
      {
        at: 0.43,
        attacker: { ...BEAT, body: [0.15, -1, 0.12] },
        victim: { ...THROW_CAPTURE, body: [-0.65, -0.5, -0.2] },
        path: [0.25, 3.8, -0.35],
      },
      {
        at: 0.64,
        attacker: FINALE,
        victim: { ...THROW_LAND, body: [-1.7, 0.55, 0.15] },
        path: [0.85, 3.5, 0.15],
      },
      { at: 0.8, attacker: BEAT, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: BEAT, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.35, 1.7, 1.15, 0.8],
      [-0.75, 2.4, 1.25, 0.85],
      [0.4, 1, 0.65, 0.82],
    ],
  },
  {
    id: 'bonolenov-prologue',
    name: 'Prologue : le renversement',
    effect: 'music',
    rightHand: true,
    detail: { yaw: -0.65, anchor: 'prop', victim: 'knee' },
    beats: [
      { at: 0, attacker: BEAT, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: STEP,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.65, 0.4, 0.2],
          leadHip: [-1.1, 0, 0.2],
          rearKnee: [1.2, 0, 0],
        },
        path: [0.05, 6, 0.25],
      },
      {
        at: 0.58,
        attacker: FINALE,
        victim: { ...THROW_LAND, body: [-2.15, 0.8, -0.2] },
        path: [0.65, 10.5, -0.35],
      },
      { at: 0.8, attacker: STEP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: BEAT, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.65, 1.25, 0.9, 0.8],
      [0.85, 3.5, 1.7, 0.92],
      [-0.6, 0.7, 0.65, 0.85],
    ],
  },
]
