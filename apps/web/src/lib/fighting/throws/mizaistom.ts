import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const NOTICE: FightPose = {
  body: [0.05, -0.1, 0],
  chest: [0.03, -0.12, 0],
  head: [-0.05, 0.15, 0],
  leadShoulder: [-1.25, -0.15, 0.35],
  rearShoulder: [-0.95, 0, -0.25],
  leadElbow: [-0.7, 0, 0],
  rearElbow: [-0.9, 0, 0],
  leadWrist: [0.2, 0, 0],
  leadKnee: [0.22, 0, 0],
  rearKnee: [0.2, 0, 0],
}
const ARREST: FightPose = {
  ...NOTICE,
  body: [0.35, -0.6, 0.1],
  chest: [0.1, -0.4, 0],
  leadShoulder: [-0.7, -0.3, 0.25],
  rearShoulder: [-1.35, 0.2, -0.2],
  leadElbow: [-1.55, 0, 0],
  rearElbow: [-0.45, 0, 0],
  leadHip: [-0.6, 0, 0.15],
  leadKnee: [0.7, 0, 0],
  rearKnee: [0.4, 0, 0],
}
export const MIZAISTOM_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'mizaistom-warning',
    name: 'Veuillez rester ici',
    effect: 'referee',
    detail: { yaw: 0.15, anchor: 'prop', victim: 'wrist' },
    beats: [
      { at: 0, attacker: NOTICE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: ARREST,
        victim: { ...THROW_CAPTURE, body: [0.55, -0.35, 0.2], leadShoulder: [-1.7, 0.1, 0.3] },
        path: [0.08, 1.8, 0.1],
      },
      {
        at: 0.64,
        attacker: { ...ARREST, body: [0.5, -1, 0] },
        victim: { ...THROW_LAND, body: [-1.6, 0.35, 0.2] },
        path: [0.85, 2.6, -0.1],
      },
      { at: 0.8, attacker: NOTICE, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: NOTICE, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.15, 1.7, 1.2, 0.76],
      [-0.45, 2.55, 1.05, 0.84],
      [0.35, 3.8, 0.65, 0.83],
    ],
  },
  {
    id: 'mizaistom-custody',
    name: 'Fin de la déposition',
    effect: 'referee',
    detail: { yaw: -0.75, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: NOTICE, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.28,
        attacker: { ...ARREST, body: [-0.12, -0.8, 0.15] },
        victim: { ...THROW_CAPTURE, body: [-0.7, -0.65, 0.25], leadHip: [-0.9, 0, 0.2] },
        path: [-0.1, 6.5, 0.25],
      },
      {
        at: 0.56,
        attacker: { ...ARREST, body: [0.65, -1.35, -0.1] },
        victim: { ...THROW_LAND, body: [-2.2, 0.75, -0.15] },
        path: [0.6, 7.8, -0.25],
      },
      { at: 0.8, attacker: ARREST, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: NOTICE, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.75, 1.85, 1.25, 0.79],
      [0.7, 3.1, 1.45, 0.87],
      [-0.4, 4.5, 0.62, 0.89],
    ],
  },
]
