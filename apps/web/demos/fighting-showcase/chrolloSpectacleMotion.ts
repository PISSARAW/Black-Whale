import { Box3, Mesh, Vector3 } from 'three'
import type { BufferGeometry, Object3D } from 'three'

const cloth = new WeakMap<
  Mesh,
  { source: BufferGeometry; moving: BufferGeometry; positions: Float32Array }
>()

export function moveChrolloFromBlast(root: Object3D, age: number) {
  const start = root.position.clone()
  const restores: Array<() => void> = [() => root.position.copy(start)]
  const walk = Math.max(0, Math.min(1, (age - 300) / 120))
  const stride = Math.sin(walk * Math.PI * 4)
  const forward = new Vector3(0, 0, 1).applyQuaternion(root.quaternion)
  root.position.addScaledVector(forward, walk * 0.9)
  root.position.y += Math.abs(stride) * 0.018
  for (const [name, sign] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    for (const joint of ['hip', 'knee']) {
      const limb = root.getObjectByName(`${joint}-${name}`)!
      const rotation = limb.quaternion.clone()
      restores.push(() => limb.quaternion.copy(rotation))
      limb.rotation.x = joint === 'hip' ? stride * sign * 0.3 : Math.max(0, -stride * sign) * 0.48
    }
  }
  for (const side of ['left', 'right']) {
    const hip = root.getObjectByName(`hip-${side}`)!
    const knee = root.getObjectByName(`knee-${side}`)!
    const foot = knee.children[1]
    const rotation = foot.quaternion.clone()
    restores.push(() => foot.quaternion.copy(rotation))
    foot.rotation.x = -hip.rotation.x - knee.rotation.x
  }
  const t = Math.max(0, (age - 180) / 60)
  const gust = age >= 180 ? Math.exp(-t * 0.8) * Math.sin(t * 7) * 0.1 : 0
  root.traverse((node) => {
    if (!(node instanceof Mesh) || !/chrollo-(long-cross-coat|lower-coat-crosses)/.test(node.name))
      return
    let held = cloth.get(node)
    if (!held) {
      held = {
        source: node.geometry,
        moving: node.geometry.clone(),
        positions: Float32Array.from(node.geometry.attributes.position.array),
      }
      cloth.set(node, held)
    }
    node.geometry = held.moving
    const pos = held.moving.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = held.positions[i * 3],
        y = held.positions[i * 3 + 1],
        z = held.positions[i * 3 + 2]
      const hem = Math.max(0, 0.8 - y) / 0.8
      pos.setXYZ(
        i,
        x + Math.sin(age * 0.15 + x * 8) * gust * hem,
        y,
        z - (gust + Math.abs(stride) * 0.025) * hem,
      )
    }
    pos.needsUpdate = true
    restores.push(() => {
      node.geometry = held!.source
    })
  })
  root.updateWorldMatrix(true, true)
  const feet = ['left', 'right'].map((side) => root.getObjectByName(`knee-${side}`)!.children[1])
  const floor = Math.min(...feet.map((foot) => new Box3().setFromObject(foot).min.y))
  root.position.y -= floor - 0.01
  root.updateWorldMatrix(true, true)
  return {
    distance: walk * 0.9,
    gust,
    restore: () => {
      restores.reverse().forEach((restore) => restore())
      root.updateWorldMatrix(true, true)
    },
  }
}
