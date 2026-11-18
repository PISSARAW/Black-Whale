import { Matrix4, Quaternion, Vector3, type Object3D } from 'three'

/** An anatomical pole follows the parent body, independently of a nearly straight hinge. */
export function combatBendDirection(root: Object3D, knee: boolean, direction: Vector3): Vector3 {
  root.parent!.updateWorldMatrix(true, false)
  const bend = new Vector3(0, 0, knee ? 1 : -1).transformDirection(root.parent!.matrixWorld)
  bend.addScaledVector(direction, -bend.dot(direction))
  if (bend.lengthSq() < 1e-6) bend.set(0, 1, 0).addScaledVector(direction, -direction.y)
  if (bend.lengthSq() < 1e-6) bend.set(1, 0, 0)
  return bend.normalize()
}
export function reachBasis(axis: Vector3, pole: Vector3): Quaternion {
  const z = axis.clone().normalize()
  const y = pole.clone().addScaledVector(z, -pole.dot(z)).normalize()
  if (y.lengthSq() < 0.5) y.set(1, 0, 0).addScaledVector(z, -z.x).normalize()
  const x = y.clone().cross(z).normalize()
  y.crossVectors(z, x)
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z))
}
