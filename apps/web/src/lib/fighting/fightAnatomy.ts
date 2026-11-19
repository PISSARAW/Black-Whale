import type { Euler, Object3D } from 'three'
import type { FightRig } from './fightRig'
import type { Turn } from './fightPose'

type Range = readonly [number, number]
export const COMBAT_JOINT_RANGES = {
  head: [
    [-0.8, 0.7],
    [-1.3, 1.3],
    [-0.6, 0.6],
  ],
  chest: [
    [-0.6, 1.4],
    [-1, 1],
    [-0.6, 0.6],
  ],
  shoulder: [
    [-3.3, 1.1],
    [-1.4, 1.4],
    [-1.3, 3],
  ],
  elbow: [
    [-2.6, 0],
    [-0.1, 0.1],
    [-0.1, 0.1],
  ],
  wrist: [
    [-1.35, 1.25],
    [-1, 1],
    [-0.7, 0.7],
  ],
  hip: [
    [-2.4, 0.7],
    [-0.8, 0.8],
    [-0.45, 1.5],
  ],
  knee: [
    [0, 2.6],
    [-0.04, 0.04],
    [-0.04, 0.04],
  ],
  ankle: [
    [-0.9, 0.9],
    [-0.35, 0.35],
    [-0.35, 0.35],
  ],
} as const satisfies Record<string, readonly [Range, Range, Range]>
export type CombatJoint = keyof typeof COMBAT_JOINT_RANGES

/** Resolve the nearest equivalent Euler branch before limiting a human joint. */
function bounded(value: number, range: Range): number {
  const centre = (range[0] + range[1]) / 2
  const equivalent = value + Math.round((centre - value) / (2 * Math.PI)) * 2 * Math.PI
  return Math.min(range[1], Math.max(range[0], equivalent))
}
export function anatomicalTurn(turn: Turn, kind: CombatJoint, side = 1): Turn {
  const ranges = COMBAT_JOINT_RANGES[kind]
  const outward = kind === 'shoulder' || kind === 'hip' ? side : 1
  return [
    bounded(turn[0], ranges[0]),
    bounded(turn[1], ranges[1]),
    bounded(turn[2] * outward, ranges[2]) * outward,
  ]
}
export function constrainCombatJoint(part: Object3D, kind: CombatJoint): void {
  const side = part.name.endsWith('-left') ? -1 : 1
  applyTurn(
    part.rotation,
    anatomicalTurn([part.rotation.x, part.rotation.y, part.rotation.z], kind, side),
  )
}
function applyTurn(rotation: Euler, turn: Turn): void {
  rotation.set(...turn)
}
export function constrainFightRig(rig: FightRig): void {
  constrainCombatJoint(rig.chest, 'chest')
  constrainCombatJoint(rig.human.head, 'head')
  const pairs = [
    [rig.human.arms, 'shoulder'],
    [rig.elbows, 'elbow'],
    [rig.wrists, 'wrist'],
    [rig.human.legs, 'hip'],
    [rig.human.knees, 'knee'],
    [rig.ankles, 'ankle'],
  ] as const
  for (const [parts, kind] of pairs) for (const part of parts) constrainCombatJoint(part, kind)
}
