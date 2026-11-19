import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const SUMO: FightPose = {
  body: [0.25, -0.1, 0],
  chest: [0.1, -0.2, 0],
  head: [-0.15, 0.15, 0],
  leadShoulder: [-1.1, 0, 0.45],
  rearShoulder: [-1.1, 0, -0.45],
  leadElbow: [-1.1, 0, 0],
  rearElbow: [-1.15, 0, 0],
  leadHip: [-0.65, 0.2, 0.35],
  rearHip: [-0.55, -0.2, -0.35],
  leadKnee: [1, 0, 0],
  rearKnee: [0.9, 0, 0],
}
const PIVOT: FightPose = {
  ...SUMO,
  body: [0.5, -0.85, 0.1],
  chest: [0.1, -0.45, 0],
  leadShoulder: [-0.75, -0.2, 0.4],
  rearShoulder: [-1.65, 0.1, -0.25],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-0.25, 0, 0],
  leadHip: [-0.8, 0.2, 0.3],
  leadKnee: [0.65, 0, 0],
  rearKnee: [1.1, 0, 0],
}
export const BASHO_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'basho-fifth-verse',
    name: 'Le cinquième vers',
    effect: 'poet',
    grip: 'waist',
    detail: { yaw: 0.35, anchor: 'hand', victim: 'torso' },
    beats: [
      { at: 0, attacker: SUMO, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: PIVOT,
        victim: { ...THROW_CAPTURE, body: [-0.45, 0.6, 0.25], leadKnee: [0.8, 0, 0] },
        path: [-0.05, 6.2, 0.25],
      },
      {
        at: 0.64,
        attacker: { ...PIVOT, body: [0.65, -1.35, -0.1] },
        victim: { ...THROW_LAND, body: [-2, -0.6, 0.15] },
        path: [0.85, 5, -0.2],
      },
      { at: 0.8, attacker: SUMO, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SUMO, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.35, 1.3, 1, 0.8],
      [-0.75, 2.8, 1.4, 0.88],
      [0.6, 0.55, 0.65, 0.83],
    ],
  },
  {
    id: 'basho-full-stop',
    name: 'Le point final',
    effect: 'poet',
    grip: 'waist',
    detail: { yaw: -0.65, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: SUMO, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.29,
        attacker: {
          ...SUMO,
          body: [-0.25, -0.4, 0.1],
          leadShoulder: [-1.8, 0, 0.4],
          rearShoulder: [-1.75, 0, -0.35],
          leadElbow: [-0.25, 0, 0],
          rearElbow: [-0.3, 0, 0],
        },
        victim: { ...THROW_LAND, body: [-1.1, 0.6, -0.2] },
        path: [-0.15, 13, 0.25],
      },
      {
        at: 0.56,
        attacker: { ...PIVOT, body: [0.85, -1.2, -0.1] },
        victim: { ...THROW_LAND, body: [-2.45, -0.8, 0.2], leadKnee: [1.1, 0, 0] },
        path: [0.65, 14, -0.3],
      },
      { at: 0.8, attacker: PIVOT, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SUMO, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.65, 1.55, 1.2, 0.82],
      [0.8, 4.1, 1.85, 0.97],
      [-0.4, 4.6, 0.65, 0.91],
    ],
  },
]
