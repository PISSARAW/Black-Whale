import { Quaternion, Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { stageFranklin } from './franklinFatalityPose'
import { cinematicEase } from './cinematicEase'

export function franklinCamera(
  camera: PerspectiveCamera,
  options: { pose: ReturnType<typeof stageFranklin>; age: number },
) {
  const { pose, age } = options,
    { hero, head } = pose
  const q = head.getWorldQuaternion(new Quaternion()),
    origin = head.getWorldPosition(new Vector3())
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  camera.up.set(0, 1, 0)
  let shot: string
  if (age < 75) {
    shot = 'ten-severed-fingertips'
    const muzzle = pose.muzzles[7],
      direction = pose.directions[7]
    camera.position
      .copy(muzzle)
      .addScaledVector(direction, 0.56 - cinematicEase(age / 75) * 0.07)
      .add(new Vector3(0, 0.015, 0.01))
    camera.lookAt(muzzle.clone().addScaledVector(direction, -0.015))
  } else if (age < 144) {
    shot = 'the-colossus-aims'
    camera.position.set(-2.6 + (age - 75) * 0.006, 0.8, 4.8)
    camera.lookAt(hero.position.x + 0.2, 1.4, 0)
  } else if (age < 204) {
    shot = 'double-machine-gun-opens'
    camera.position.copy(local(new Vector3(0.55, -0.3, 2.1)))
    camera.lookAt(local(new Vector3(0.06, -0.35, 0.15)))
  } else if (age < 276) {
    shot = 'crossfire-across-the-arena'
    camera.position.set(0.1, 1.45, 6.1)
    camera.lookAt(0.1, 1.3, 0)
  } else if (age < 350) {
    shot = 'nen-bullets-riddle-the-target'
    const target = pose.victim.getObjectByName('kurapika-head')!.getWorldPosition(new Vector3())
    camera.position.copy(target).add(new Vector3(-0.65, -0.3, 2.8))
    camera.lookAt(target.x, target.y - 0.35, 0)
  } else if (age < 420) {
    shot = 'the-last-bullet-and-the-fall'
    camera.position.set(0.4, 1.5, 6.0)
    camera.lookAt(0.65, 0.9, 0)
  } else {
    shot = 'franklin-in-the-gun-smoke'
    camera.position.copy(
      local(new Vector3(-0.08, 0.015, 1.12 - cinematicEase((age - 420) / 180) * 0.16)),
    )
    camera.lookAt(local(new Vector3(-0.08, -0.01, 0.04)))
  }
  if (age >= 156 && age < 350) {
    camera.position.y += Math.sin(age * 2.6) * 0.009
    camera.position.x += Math.cos(age * 1.9) * 0.007
  }
  camera.updateMatrixWorld(true)
  return shot
}
