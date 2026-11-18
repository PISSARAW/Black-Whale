import { Quaternion, Vector3, type Object3D } from 'three'

export interface LimbChain {
  root: Object3D
  hinge: Object3D
  end: Object3D
}

/** Solve a two-bone chain in its current bend plane; never extend or resize a bone. */
export function reachLimb(chain: LimbChain, target: Vector3, weight = 1): number {
  const root = chain.root.getWorldPosition(new Vector3())
  const hinge = chain.hinge.getWorldPosition(new Vector3())
  const end = chain.end.getWorldPosition(new Vector3())
  const upper = root.distanceTo(hinge),
    lower = hinge.distanceTo(end)
  if (upper < 1e-5 || lower < 1e-5) return end.distanceTo(target)
  const direction = target.clone().sub(root)
  const distance = Math.max(
    Math.abs(upper - lower) + 0.001,
    Math.min(upper + lower - 0.001, direction.length()),
  )
  direction.normalize()
  if (direction.lengthSq() < 0.5) return end.distanceTo(target)
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
  const bend = hinge
    .clone()
    .sub(root)
    .addScaledVector(direction, -hinge.clone().sub(root).dot(direction))
  if (bend.lengthSq() < 1e-6) bend.crossVectors(direction, new Vector3(0, 0, 1))
  if (bend.lengthSq() < 1e-6) bend.set(1, 0, 0)
  const elbow = root
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend.normalize(), Math.sqrt(Math.max(0, upper * upper - along * along)))
  rotateToward(chain.root, { from: hinge.sub(root), to: elbow.sub(root) }, weight)
  const pivot = chain.hinge.getWorldPosition(new Vector3())
  const solved = root.clone().addScaledVector(direction, distance)
  rotateToward(
    chain.hinge,
    {
      from: chain.end.getWorldPosition(new Vector3()).sub(pivot),
      to: solved.sub(pivot),
    },
    weight,
  )
  return chain.end.getWorldPosition(new Vector3()).distanceTo(target)
}

function rotateToward(joint: Object3D, vectors: { from: Vector3; to: Vector3 }, weight: number) {
  const turn = new Quaternion().setFromUnitVectors(vectors.from.normalize(), vectors.to.normalize())
  const parent = joint.parent!.getWorldQuaternion(new Quaternion())
  turn.premultiply(parent.clone().invert()).multiply(parent)
  turn.slerp(new Quaternion(), 1 - Math.min(1, Math.max(0, weight)))
  joint.quaternion.premultiply(turn)
  joint.updateWorldMatrix(false, true)
}
