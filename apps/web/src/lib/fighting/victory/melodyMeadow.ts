import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { MelodyVictoryPose } from './melodyPose'
import { disposeVictoryObject, ease } from './resources'
import { melodySpringHorizon } from './melodyHorizon'

const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 43.7) * 43758.5453
  return x - Math.floor(x)
}
function blossom() {
  const shape = new THREE.Shape()
  for (let i = 0; i <= 80; i++) {
    const a = (i * Math.PI) / 40,
      r = 0.045 * (0.76 + 0.24 * Math.cos(a * 5))
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return new THREE.ShapeGeometry(shape)
}
export function createMelodyMeadow() {
  const root = new THREE.Group()
  root.name = 'melody-subjective-spring-meadow'
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(18, 96),
    new THREE.MeshBasicMaterial({ color: 0x7d9f63, side: THREE.DoubleSide }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.012
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(24, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xe5edda, side: THREE.BackSide }),
  )
  const flowerGeometry = blossom()
  const flowers = new THREE.InstancedMesh(
    flowerGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    1280,
  )
  const stems = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.005, 0.007, 1, 4),
    new THREE.MeshBasicMaterial({ color: 0x587347 }),
    1280,
  )
  const grass = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.018, 1),
    new THREE.MeshBasicMaterial({ color: 0x739551, side: THREE.DoubleSide }),
    3000,
  )
  const petals = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.027, 8),
    new THREE.MeshBasicMaterial({ color: 0xffdfdf, side: THREE.DoubleSide }),
    96,
  )
  const offered = new THREE.Group()
  const stalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.006, 0.2, 5),
    new THREE.MeshBasicMaterial({ color: 0x71904d }),
  )
  stalk.position.y = 0.1
  const bloom = new THREE.Mesh(
    flowerGeometry,
    new THREE.MeshBasicMaterial({ color: 0xf6cbd2, side: THREE.DoubleSide }),
  )
  bloom.position.y = 0.2
  bloom.rotation.x = -0.65
  offered.add(stalk, bloom)
  const horizon = melodySpringHorizon()
  root.add(ground, sky, horizon, flowers, stems, grass, petals, offered)
  const dummy = new THREE.Object3D(),
    colors = [0xf2c2d1, 0xffefd0, 0xe5c2de, 0xf4d273]
  for (let i = 0; i < 3000; i++) {
    const a = seed(i + 1) * Math.PI * 2,
      r = 1.2 + Math.sqrt(seed(i + 1801)) * 12
    dummy.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r)
    dummy.rotation.set(seed(i + 3601) * 0.4, seed(i + 5401) * Math.PI, 0.2)
    dummy.scale.set(1, 0.15 + seed(i + 7201) * 0.2, 1)
    dummy.updateMatrix()
    grass.setMatrixAt(i, dummy.matrix)
  }
  return {
    root,
    sync(context: VictoryContext, pose: MelodyVictoryPose) {
      const growth = ease((context.age - 174) / 66)
      root.visible = context.age >= 174
      ground.scale.setScalar(Math.max(0.001, growth))
      if (context.age >= 210) {
        context.save(context.scenery)
        context.scenery.visible = false
      }
      sky.visible = context.age >= 210
      horizon.visible = sky.visible
      root.position.x = context.centre
      for (let i = 0; i < 1280; i++) {
        const a = seed(i + 9001) * Math.PI * 2,
          r = 0.6 + Math.sqrt(seed(i + 9801)) * 10
        const height = (0.16 + seed(i + 10601) * 0.24) * growth
        dummy.position.set(Math.cos(a) * r, height, Math.sin(a) * r)
        dummy.rotation.set(-Math.PI / 3 + Math.sin(context.age * 0.025 + i) * 0.2, 0, a)
        dummy.scale.setScalar(0.8 + seed(i + 11401) * 0.8)
        dummy.updateMatrix()
        flowers.setMatrixAt(i, dummy.matrix)
        flowers.setColorAt(i, new THREE.Color(colors[i % colors.length]))
        dummy.position.y = height / 2
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, height, 1)
        dummy.updateMatrix()
        stems.setMatrixAt(i, dummy.matrix)
      }
      for (let i = 0; i < 96; i++) {
        const t = context.age * 0.008 + i * 2.4,
          r = 0.6 + seed(i + 12201) * 3
        dummy.position.set(
          pose.heart.x - context.centre + Math.cos(t) * r,
          0.4 + seed(i + 13001) * 2.5,
          Math.sin(t) * r,
        )
        dummy.rotation.set(t, 0, t * 0.3)
        dummy.scale.setScalar(growth)
        dummy.updateMatrix()
        petals.setMatrixAt(i, dummy.matrix)
      }
      flowers.instanceMatrix.needsUpdate = true
      stems.instanceMatrix.needsUpdate = true
      petals.instanceMatrix.needsUpdate = true
      if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true
      offered.visible = context.age >= 324
      offered.position.copy(pose.hand).add(new THREE.Vector3(-context.centre, 0, 0))
      offered.rotation.z = -0.15
      return growth
    },
    dispose: () => disposeVictoryObject(root),
  }
}
