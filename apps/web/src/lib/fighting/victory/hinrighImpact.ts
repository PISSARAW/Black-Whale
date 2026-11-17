import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { HinrighVictoryPose } from './hinrighPose'
import { HINRIGH_SHOT } from './hinrighPose'
import { disposeVictoryObject, ease } from './resources'

export function createHinrighImpact() {
  const root = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({ color: 0x682a31, transparent: true, opacity: 0.8 })
  const geometry = new THREE.SphereGeometry(1, 8, 6)
  const flecks = Array.from({ length: 24 }, () => new THREE.Mesh(geometry, material))
  const stain = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), material)
  stain.rotation.x = -Math.PI / 2
  root.add(...flecks, stain)
  return {
    sync(context: VictoryContext, pose: HinrighVictoryPose) {
      const t = (context.age - HINRIGH_SHOT) / 42
      flecks.forEach((mesh, i) => {
        const angle = i * 2.39996
        mesh.visible = t >= 0 && t < 1
        mesh.position
          .copy(pose.target)
          .add(
            new THREE.Vector3(
              Math.cos(angle) * t * 0.55,
              Math.sin(angle) * t * 0.35 - t * t * 0.5,
              t * 0.2,
            ),
          )
        mesh.scale.set(0.012, 0.014, 0.045 * (1 - ease(t)))
        mesh.rotation.set(angle, angle / 2, angle)
      })
      stain.visible = t >= 1
      stain.position.set(context.victim.root.position.x, 0.016, context.victim.root.position.z)
      stain.scale.set(1 + ease((context.age - 402) / 60) * 0.6, 0.6, 1)
      context.add(root)
    },
    dispose: () => disposeVictoryObject(root),
  }
}
