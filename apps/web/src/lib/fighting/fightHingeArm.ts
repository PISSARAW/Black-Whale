import type { Matrix4, Object3D, Quaternion, Vector3 } from 'three'

/**
 * Re-express a solved arm chain as a human one, without moving the hand.
 *
 * An IK built from `setFromUnitVectors` reaches its target with whatever
 * rotation is shortest, so the elbow ends up bent sideways and twisted — a
 * forearm a real elbow cannot produce. Here the upper arm keeps pointing at the
 * same elbow, but turns about its own axis until the forearm lies in its
 * bending plane; the elbow is then a pure hinge (local x < 0 folds it forward,
 * `fightPose.ts`). Shoulder, elbow and hand land exactly where they were.
 *
 * The limb builder scales the arm along its own axis only (`arm.scale.y`),
 * which keeps that bending plane a plane: the hinge stays exact.
 */
export interface HingeScratch {
  shoulder: Vector3
  elbow: Vector3
  hand: Vector3
  axis: Vector3
  bend: Vector3
  side: Vector3
  local: Vector3
  basis: Matrix4
  world: Quaternion
  parent: Quaternion
}

export interface ArmChain {
  arm: Object3D
  elbow: Object3D
  hand: Object3D
}

export function hingeArm({ arm, elbow, hand }: ArmChain, s: HingeScratch): void {
  arm.getWorldPosition(s.shoulder)
  elbow.getWorldPosition(s.elbow)
  hand.getWorldPosition(s.hand)
  // Local -y runs down the upper arm; local +z is the side the forearm folds to.
  s.axis.copy(s.shoulder).sub(s.elbow).normalize()
  s.bend.copy(s.hand).sub(s.elbow)
  s.bend.addScaledVector(s.axis, -s.bend.dot(s.axis))
  if (s.bend.lengthSq() < 1e-10) return // a straight arm is already a hinge
  s.bend.normalize()
  s.side.crossVectors(s.axis, s.bend)
  s.basis.makeBasis(s.side, s.axis, s.bend)
  s.world.setFromRotationMatrix(s.basis)
  arm.parent!.getWorldQuaternion(s.parent).invert()
  arm.quaternion.copy(s.parent).multiply(s.world)
  arm.updateMatrixWorld(true)
  // The hand, seen from the upper arm, now lies in its y–z plane: fold to it.
  arm.worldToLocal(s.local.copy(s.hand)).sub(elbow.position)
  const turn = Math.atan2(s.local.z, s.local.y) - Math.atan2(hand.position.z, hand.position.y)
  const fold = Math.atan2(Math.sin(turn), Math.cos(turn))
  elbow.rotation.set(fold, 0, 0)
}
