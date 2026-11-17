import { Vector3 } from 'three'
import type { Object3D } from 'three'
const point = (node: Object3D) => node.getWorldPosition(new Vector3())
function aim(node: Object3D, child: Object3D, target: Vector3) {
  node.parent!.updateWorldMatrix(true, true)
  const direction = node.parent!.worldToLocal(target.clone()).sub(node.position).normalize()
  node.quaternion.setFromUnitVectors(child.position.clone().normalize(), direction)
  node.updateWorldMatrix(true, true)
}

/** Two real arm segments meet the card grip without stretching the figure. */
export function reachCinematicHand(
  root: Object3D,
  options: { side: 'left' | 'right'; target: Vector3; pole: Vector3 },
) {
  const { side, target, pole } = options
  const upper = root.getObjectByName(`shoulder-${side}`)!
  const lower = root.getObjectByName(`elbow-${side}`)!
  const hand = root.getObjectByName(`hand-${side}`)!
  const origin = point(upper),
    vector = target.clone().sub(origin)
  const a = point(lower).distanceTo(origin),
    b = point(hand).distanceTo(point(lower))
  const length = Math.min(a + b - 0.001, Math.max(0.001, vector.length()))
  const direction = vector.normalize()
  const along = (a * a - b * b + length * length) / (2 * length)
  const bend = pole.clone().sub(origin)
  bend.addScaledVector(direction, -bend.dot(direction)).normalize()
  const elbow = origin
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, a * a - along * along)))
  aim(upper, lower, elbow)
  aim(lower, hand, origin.clone().addScaledVector(direction, length))
  return point(hand).distanceTo(target)
}
