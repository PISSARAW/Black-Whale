import type { Vector3 } from 'three'
import { captureFootPlant, type FightRig } from './fightRig'

export type MotionPoint = readonly [x: number, y: number, z: number]

export interface FightMotionSnapshot {
  feet: readonly [MotionPoint, MotionPoint]
  pelvis: MotionPoint
  leadHand: MotionPoint
  rearHand: MotionPoint
}

export interface GoldenHeavyDiagnostics {
  plantedFootDrift: number
  pivotFootDrift: number
  pelvisTravel: number
  fistToContact: number
  planted: MotionPoint
  pivot: MotionPoint
  pelvis: MotionPoint
  fist: MotionPoint
  contact: MotionPoint
}

export function captureFightMotionSnapshot(rig: FightRig, facing: 1 | -1): FightMotionSnapshot {
  const { figure, legs } = rig.human
  const ground = figure.parent ?? figure
  const point = (part: { getWorldPosition(target: Vector3): Vector3 }): MotionPoint => {
    const local = ground.worldToLocal(part.getWorldPosition(rig.probe)).clone()
    return [local.x, local.y, local.z]
  }
  const feet = captureFootPlant(rig).positions.map(({ x, y, z }) => [x, y, z] as const) as [
    MotionPoint,
    MotionPoint,
  ]
  const hips = legs.map(point)
  const lead = facing === 1 ? 1 : 0
  const rear = facing === 1 ? 0 : 1
  return {
    feet,
    pelvis: midpoint(hips[0], hips[1]),
    leadHand: point(rig.wrists[lead]),
    rearHand: point(rig.wrists[rear]),
  }
}

/** Compare the current draw with the stance anchor and authored contact draw. */
export function goldenHeavyDiagnostics(
  current: FightMotionSnapshot,
  stance: FightMotionSnapshot,
  contact: FightMotionSnapshot,
  facing: 1 | -1,
): GoldenHeavyDiagnostics {
  const lead = facing === 1 ? 1 : 0
  const rear = facing === 1 ? 0 : 1
  return {
    plantedFootDrift: groundDistance(current.feet[lead], stance.feet[lead]),
    pivotFootDrift: groundDistance(current.feet[rear], stance.feet[rear]),
    pelvisTravel: distance(current.pelvis, stance.pelvis),
    fistToContact: distance(current.rearHand, contact.rearHand),
    planted: current.feet[lead],
    pivot: current.feet[rear],
    pelvis: current.pelvis,
    fist: current.rearHand,
    contact: contact.rearHand,
  }
}

export function goldenHeavyDiagnosticFailures(value: GoldenHeavyDiagnostics): string[] {
  const failures: string[] = []
  if (value.plantedFootDrift > 0.015) failures.push('planted-foot-drift')
  if (value.pivotFootDrift > 0.06) failures.push('pivot-foot-translation')
  if (value.fistToContact > 0.04) failures.push('fist-off-contact')
  return failures
}

function midpoint(a: MotionPoint, b: MotionPoint): MotionPoint {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
}

function groundDistance(a: MotionPoint, b: MotionPoint): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

function distance(a: MotionPoint, b: MotionPoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}
