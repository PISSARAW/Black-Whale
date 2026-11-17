import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { BillVictoryPose } from './billPose'
import { BILL_GROWTH, BILL_BLOOM } from './billPose'
import { disposeVictoryObject, ease } from './resources'

export function billFlower() {
  const root = new THREE.Group()
  const white = new THREE.MeshBasicMaterial({ color: 0xf6eee2 })
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const petal = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), white)
    petal.scale.set(0.044, 0.011, 0.013)
    petal.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0)
    petal.rotation.z = a
    root.add(petal)
  }
  const centre = new THREE.Mesh(
    new THREE.SphereGeometry(0.023, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0xd9b852 }),
  )
  centre.position.z = 0.012
  root.add(centre)
  return root
}
export function createBillVictoryPlant() {
  const root = new THREE.Group(),
    glass = new THREE.Group(),
    plant = new THREE.Group()
  root.name = 'bill-erigeron-living-seed'
  const clear = new THREE.MeshBasicMaterial({
    color: 0xd9e9ef,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.22, 32, 1, true), clear)
  cup.position.y = 0.11
  glass.add(cup)
  for (const y of [0.01, 0.22]) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(y > 0.1 ? 0.078 : 0.065, 0.004, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xc1d5df }),
    )
    rim.rotation.x = Math.PI / 2
    rim.position.y = y
    glass.add(rim)
  }
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.066, 0.062, 0.11, 24),
    new THREE.MeshBasicMaterial({
      color: 0x8abac7,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  )
  water.position.y = 0.065
  const seed = new THREE.Mesh(
    new THREE.SphereGeometry(0.019, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x5c4631 }),
  )
  seed.position.y = 0.03
  glass.add(water, seed)
  root.add(glass, plant)
  const green = new THREE.MeshBasicMaterial({ color: 0x5b8649 })
  const stem = (points: number[][], radius: number) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
    const part = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), green)
    plant.add(part)
  }
  stem(
    [
      [0, 0, 0],
      [-0.025, 0.25, 0],
      [0.025, 0.53, 0.005],
      [0.1, 0.76, 0.035],
    ],
    0.012,
  )
  const sites = [
    new THREE.Vector3(0.1, 0.76, 0.035),
    new THREE.Vector3(-0.13, 0.56, 0.02),
    new THREE.Vector3(0.17, 0.48, 0.04),
    new THREE.Vector3(-0.1, 0.32, 0.06),
    new THREE.Vector3(0.08, 0.29, -0.025),
  ]
  sites
    .slice(1)
    .forEach((site) =>
      stem([[0, site.y * 0.55, 0], [site.x * 0.5, site.y * 0.8, site.z], site.toArray()], 0.006),
    )
  const flowers = sites.map((site) => {
    const flower = billFlower()
    flower.position.copy(site)
    plant.add(flower)
    return flower
  })
  const leaves = Array.from({ length: 8 }, (_, i) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6), green)
    leaf.position.set((i % 2 ? 1 : -1) * 0.055, 0.13 + i * 0.055, (i % 3) * 0.015)
    leaf.scale.set(0.085, 0.014, 0.025)
    plant.add(leaf)
    return leaf
  })
  return {
    root,
    sync(context: VictoryContext, pose: BillVictoryPose) {
      const { age } = context
      root.visible = age >= 420
      glass.position.copy(pose.glass)
      plant.position.copy(pose.glass).add(new THREE.Vector3(0, 0.03, 0))
      const growth = ease((age - BILL_GROWTH) / 36)
      const bloom = ease((age - BILL_BLOOM) / 30)
      plant.visible = age >= BILL_GROWTH
      plant.scale.set(0.45, Math.max(0.001, growth * 0.45), 0.45)
      leaves.forEach((leaf, i) => {
        leaf.rotation.z = (i % 2 ? -1 : 1) * (1.2 - growth * 0.65)
      })
      flowers.forEach((flower) => {
        flower.scale.setScalar(Math.max(0.001, bloom))
        flower.visible = true
      })
      return {
        growth,
        bloom,
        picked: false,
        flowerPoint: plant.localToWorld(sites[0].clone()),
        glass: glass.position.toArray(),
      }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
