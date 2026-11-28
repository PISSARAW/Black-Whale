import * as THREE from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject, ease } from './resources'
import timing from './bonolenovTiming.json'

const OPENINGS = {
  low: { joint: 'torso', point: [-0.1, -0.23, 0.13], radius: 0.023 },
  torso: { joint: 'torso', point: [0.1, 0.01, 0.13], radius: 0.024 },
  left: { joint: 'shoulder-left', point: [0, -0.09, 0.059], radius: 0.02 },
  right: { joint: 'hand-right', point: [0, -0.025, 0.046], radius: 0.016 },
} as const

export function createBonolenovEffects() {
  const root = new THREE.Group()
  root.name = 'bonolenov-last-movement'
  const dark = new THREE.MeshBasicMaterial({ color: 0x151013, side: THREE.DoubleSide })
  const openings = Object.values(OPENINGS).map(({ joint, point, radius }) => {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), dark)
    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 36),
      new THREE.MeshBasicMaterial({
        color: 0xe4d3a8,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    root.add(hole, pulse)
    return { joint, point, hole, pulse }
  })
  const dust = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshBasicMaterial({ color: 0xa18e7c, transparent: true, depthWrite: false }),
    84,
  )
  dust.frustumCulled = false
  root.add(dust)
  const dummy = new THREE.Object3D()
  const surfacePoint = new THREE.Vector3()
  const ray = new THREE.Raycaster()
  return {
    root,
    sync(context: VictoryContext, impactX: number) {
      const { hero, age } = context
      openings.forEach(({ joint, point, hole, pulse }, index) => {
        const anchor = hero.root.getObjectByName(joint)!
        anchor.getWorldQuaternion(hole.quaternion)
        surfacePoint.fromArray(point)
        if (joint === 'torso' && (age < timing.form || age >= timing.bow)) {
          const origin = anchor.localToWorld(surfacePoint.clone().setZ(1))
          ray.set(origin, new THREE.Vector3(0, 0, -1).applyQuaternion(hole.quaternion))
          const hit = ray.intersectObject(anchor.children[1], false)[0]
          if (hit) surfacePoint.copy(anchor.worldToLocal(hit.point)).z += 0.004
        }
        hole.position.copy(anchor.localToWorld(surfacePoint))
        hole.visible = age >= timing.armor && age < timing.form && hero.root.visible
        const source = Object.keys(OPENINGS)[index]
        const note = timing.phrases.find(
          (phrase) => phrase.source === source && age >= phrase.frame && age < phrase.frame + 19,
        )
        pulse.visible = Boolean(note) && hero.root.visible && context.comfort.flashes
        if (!note) return
        const t = (age - note.frame) / 19
        pulse.position
          .copy(hole.position)
          .add(new THREE.Vector3(0, 0, t * 0.17 + 0.012).applyQuaternion(hole.quaternion))
        pulse.quaternion.copy(hole.quaternion)
        pulse.scale.setScalar(0.025 + t * 0.17)
        pulse.material.opacity = (1 - t) * 0.39
      })
      const t = (age - timing.dust) / 60
      dust.count = t > 0 && t < 1.4 ? 84 : 0
      dust.material.opacity = 0.68 * (1 - ease(t / 1.4))
      for (let i = 0; i < dust.count; i++) {
        const angle = i * 2.39996
        const travel = 0.16 + (i % 7) * 0.043 + (0.52 + (i % 9) * 0.13) * t
        dummy.position.set(
          impactX + Math.cos(angle) * travel,
          Math.max(0.065, (1.25 + (i % 7) * 0.21) * t - 1.48 * t * t),
          Math.sin(angle) * travel * 0.68,
        )
        dummy.rotation.set(i + t * 3, i * 2, t * 4)
        dummy.scale.setScalar((0.025 + (i % 5) * 0.013) * ease(t * 10))
        dummy.updateMatrix()
        dust.setMatrixAt(i, dummy.matrix)
      }
      dust.instanceMatrix.needsUpdate = true
    },
    dispose: () => disposeVictoryObject(root),
  }
}
