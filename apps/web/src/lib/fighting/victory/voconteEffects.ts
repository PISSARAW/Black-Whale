import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { VoconteVictoryPose } from './vocontePose'
import { disposeVictoryObject, ease } from './resources'

const PASSAGES = [
  [90, 'A'],
  [96, 'B'],
  [156, 'A'],
  [162, 'B'],
  [246, 'B'],
  [252, 'A'],
] as const
export function createVoconteEffects() {
  const root = new THREE.Group(),
    cracks = new THREE.Group()
  const debris = Array.from({ length: 28 }, (_, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 0.025),
      new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0x702b34 : 0x59636a }),
    )
    root.add(mesh)
    return mesh
  })
  const rings = PASSAGES.flatMap(() =>
    Array.from({ length: 3 }, () => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.018, 5, 32),
        new THREE.MeshBasicMaterial({ color: 0x8ee1c8, transparent: true, depthWrite: false }),
      )
      ring.rotation.y = Math.PI / 2
      root.add(ring)
      return ring
    }),
  )
  for (let i = 0; i < 12; i++) {
    const angle = i * 2.4,
      length = 0.3 + (i % 4) * 0.15
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * length, 0.002, Math.sin(angle) * length),
      new THREE.Vector3(
        Math.cos(angle + 0.2) * length * 1.5,
        0.004,
        Math.sin(angle + 0.2) * length * 1.5,
      ),
    ]
    cracks.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0x090b0c }),
      ),
    )
  }
  root.add(cracks)
  return {
    root,
    sync(context: VictoryContext, pose: VoconteVictoryPose) {
      const elapsed = context.age - (pose.landingFrame ?? 600),
        t = Math.max(0, elapsed) / 60
      const landing = pose.fall?.landingPoint ?? new THREE.Vector3()
      cracks.visible = elapsed >= 0
      cracks.position.copy(landing)
      cracks.position.y = 0.019
      cracks.scale.setScalar(ease(elapsed / 12))
      debris.forEach((piece, i) => {
        const angle = i * 2.4,
          speed = 0.6 + (i % 5) * 0.3
        piece.visible = elapsed >= 0 && elapsed < 48
        piece.position
          .copy(landing)
          .add(
            new THREE.Vector3(
              Math.cos(angle) * speed * t,
              Math.max(0, t * (1 + (i % 3)) - 5 * t * t),
              Math.sin(angle) * speed * t,
            ),
          )
        piece.rotation.set(i + t * 3, i * 0.7 + t * 2, i * 0.4)
        piece.scale.setScalar(1 + (i % 3))
      })
      rings.forEach((ring, i) => {
        const [age, id] = PASSAGES[Math.floor(i / 3)],
          phase = (context.age - age + 6 - (i % 3) * 3) / 24
        ring.visible = context.comfort.flashes && phase >= 0 && phase < 1
        ring.position.set(
          id === 'A' ? pose.layout.a : pose.layout.b,
          (id === 'A' ? 0 : pose.layout.elevation) + pose.layout.height * 0.5,
          0,
        )
        ring.scale.set(
          pose.layout.width * (0.32 + phase * 0.12),
          pose.layout.height * (0.32 + phase * 0.12),
          1,
        )
        ring.material.opacity = 0.7 * Math.max(0, 1 - phase)
      })
      context.add(root)
    },
    dispose: () => disposeVictoryObject(root),
  }
}
