import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const COLLAR: FightPose = {
  body: [0.18, -0.15, 0],
  chest: [0.12, -0.2, 0],
  head: [-0.12, 0.2, 0],
  leadShoulder: [-1.25, 0, 0.25],
  rearShoulder: [-0.95, 0, -0.3],
  leadElbow: [-0.6, 0, 0],
  rearElbow: [-1, 0, 0],
  leadHip: [-0.3, 0, 0.1],
  leadKnee: [0.4, 0, 0],
  rearKnee: [0.3, 0, 0],
}
const TRIP: FightPose = {
  ...COLLAR,
  body: [-0.15, -0.85, 0.12],
  chest: [-0.08, -0.45, 0],
  leadShoulder: [-0.75, -0.25, 0.45],
  rearShoulder: [-1.5, 0.2, -0.3],
  leadElbow: [-1.25, 0, 0],
  rearElbow: [-0.25, 0, 0],
  rearHip: [-0.85, 0, -0.2],
  rearKnee: [0.15, 0, 0],
}
const FLOOR: FightPose = {
  ...COLLAR,
  body: [0.85, -0.3, 0.1],
  chest: [0.25, -0.2, 0],
  head: [-0.4, 0.15, 0],
  rearShoulder: [-0.3, -0.1, -0.2],
  rearElbow: [-0.15, 0, 0],
  leadHip: [-0.9, 0, 0.15],
  leadKnee: [1.4, 0, 0],
  rearKnee: [1.1, 0, 0],
}
export const LEORIO_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'leorio-consultation',
    name: 'La consultation express',
    effect: 'doctor',
    detail: { yaw: 0.45, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: COLLAR, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.35,
        attacker: TRIP,
        victim: { ...THROW_CAPTURE, body: [0.45, -0.5, 0.25], rearHip: [-0.9, 0, -0.2] },
        path: [0.1, 2.8, 0.15],
      },
      {
        at: 0.63,
        attacker: { ...TRIP, body: [0.25, -1.2, 0] },
        victim: { ...THROW_LAND, body: [-1.8, -0.35, 0.1] },
        path: [0.88, 3.6, -0.1],
      },
      { at: 0.8, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.45, 1.55, 1.1, 0.78],
      [-0.6, 2.3, 1.2, 0.85],
      [0.65, 0.55, 0.65, 0.81],
    ],
  },
  {
    id: 'leorio-house-call',
    name: 'La visite à domicile',
    effect: 'remote',
    rightHand: true,
    detail: { yaw: -0.5, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: COLLAR, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.23,
        attacker: FLOOR,
        victim: { ...THROW_CAPTURE, body: [-0.2, 0.1, 0.15], rearKnee: [0.65, 0, 0] },
        path: [0, 2, 0.05],
      },
      {
        at: 0.44,
        attacker: { ...COLLAR, body: [-0.2, -0.55, 0.1], head: [-0.35, 0.1, 0] },
        victim: { ...THROW_CAPTURE, body: [-0.75, 0.55, 0.2], leadKnee: [1, 0, 0] },
        path: [0.2, 15.5, 0.2],
      },
      {
        at: 0.63,
        attacker: TRIP,
        victim: { ...THROW_LAND, body: [-2.15, -0.65, -0.15] },
        path: [0.75, 13.5, -0.2],
      },
      { at: 0.8, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: COLLAR, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.5, 0.8, 0.55, 0.78],
      [0.55, 3.8, 1.9, 0.96],
      [-0.7, 0.5, 0.65, 0.87],
    ],
  },
]
