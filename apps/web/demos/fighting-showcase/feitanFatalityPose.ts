import { Quaternion, Vector3 } from 'three'
import type { Object3D, Scene } from 'three'

export const solarEase = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}
const rest = new WeakMap<Object3D, Vector3>()
export function stageFeitanFatality(scene: Scene, age: number) {
  const head = scene.getObjectByName('manga-head:feitan-portor')!
  const enemyHead = scene.getObjectByName('manga-head:hisoka')!
  const hero = scene.children.find((n) => n.getObjectByName(head.name) === head)!
  const victim = scene.children.find((n) => n.getObjectByName(enemyHead.name) === enemyHead)!
  const restores: Array<() => void> = []
  const save = (node: Object3D) => {
    const p = node.position.clone(),
      q = node.quaternion.clone(),
      s = node.scale.clone(),
      v = node.visible
    restores.push(() => {
      node.position.copy(p)
      node.quaternion.copy(q)
      node.scale.copy(s)
      node.visible = v
    })
  }
  for (const root of [hero, victim]) {
    save(root)
    root.rotation.set(0, root === hero ? -0.12 : -0.4, 0)
    const chest = root.getObjectByName('fight-chest')!
    const figure = chest.parent!
    const resting = rest.get(figure) ?? figure.position.clone()
    rest.set(figure, resting)
    for (const node of [figure, chest, root === hero ? head : enemyHead]) {
      save(node)
      node.rotation.set(0, 0, 0)
    }
    figure.position.copy(resting)
    chest.position.set(0, 0, 0)
    for (const side of ['left', 'right'])
      for (const name of ['shoulder', 'elbow', 'hand', 'hip', 'knee']) {
        const joint = root.getObjectByName(`${name}-${side}`)!
        save(joint)
        joint.rotation.set(0, 0, 0)
      }
    root.traverse((n) => {
      if (n.name.startsWith('nen-')) {
        save(n)
        n.visible = false
      }
    })
  }
  hero.position.y = 0
  victim.position.set(hero.position.x + 2.6, 0, 0)
  victim.getObjectByName('fight-chest')!.rotation.x = -solarEase((age - 270) / 90) * 0.24
  for (const side of ['left', 'right']) {
    victim.getObjectByName(`shoulder-${side}`)!.rotation.z =
      (side === 'left' ? -1 : 1) * solarEase((age - 255) / 65) * 1.1
    victim.getObjectByName(`elbow-${side}`)!.rotation.x = -solarEase((age - 255) / 65) * 0.7
  }
  hero.updateWorldMatrix(true, true)
  const rig = (jointName: string, target: Object3D, offset = new Vector3()) => {
    const joint = hero.getObjectByName(`${jointName}:combat-joint`)
    if (!joint?.parent) return
    save(joint)
    target.updateWorldMatrix(true, false)
    joint.parent.updateWorldMatrix(true, false)
    joint.position.copy(joint.parent.worldToLocal(offset.applyMatrix4(target.matrixWorld)))
    joint.quaternion.copy(
      joint.parent
        .getWorldQuaternion(new Quaternion())
        .invert()
        .multiply(target.getWorldQuaternion(new Quaternion())),
    )
    joint.scale.copy(
      target.getWorldScale(new Vector3()).divide(joint.parent.getWorldScale(new Vector3())),
    )
    const hood = jointName.endsWith('hood')
    const deployment = solarEase((age - (hood ? 142 : 90)) / (hood ? 26 : 50))
    joint.scale.multiplyScalar(Math.max(0.001, deployment))
    joint.visible = age >= 90
  }
  rig('pain-packer-hood', head)
  rig('pain-packer-chest', hero.getObjectByName('torso')!, new Vector3(0, 0.22, 0))
  const hip = hero.getObjectByName('hip-left')!
  rig('pain-packer-coat', hip.parent!, new Vector3(0, hip.position.y + 0.07, 0))
  for (const side of ['left', 'right']) {
    rig(`pain-packer-arm-${side}`, hero.getObjectByName(`shoulder-${side}`)!)
    rig(`pain-packer-elbow-${side}`, hero.getObjectByName(`elbow-${side}`)!)
  }
  head.visible = age < 160
  if (age >= 420) victim.visible = false
  hero.updateWorldMatrix(true, true)
  victim.updateWorldMatrix(true, true)
  return {
    hero,
    victim,
    head,
    restore: () => {
      restores.reverse().forEach((r) => r())
      hero.updateWorldMatrix(true, true)
      victim.updateWorldMatrix(true, true)
    },
  }
}
