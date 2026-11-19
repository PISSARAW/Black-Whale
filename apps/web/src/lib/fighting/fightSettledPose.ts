import type { Object3D, Vector3 } from 'three'
import type { FightRig } from './fightRig'
import type { FightPose, Turn } from './fightPose'

interface Observation {
  parts: Partial<Record<keyof FightPose, Object3D>>
  baseline: FightPose
  root: Vector3
  facing: 1 | -1
  accept: (pose: FightPose) => void
}
const OBSERVED = new WeakMap<FightRig, Observation>()
/** Observe offsets from a single idle base; keep head tracking outside pose feedback. */
export function beginSettledPose(
  rig: FightRig,
  facing: 1 | -1,
  accept?: (pose: FightPose) => void,
): void {
  if (!accept) return
  const lead = facing === 1 ? 1 : 0,
    rear = 1 - lead,
    h = rig.human
  const parts = {
    body: h.figure,
    chest: rig.chest,
    leadShoulder: h.arms[lead],
    rearShoulder: h.arms[rear],
    leadElbow: rig.elbows[lead],
    rearElbow: rig.elbows[rear],
    leadWrist: rig.wrists[lead],
    rearWrist: rig.wrists[rear],
    leadHip: h.legs[lead],
    rearHip: h.legs[rear],
    leadKnee: h.knees[lead],
    rearKnee: h.knees[rear],
  }
  const baseline = Object.fromEntries(
    Object.entries(parts).map(([k, p]) => [k, [p.rotation.x, p.rotation.y, p.rotation.z]]),
  ) as FightPose
  OBSERVED.set(rig, { parts, baseline, root: h.figure.position.clone(), facing, accept })
}
export function settleObservedPose(rig: FightRig): void {
  const o = OBSERVED.get(rig)
  if (!o) return
  const pose: FightPose = {}
  for (const [key, part] of Object.entries(o.parts)) {
    const joint = key as keyof FightPose,
      before = o.baseline[joint]!,
      p = part!
    pose[joint] = [
      p.rotation.x - before[0],
      (p.rotation.y - before[1]) * o.facing,
      (p.rotation.z - before[2]) * o.facing,
    ] as Turn
  }
  const root = rig.human.figure.position.clone().sub(o.root)
  pose.root = [root.x * o.facing, root.y, root.z]
  o.accept(pose)
}
