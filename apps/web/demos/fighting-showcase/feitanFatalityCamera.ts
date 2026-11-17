import { Quaternion, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera } from 'three'
import { solarEase } from './feitanFatalityPose'

export function feitanFatalityCamera(
  camera: PerspectiveCamera,
  options: { hero: Object3D; victim: Object3D; head: Object3D; age: number },
) {
  const { hero, victim, head, age } = options
  const origin = head.getWorldPosition(new Vector3()),
    q = head.getWorldQuaternion(new Quaternion())
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  camera.up.set(0, 1, 0)
  let shot: string
  if (age < 90) {
    shot = 'pain-becomes-anger'
    camera.position.copy(local(new Vector3(0.1, 0.015, 0.92 - solarEase(age / 90) * 0.18)))
    camera.lookAt(local(new Vector3(0, -0.025, 0.03)))
  } else if (age < 180) {
    shot = 'pain-packer-deployment'
    camera.position.set(hero.position.x + 0.7 - solarEase((age - 90) / 90) * 1.1, 1.25, 3.3)
    camera.lookAt(hero.position.x, 1.0, 0)
  } else if (age < 270) {
    shot = 'rising-sun-revelation'
    camera.position.set(hero.position.x + 2, 1.1, 8.6 - solarEase((age - 180) / 90) * 0.8)
    camera.lookAt(hero.position.x + 0.85, 2.18, 0)
  } else if (age < 330) {
    shot = 'solar-heat-engulfs-hisoka'
    const face = victim.getObjectByName('manga-head:hisoka')!.getWorldPosition(new Vector3())
    camera.position.copy(face).add(new Vector3(0.45, -0.35, 3.9))
    camera.lookAt(face.x, face.y - 0.55, face.z)
    camera.position.x += Math.sin(age * 2.1) * Math.exp(-(age - 270) / 25) * 0.045
  } else if (age < 420) {
    shot = 'ashes-beneath-the-sun'
    camera.position.set(hero.position.x + 2.5 - (age - 330) / 120, 1.6, 8.7)
    camera.lookAt(hero.position.x + 1.1, 2.05, 0)
  } else {
    shot = 'pain-packer-final-portrait'
    camera.position.copy(local(new Vector3(-0.06, 0.035, 1.3 - solarEase((age - 420) / 180) * 0.3)))
    camera.lookAt(local(new Vector3(-0.06, 0.025, 0.06)))
  }
  camera.updateMatrixWorld(true)
  return shot
}
