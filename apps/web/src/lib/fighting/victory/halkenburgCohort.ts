import * as THREE from 'three'
import { buildHumanFigure } from '../../tour/humanFigure'
import type { VictoryContext } from './types'
import type { HalkenburgPose } from './halkenburgBow'
import { disposeVictoryObject, ease } from './resources'

function supporter(index: number) {
  const model = buildHumanFigure({
    THREE,
    glow: (color, opacity) =>
      new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
    seen: {
      id: `victory:halkenburg-supporter:${index}`,
      kind: 'combatant',
      spaceId: 'clash-victory',
      tierId: 'fighting',
      at: [0, 0],
      y: 0,
      size: 1,
      colour: 0xe7d1a0,
      stage: 0,
      hidden: false,
      human: { role: 'fighter', identity: 'halkenburg-supporter', pose: 'idle', aura: 'ten' },
    },
  })
  model.root.name = `halkenburg-cohort-${index}`
  model.root.scale.setScalar(0.84 + index * 0.025)
  return model
}
export function createHalkenburgCohort() {
  const root = new THREE.Group(),
    people = Array.from({ length: 3 }, (_, i) => supporter(i))
  root.name = 'halkenburg-shared-will'
  const material = new THREE.LineBasicMaterial({
    color: 0xfce7b5,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const threads = people.map(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 48 }, () => new THREE.Vector3()),
        ),
        material,
      ),
  )
  people.forEach((person, i) => root.add(person.root, threads[i]))
  const motes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.015, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffe9b9 }),
    120,
  )
  motes.frustumCulled = false
  root.add(motes)
  const dummy = new THREE.Object3D()
  return {
    root,
    sync(context: VictoryContext, pose: HalkenburgPose) {
      const { age, hero } = context
      root.visible = age >= 66 && age < 480
      material.opacity = ease((age - 78) / 45) * (1 - ease((age - 300) / 28)) * 0.6
      people.forEach((model, i) => {
        model.root.position.set(hero.root.position.x - 0.55 - i * 0.48, 0, -0.55 - (i % 2) * 0.25)
        model.root.rotation.y = 0.7 + i * 0.12
        model.root.updateWorldMatrix(true, true)
        const from = model.root.position.clone().add(new THREE.Vector3(0, 1.3, 0.1))
        const array = threads[i].geometry.getAttribute('position')
        for (let j = 0; j < 48; j++) {
          const t = j / 47,
            p = from.clone().lerp(pose.grip, t)
          p.y += Math.sin(t * Math.PI) * (0.3 + i * 0.06)
          p.z += Math.sin(t * Math.PI * 3 - age * 0.1) * 0.035 * Math.sin(t * Math.PI)
          array.setXYZ(j, p.x, p.y, p.z)
        }
        array.needsUpdate = true
      })
      motes.visible = age >= 85 && age < 318
      for (let i = 0; i < 120; i++) {
        const t = (age * 0.011 + i * 0.618) % 1
        dummy.position.set(
          hero.root.position.x - 1.8 * (1 - t),
          0.3 + t * (pose.grip.y - 0.3) + Math.sin(t * Math.PI) * 0.8,
          -0.6 * (1 - t),
        )
        dummy.scale.setScalar(Math.sin(t * Math.PI) * (0.5 + pose.charge))
        dummy.updateMatrix()
        motes.setMatrixAt(i, dummy.matrix)
      }
      motes.instanceMatrix.needsUpdate = true
    },
    dispose() {
      people.forEach((model) => {
        model.root.removeFromParent()
        const materials = new Set<THREE.Material>(),
          geometries = new Set<THREE.BufferGeometry>()
        model.root.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          if (!node.geometry.userData.sharedHuman) geometries.add(node.geometry)
          const list = Array.isArray(node.material) ? node.material : [node.material]
          list.forEach((material) => materials.add(material))
        })
        geometries.forEach((geometry) => geometry.dispose())
        materials.forEach((material) => material.dispose())
      })
      disposeVictoryObject(root)
    },
  }
}
