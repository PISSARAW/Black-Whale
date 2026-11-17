import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { BonolenovVictoryPose } from './bonolenovPose'
import { BONOLENOV_IMPACT } from './bonolenovPose'
import { disposeVictoryObject, ease } from './resources'
import { localToHead } from './pose'

export function createBonolenovEffects() {
  const root = new THREE.Group()
  root.name = 'bonolenov-last-movement'
  const dark = new THREE.MeshBasicMaterial({ color: 0x0e0c10, side: THREE.DoubleSide })
  const bronze = new THREE.MeshBasicMaterial({
    color: 0xc4aa79,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })
  const holes = Array.from({ length: 6 }, () => {
    const hole = new THREE.Group()
    hole.add(
      new THREE.Mesh(new THREE.CircleGeometry(0.023, 16), dark),
      new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.003, 6, 16), bronze),
    )
    root.add(hole)
    return hole
  })
  const rings = Array.from({ length: 8 }, () => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.004, 5, 60), bronze)
    root.add(ring)
    return ring
  })
  const crater = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 1, 48),
    new THREE.MeshBasicMaterial({
      color: 0x302b2a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  )
  crater.rotation.x = -Math.PI / 2
  const dust = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x9c8b7c }),
    96,
  )
  dust.frustumCulled = false
  root.add(crater, dust)
  const dummy = new THREE.Object3D()
  return {
    root,
    sync(context: VictoryContext, pose: BonolenovVictoryPose) {
      const { hero, age } = context
      holes.forEach((hole, i) => {
        hole.visible = hero.root.visible
        hole.position.copy(
          localToHead(
            hero,
            new THREE.Vector3(i % 2 ? 0.08 : -0.08, -0.35 - Math.floor(i / 2) * 0.12, 0.17),
          ),
        )
        hole.quaternion.copy(hero.head.getWorldQuaternion(new THREE.Quaternion()))
      })
      rings.forEach((ring, i) => {
        const t = (age * 0.025 + i / rings.length) % 1
        ring.visible = age < 306 && hero.root.visible
        ring.position.copy(localToHead(hero, new THREE.Vector3(0, -0.4, 0.18 + t * 0.35)))
        ring.quaternion.copy(hero.head.getWorldQuaternion(new THREE.Quaternion()))
        ring.scale.setScalar(0.05 + t * 0.45)
      })
      const t = Math.max(0, (age - BONOLENOV_IMPACT) / 60)
      crater.visible = age >= BONOLENOV_IMPACT && age < 498
      crater.position.set(pose.contact.x + 0.25, 0.024, pose.contact.z)
      crater.scale.set(1.4 * ease(t * 4), 0.75 * ease(t * 4), 1)
      dust.count = t > 0 && t < 1.5 ? 96 : 0
      for (let i = 0; i < dust.count; i++) {
        const a = i * 2.4,
          speed = 0.4 + (i % 9) * 0.16
        dummy.position.set(
          pose.contact.x + Math.cos(a) * speed * t,
          Math.max(0.025, (1.6 + (i % 5) * 0.2) * t - 2.8 * t * t),
          pose.contact.z + Math.sin(a) * speed * t,
        )
        dummy.rotation.set(i + t * 3, i * 2, t * 4)
        dummy.scale.setScalar((0.025 + (i % 4) * 0.015) * (1 - ease((t - 0.7) / 0.8)))
        dummy.updateMatrix()
        dust.setMatrixAt(i, dummy.matrix)
      }
      dust.instanceMatrix.needsUpdate = true
    },
    dispose: () => disposeVictoryObject(root),
  }
}
