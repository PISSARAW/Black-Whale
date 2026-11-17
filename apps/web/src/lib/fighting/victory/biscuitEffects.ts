import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { BiscuitVictoryPose } from './biscuitPose'
import { disposeVictoryObject, ease } from './resources'
import { BISCUIT_IMPACT } from './biscuitForms'
import { BISCUIT_LANDING } from './biscuitFall'

export function createBiscuitVictoryEffects() {
  const root = new THREE.Group()
  root.name = 'biscuit-one-punch-impact'
  const rings = Array.from(
    { length: 3 },
    () =>
      new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1, 64),
        new THREE.MeshBasicMaterial({
          color: 0xffe5c9,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      ),
  )
  root.add(...rings)
  const debris = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x8e7a6a }),
    72,
  )
  debris.frustumCulled = false
  root.add(debris)
  const points: THREE.Vector3[] = []
  for (let i = 0; i < 15; i++) {
    const a = i * 2.4
    let previous = new THREE.Vector3()
    for (let j = 1; j <= 4; j++) {
      const next = new THREE.Vector3(Math.cos(a + j * 0.045) * j * 0.26, 0, Math.sin(a) * j * 0.18)
      points.push(previous, next)
      previous = next
    }
  }
  const cracks = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x201b21 }),
  )
  root.add(cracks)
  const dummy = new THREE.Object3D()
  return {
    root,
    sync(context: VictoryContext, pose: BiscuitVictoryPose) {
      const { age } = context
      const t = Math.max(0, (age - BISCUIT_IMPACT) / 60)
      rings.forEach((ring, i) => {
        ring.visible = context.comfort.flashes && age >= BISCUIT_IMPACT && t < 0.42 + i * 0.07
        ring.position.copy(pose.contact)
        ring.rotation.set(0, Math.PI / 2, i * 0.3)
        ring.scale.setScalar(0.1 + t * (4 + i))
        ring.material.opacity = Math.max(0, 1 - t * 2)
      })
      const land = Math.max(0, (age - BISCUIT_LANDING) / 60)
      cracks.visible = age >= BISCUIT_LANDING
      cracks.position.copy(pose.landingPoint)
      cracks.scale.setScalar(ease(land * 8))
      debris.count = age >= BISCUIT_LANDING && land < 1.5 ? 72 : 0
      for (let i = 0; i < debris.count; i++) {
        const a = i * 2.4,
          speed = 0.5 + (i % 7) * 0.12
        dummy.position
          .copy(cracks.position)
          .add(
            new THREE.Vector3(
              Math.cos(a) * land * speed,
              Math.max(0, (1 + (i % 4) * 0.2) * land - 2.5 * land * land),
              Math.sin(a) * land * speed,
            ),
          )
        dummy.rotation.set(i, i + land * 4, land * 3)
        dummy.scale.setScalar((0.03 + (i % 4) * 0.017) * (1 - ease((land - 0.9) / 0.6)))
        dummy.updateMatrix()
        debris.setMatrixAt(i, dummy.matrix)
      }
      debris.instanceMatrix.needsUpdate = true
    },
    dispose: () => disposeVictoryObject(root),
  }
}
