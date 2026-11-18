import { THROW_CAPTURE, THROW_LAND, type ThrowPerformance } from './types'
import type { FightPose } from '../fightPose'

const BAR: FightPose = {
  body: [0.22, -0.3, 0],
  chest: [0.12, -0.2, 0],
  head: [-0.1, 0.25, 0],
  leadShoulder: [-1.05, 0.2, 0.32],
  rearShoulder: [-0.9, -0.2, -0.4],
  leadElbow: [-0.6, 0, 0],
  rearElbow: [-1.3, 0, 0],
  leadHip: [-0.4, 0, 0.25],
  leadKnee: [0.65, 0, 0],
  rearKnee: [0.35, 0, 0],
}
const LEVER: FightPose = {
  ...BAR,
  body: [-0.25, -0.65, 0.15],
  chest: [-0.1, -0.35, 0],
  leadShoulder: [-1.6, -0.3, 0.4],
  rearShoulder: [-1.2, 0.2, -0.5],
  leadElbow: [-0.25, 0, 0],
  rearElbow: [-0.6, 0, 0],
  leadHip: [-0.65, 0, 0.2],
  leadKnee: [0.85, 0, 0],
}
const VAULT: FightPose = {
  body: [0.15, -0.7, 0.65],
  chest: [0.1, 0.2, 0],
  head: [-0.2, 0.3, -0.1],
  leadShoulder: [-0.35, 0.2, 0.6],
  rearShoulder: [-0.45, -0.1, -0.6],
  leadElbow: [-0.3, 0, 0],
  rearElbow: [-0.4, 0, 0],
  leadHip: [-1.35, 0.3, 0.35],
  rearHip: [-0.8, -0.1, -0.4],
  leadKnee: [0.45, 0, 0],
  rearKnee: [1, 0, 0],
}
export const SAIYU_THROWS: readonly ThrowPerformance[] = [
  {
    id: 'saiyu-lever',
    name: 'Le grand levier',
    effect: 'staff',
    grip: 'prop',
    detail: { yaw: -0.65, anchor: 'prop', victim: 'knee' },
    beats: [
      { at: 0, attacker: BAR, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.34,
        attacker: LEVER,
        victim: {
          ...THROW_CAPTURE,
          body: [-0.55, 0.3, 0.1],
          leadHip: [-1, 0, 0.2],
          rearHip: [-0.8, 0, -0.2],
        },
        path: [0.1, 4.8, 0.22],
      },
      {
        at: 0.64,
        attacker: { ...LEVER, body: [0.35, -1.05, 0] },
        victim: { ...THROW_LAND, body: [-1.75, 0.5, 0.12] },
        path: [0.82, 4.2, -0.25],
      },
      { at: 0.8, attacker: BAR, victim: THROW_LAND, path: [1, 0, 0] },
      { at: 1, attacker: BAR, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [-0.65, 1.2, 0.85, 0.82],
      [0.65, 2.35, 1.35, 0.85],
      [-0.4, 0.85, 0.65, 0.8],
    ],
  },
  {
    id: 'saiyu-vault',
    name: 'La roue du singe',
    effect: 'staff',
    grip: 'prop',
    detail: { yaw: 0.5, anchor: 'prop', victim: 'torso' },
    beats: [
      { at: 0, attacker: BAR, victim: THROW_CAPTURE, path: [0, 0, 0] },
      {
        at: 0.3,
        attacker: VAULT,
        victim: { ...THROW_CAPTURE, body: [-0.3, -0.45, 0.15] },
        path: [0.05, 3.8, 0.2],
        actorPath: [2, 5, -0.4],
      },
      {
        at: 0.55,
        attacker: { ...VAULT, body: [-0.5, -1.15, -0.6] },
        victim: { ...THROW_LAND, body: [-2.25, 0.7, -0.15] },
        path: [0.65, 10, -0.35],
        actorPath: [4.5, 6.5, 0.35],
      },
      { at: 0.8, attacker: LEVER, victim: THROW_LAND, path: [1, 0, 0], actorPath: [0, 0, 0] },
      { at: 1, attacker: BAR, victim: THROW_LAND, path: [1, 0, 0] },
    ],
    camera: [
      [0.5, 1, 1, 0.8],
      [-0.95, 3.6, 1.9, 0.92],
      [0.75, 0.65, 0.6, 0.86],
    ],
  },
]
