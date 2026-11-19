import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const LOCK: FightPose = {
  body: [0.25, 0, 0],
  chest: [0.15, -0.2, 0],
  head: [-0.15, 0, 0],
  leadShoulder: [-1.25, 0, 0.25],
  leadElbow: [-1, 0, 0],
  rearShoulder: [-1.15, 0, -0.25],
  rearElbow: [-1.2, 0, 0],
  leadHip: [-0.45, 0, 0.15],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const DRIVE: FightPose = {
  ...LOCK,
  body: [0.6, -0.45, 0.1],
  chest: [0.15, -0.5, 0],
  leadShoulder: [-0.7, -0.3, 0.45],
  leadElbow: [-1.6, 0, 0],
  rearShoulder: [-1.7, 0, -0.15],
  rearElbow: [-0.5, 0, 0],
  leadHip: [-0.8, 0, 0.2],
  leadKnee: [1.2, 0, 0],
  rearKnee: [0.25, 0, 0],
}
const KNEEL: FightPose = {
  ...DRIVE,
  root: [0, -0.3, 0],
  body: [0.48, -0.35, 0],
  leadHip: [-1.15, 0, 0.2],
  leadKnee: [1.6, 0, 0],
  rearKnee: [1.1, 0, 0],
}
export const BENJAMIN_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'benjamin-restraint',
    name: 'Neutralisation réglementaire',
    effect: 'military',
    beats: [
      {
        at: 0,
        attacker: LOCK,
        victim: { ...THROW_CAPTURE, rearElbow: [-1.8, 0, 0] },
        path: [0, 0, 0],
      },
      {
        at: 0.35,
        attacker: DRIVE,
        victim: { ...THROW_CAPTURE, body: [0.75, -0.55, 0.35], rearShoulder: [0.6, 0, -0.1] },
        path: [0.15, 1.3, 0.1],
      },
      {
        at: 0.65,
        attacker: KNEEL,
        victim: { ...THROW_LAND, body: [-1.3, -0.25, 0.22] },
        path: [0.9, 0.4, 0],
      },
      { at: 0.8, attacker: KNEEL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: LOCK, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.2, 1.1, 0.95, 0.8],
      [0.45, 2.7, 0.8, 0.78],
      [0.35, 2.9, 0.6, 0.82],
    ],
  },
  {
    id: 'benjamin-arrest',
    name: 'Mise aux arrêts',
    effect: 'military',
    beats: [
      {
        at: 0,
        attacker: { ...LOCK, body: [0.45, 0.4, 0] },
        victim: THROW_CAPTURE,
        path: [0, 0, -0.15],
      },
      {
        at: 0.28,
        attacker: {
          ...LOCK,
          body: [-0.3, -0.1, 0],
          leadShoulder: [-1.9, 0, 0.1],
          rearShoulder: [-1.9, 0, -0.1],
        },
        victim: {
          ...THROW_CAPTURE,
          body: [-0.2, 0.4, 0.1],
          leadKnee: [1.2, 0, 0],
          rearKnee: [1.1, 0, 0],
        },
        path: [-0.2, 8, -0.2],
      },
      {
        at: 0.55,
        attacker: { ...DRIVE, body: [0.7, -1.1, 0.1] },
        victim: { ...THROW_LAND, body: [-2.15, 0.5, 0.15] },
        path: [0.45, 9.5, 0.25],
      },
      { at: 0.8, attacker: KNEEL, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: LOCK, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.5, 1, 1.1, 0.82],
      [-0.5, 2.6, 1.6, 0.9],
      [-0.15, 3.4, 0.65, 0.85],
    ],
  },
]
