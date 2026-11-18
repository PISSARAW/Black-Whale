import { Quaternion, type Euler, type Object3D } from 'three'

const FRAMES = new WeakMap<Object3D, { from: Euler; seconds: number }>()
const SPEED: Record<string, number> = {
  head: 6,
  chest: 8,
  shoulder: 30,
  elbow: 36,
  wrist: 14,
  hip: 16,
  knee: 22,
  ankle: 10,
}

/** One outgoing displayed pose is the reference for every solve in this frame. */
export function beginHumanJointFrame(part: Object3D, from: Euler, seconds: number): void {
  FRAMES.set(part, { from, seconds })
}
export function endHumanJointFrame(part: Object3D): void {
  FRAMES.delete(part)
}

/** Bound angular travel along the valid Euler envelope, including phase cuts and IK branch changes. */
export function keepHumanJointMotion(part: Object3D, kind: string): void {
  const frame = FRAMES.get(part)
  if (!frame) return
  for (let ancestor: Object3D | null = part; ancestor; ancestor = ancestor.parent)
    if (!ancestor.visible) return
  const rotation = part.rotation,
    from = frame.from
  const reference = new Quaternion().setFromEuler(from)
  const travel = reference.angleTo(part.quaternion)
  const budget = frame.seconds * (SPEED[kind] ?? 12)
  if (travel <= budget || travel < 1e-10) return
  const to = rotation.clone()
  const apply = (amount: number) =>
    rotation.set(
      from.x + (to.x - from.x) * amount,
      from.y + (to.y - from.y) * amount,
      from.z + (to.z - from.z) * amount,
    )
  let low = 0,
    high = 1
  for (let i = 0; i < 12; i++) {
    const amount = (low + high) / 2
    apply(amount)
    if (reference.angleTo(part.quaternion) > budget) high = amount
    else low = amount
  }
  apply(low)
}
