import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const HANDSHAKE: FightPose = {
  body: [0.08, -0.15, 0],
  chest: [0, -0.2, 0],
  head: [0.05, 0.15, 0],
  leadShoulder: [-0.9, 0, 0.25],
  rearShoulder: [-1.1, 0, -0.2],
  leadElbow: [-1.3, 0, 0],
  rearElbow: [-0.6, 0, 0],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.15, 0, 0],
}
const LOCK: FightPose = {
  ...HANDSHAKE,
  body: [0.3, -0.65, 0.1],
  chest: [0.1, -0.45, 0],
  leadShoulder: [-0.65, -0.35, 0.2],
  rearShoulder: [-1.35, 0.2, -0.1],
  leadElbow: [-1.6, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.6, 0.1, 0.15],
  leadKnee: [0.75, 0, 0],
}
export const HINRIGH_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'hinrigh-handshake',
    name: 'La poignée de main des Xi-Yu',
    effect: 'cuffs',
    rightHand: true,
    detail: { yaw: -0.35, anchor: 'prop', victim: 'wrist' },
    beats: [
      { at: 0, attacker: HANDSHAKE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.36,
        attacker: LOCK,
        victim: { ...THROW_CAPTURE, body: [0.65, -0.5, 0.3], leadShoulder: [0.5, 0, 0.1] },
        path: [0.12, 1.3, 0.18],
      },
      {
        at: 0.65,
        attacker: { ...LOCK, body: [0.45, -1.1, 0] },
        victim: { ...THROW_LAND, body: [-1.55, -0.7, 0.1] },
        path: [0.9, 2.2, -0.12],
      },
      { at: 0.8, attacker: HANDSHAKE, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: HANDSHAKE, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.35, 1.65, 1.15, 0.77],
      [0.5, 2.2, 1.05, 0.82],
      [-0.55, 3.6, 0.65, 0.85],
    ],
  },
  {
    id: 'hinrigh-underboss',
    name: 'Le bras droit',
    effect: 'cuffs',
    rightHand: true,
    detail: { yaw: 0.6, anchor: 'prop', victim: 'wrist' },
    beats: [
      { at: 0, attacker: HANDSHAKE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: { ...LOCK, body: [-0.1, -0.9, 0.12], rearShoulder: [-1.65, 0, -0.35] },
        victim: { ...THROW_CAPTURE, body: [-0.65, 0.7, 0.3], rearShoulder: [-1.8, 0, -0.2] },
        path: [0.05, 6.8, 0.3],
      },
      {
        at: 0.57,
        attacker: { ...LOCK, body: [0.55, -1.5, -0.1] },
        victim: { ...THROW_LAND, body: [-2.05, -0.75, -0.2], rearKnee: [1.1, 0, 0] },
        path: [0.7, 9.2, -0.35],
      },
      { at: 0.8, attacker: HANDSHAKE, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: HANDSHAKE, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.6, 1.5, 1.1, 0.8],
      [-0.9, 2.85, 1.5, 0.9],
      [0.75, 0.6, 0.62, 0.84],
    ],
  },
]
