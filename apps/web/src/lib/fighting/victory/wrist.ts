import { Quaternion, type Object3D } from 'three'
import { keepHumanJoint } from '$lib/tour/humanJointLimits'

/** Share weapon orientation between forearm pronation and wrist, without moving a bone endpoint. */
export function aimCinematicWrist(wrist: Object3D, world: Quaternion): void {
  const forearm = wrist.parent!
  const start = forearm.rotation.clone()
  let best = { arm: start, wrist: wrist.rotation.clone(), score: Infinity }
  for (let step = -12; step <= 12; step++) {
    forearm.rotation.set(start.x, step * 0.05, start.z)
    keepHumanJoint(forearm)
    wrist.quaternion.copy(forearm.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    keepHumanJoint(wrist, 'wrist')
    const error = wrist.getWorldQuaternion(new Quaternion()).angleTo(world)
    const score = error + Math.abs(forearm.rotation.y - start.y) * 0.0001
    if (score < best.score)
      best = { arm: forearm.rotation.clone(), wrist: wrist.rotation.clone(), score }
  }
  forearm.rotation.copy(best.arm)
  wrist.rotation.copy(best.wrist)
}
