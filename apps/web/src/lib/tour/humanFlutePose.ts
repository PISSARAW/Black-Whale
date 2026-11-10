import type { Group, Object3D } from 'three'
import { CANON } from './humanProportions'

/** Solve the two arm bones towards the keys without breaking the shoulder joints. */
export function poseFluteArms(rig: { head: Object3D; arms: Group[]; elbows: Group[] }): void {
  rig.head.rotation.x = 0.04
  rig.arms.forEach((arm, index) => {
    const target = arm.position.clone().set(index === 0 ? -0.43 : -0.08, 1.58, 0.26)
    const shoulder = arm.position.clone()
    const direction = target.clone().sub(shoulder)
    const distance = direction.length()
    direction.normalize()
    const upper = CANON.upperArm,
      lower = CANON.forearm
    const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
    const bend = Math.sqrt(Math.max(0, upper * upper - along * along))
    const normal = direction.clone().set(-direction.y, direction.x, 0).normalize()
    const elbow = shoulder
      .clone()
      .addScaledVector(direction, along)
      .addScaledVector(normal, bend * (index === 0 ? 1 : -1))
    const down = direction.clone().set(0, -1, 0)
    arm.quaternion.setFromUnitVectors(down, elbow.clone().sub(shoulder).normalize())
    const forearm = target.sub(elbow).normalize().applyQuaternion(arm.quaternion.clone().invert())
    rig.elbows[index].quaternion.setFromUnitVectors(down, forearm)
  })
}

/** Signature pieces are attached after the rest pose, before animation is built. */
export function raiseConcertFlute(figure: Group): void {
  const flute = figure.getObjectByName('signature-flute')
  if (!flute) return
  flute.position.set(-0.26, 1.58, 0.26)
  flute.rotation.set(0, 0, Math.PI / 2)
  flute.scale.y = 2.35
}
