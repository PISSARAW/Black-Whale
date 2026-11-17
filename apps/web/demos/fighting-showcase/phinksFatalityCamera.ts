import { Quaternion, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera } from 'three'
import { cinematicEase } from './cinematicEase'

export function phinksCamera(
  camera: PerspectiveCamera,
  options: { hero: Object3D; head: Object3D; fist: Vector3; age: number },
) {
  const { hero, head, fist, age } = options
  const face = head.getWorldPosition(new Vector3()),
    q = head.getWorldQuaternion(new Quaternion())
  const local = (p: Vector3) => p.applyQuaternion(q).add(face)
  camera.up.set(0, 1, 0)
  let shot: string
  if (age < 36) {
    shot = 'phinks-before-the-last-turn'
    camera.position.copy(local(new Vector3(0.025, 0.02, 0.9)))
    camera.lookAt(local(new Vector3(0.025, -0.02, 0.04)))
  } else if (age < 165) {
    shot = 'six-right-arm-revolutions'
    camera.position.set(hero.position.x + 0.15, 1.45, 3.8)
    camera.lookAt(hero.position.x + 0.04, 1.45, 0)
  } else if (age < 228) {
    shot = 'cyclotron-compression'
    camera.position.set(hero.position.x + 0.36, 1.55, 3.4 - cinematicEase((age - 165) / 63) * 0.25)
    camera.lookAt(hero.position.x + 0.04, 1.54, 0)
  } else if (age < 260) {
    shot = 'the-loaded-fist'
    camera.position.copy(fist).add(new Vector3(0.15, 0.11, 1.32))
    camera.lookAt(fist)
  } else if (age < 290) {
    shot = 'ripper-cyclotron-contact'
    camera.position.set(0.2, 1.35, 2.8)
    camera.lookAt(0.22, 1.24, 0)
  } else if (age < 420) {
    shot = 'one-punch-pulverization'
    camera.position.set(1.0 + cinematicEase((age - 290) / 130) * 0.65, 1.35, 6.3)
    camera.lookAt(0.65, 0.96, 0)
  } else {
    shot = 'phinks-victory-portrait'
    camera.position.copy(
      local(new Vector3(-0.08, 0.01, 0.94 - cinematicEase((age - 420) / 180) * 0.12)),
    )
    camera.lookAt(local(new Vector3(-0.08, -0.01, 0.05)))
  }
  const shake = age >= 270 && age < 310 ? Math.exp(-(age - 270) / 12) * 0.06 : 0
  camera.position.x += Math.sin(age * 2.7) * shake
  camera.position.y += Math.cos(age * 1.9) * shake
  camera.updateMatrixWorld(true)
  return shot
}
