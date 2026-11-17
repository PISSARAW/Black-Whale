import { Quaternion, Vector3 } from 'three'
import type { Object3D, PerspectiveCamera } from 'three'

const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}
export function fatalityCamera(
  camera: PerspectiveCamera,
  options: { hero: Object3D; victim: Object3D; head: Object3D; age: number },
) {
  const { hero, victim, head, age } = options
  const q = head.getWorldQuaternion(new Quaternion()),
    origin = head.getWorldPosition(new Vector3())
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  camera.up.set(0, 1, 0)
  let shot: string
  if (age < 75) {
    shot = 'chain-in-the-fist'
    const hand = hero.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
    camera.position.copy(hand).add(new Vector3(0.16, 0.06, 0.95 - ease(age / 75) * 0.15))
    camera.lookAt(hand)
  } else if (age < 215) {
    shot = 'suspended-prisoner'
    const chest = victim.getObjectByName('torso')!.getWorldPosition(new Vector3())
    const t = ease((age - 75) / 140)
    camera.position.set(chest.x + 1.05 - t * 2, Math.max(1, chest.y - 0.35), 4.2)
    camera.lookAt(chest.x, chest.y - 0.1, 0)
  } else if (age < 255) {
    shot = 'the-pull'
    camera.position.copy(local(new Vector3(0.12, -0.3, 1.7)))
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(0.08, -0.38, 0.14)))
  } else if (age < 285) {
    shot = 'steel-snap'
    const target = victim.getObjectByName('torso')!.getWorldPosition(new Vector3())
    camera.position.copy(target).add(new Vector3(0.45, 0.2, 2.25))
    camera.lookAt(target)
    camera.position.x += Math.sin(age * 3) * Math.exp(-(age - 255) / 8) * 0.07
  } else if (age < 360) {
    shot = 'the-fall'
    const x = (hero.position.x + victim.position.x) / 2
    camera.position.set(x + 0.3, 1.45, 6.3)
    camera.lookAt(x + 0.3, 0.8, 0)
    camera.position.y += Math.sin(age * 2) * Math.exp(-Math.abs(age - 330) / 10) * 0.08
  } else {
    shot = 'scarlet-verdict'
    const t = ease((age - 360) / 240)
    camera.position.copy(local(new Vector3(0.005, 0.01, 0.92 - t * 0.3)))
    camera.up.set(0, 1, 0).applyQuaternion(q)
    camera.lookAt(local(new Vector3(0.005, -0.004, 0.07)))
  }
  camera.updateMatrixWorld(true)
  return shot
}
