import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const SLIP: FightPose = {
  body: [0.25, -0.3, 0.08],
  chest: [0.1, -0.2, 0],
  head: [-0.15, 0.25, 0],
  leadShoulder: [-1.05, -0.1, 0.35],
  rearShoulder: [-0.85, 0.2, -0.3],
  leadElbow: [-0.85, 0, 0],
  rearElbow: [-1.2, 0, 0],
  leadWrist: [0.3, 0.15, 0],
  leadHip: [-0.6, 0.1, 0.25],
  leadKnee: [0.7, 0, 0],
  rearKnee: [0.5, 0, 0],
}
const TURN: FightPose = {
  ...SLIP,
  body: [0.5, -1, 0.15],
  chest: [-0.1, -0.5, 0],
  leadShoulder: [-1.4, -0.2, 0.4],
  rearShoulder: [-0.65, 0.25, -0.4],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-1.5, 0, 0],
  leadHip: [-0.8, 0.2, 0.3],
  leadKnee: [0.35, 0, 0],
  rearKnee: [0.85, 0, 0],
}
export const LUINI_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'luini-wrong-door',
    name: 'Vous vous êtes trompé de porte',
    effect: 'passage',
    rightHand: true,
    detail: { yaw: -0.55, anchor: 'hand', victim: 'wrist' },
    beats: [
      { at: 0, attacker: SLIP, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.33,
        attacker: TURN,
        victim: { ...THROW_CAPTURE, body: [0.5, 0.7, -0.2] },
        path: [0.1, 3.2, -0.25],
        actorPath: [3.5, 0, 0.3],
      },
      {
        at: 0.63,
        attacker: { ...TURN, body: [0.7, -1.55, -0.1] },
        victim: { ...THROW_LAND, body: [-1.95, 0.55, 0.15] },
        path: [0.85, 4.5, 0.15],
      },
      { at: 0.8, attacker: SLIP, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SLIP, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.55, 1.45, 1.05, 0.78],
      [1.05, 2.6, 1.25, 0.87],
      [-0.75, 0.6, 0.62, 0.82],
    ],
  },
  {
    id: 'luini-emergency-exit',
    name: 'La sortie de secours',
    effect: 'passage',
    rightHand: true,
    detail: { yaw: 0.7, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: SLIP, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.27,
        attacker: { ...TURN, body: [-0.1, -0.85, 0.15] },
        victim: { ...THROW_CAPTURE, body: [-0.75, 0.8, 0.25], leadHip: [-0.95, 0, 0.2] },
        path: [-0.15, 7.2, 0.4],
      },
      {
        at: 0.54,
        attacker: { ...TURN, body: [0.8, -1.9, -0.1] },
        victim: { ...THROW_LAND, body: [-2.35, -0.9, -0.2] },
        path: [0.55, 10.2, -0.35],
      },
      { at: 0.8, attacker: TURN, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: SLIP, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.7, 1.2, 0.9, 0.8],
      [-1, 3.4, 1.65, 0.92],
      [0.6, 0.52, 0.6, 0.86],
    ],
  },
]
