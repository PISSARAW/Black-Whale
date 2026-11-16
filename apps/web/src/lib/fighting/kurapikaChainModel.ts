import { chainLinkGeometry } from '$lib/tour/chainTipKit'
import { buildChainTip } from '$lib/tour/chainTips'
import type { Vector3 } from 'three'

export const CHAIN_TIP_NAMES = ['pendulum', 'syringe', 'claw', 'cross', 'blade'] as const
export const CHAIN_SIZE = 0.14
const MAX_LINKS = 256

/** Own resources, shared visit builders: no low-detail replacement tips or round links. */
export function createKurapikaChainModel(THREE: typeof import('three')) {
  const materials = new Map<string, import('three').MeshBasicMaterial>()
  const glow = (colour: number, opacity: number) => {
    const key = `${colour}:${opacity}`
    let material = materials.get(key)
    if (!material) {
      material = new THREE.MeshBasicMaterial({
        color: colour,
        opacity,
        transparent: opacity < 1,
        depthWrite: opacity >= 1,
      })
      materials.set(key, material)
    }
    return material
  }
  // The steel colour of the visitor's `chain` apparition.
  const steel = glow(0x8ecae6, 1)
  const root = new THREE.Group()
  const geometry = chainLinkGeometry(THREE, CHAIN_SIZE)
  const links = CHAIN_TIP_NAMES.map((name) => {
    const mesh = new THREE.InstancedMesh(geometry, steel, MAX_LINKS)
    mesh.name = `kurapika-chain-links:${name}`
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    mesh.visible = false
    return mesh
  })
  const tips = CHAIN_TIP_NAMES.map((name, stage) => {
    const tip = buildChainTip(stage, { THREE, steel, glow, size: CHAIN_SIZE })
    tip.name = `kurapika-chain-tip:${name}`
    tip.visible = false
    return tip
  })
  const reaches = tips.map((tip) => new THREE.Box3().setFromObject(tip).max.z)
  const seal = tips[4].clone(true)
  seal.name = 'kurapika-judgment-seal'
  seal.scale.multiplyScalar(0.52)
  seal.visible = false
  root.add(...links, ...tips, seal)
  const matrix = new THREE.Matrix4()
  const point = new THREE.Vector3()
  const tangent = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  const unitScale = new THREE.Vector3(1, 1, 1)
  const rotation = new THREE.Quaternion()
  const twist = new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2)

  function draw(options: { points: Vector3[]; stage: number; direction: Vector3 }) {
    const strand = links[options.stage]
    const curve = new THREE.CatmullRomCurve3(options.points, false, 'centripetal')
    strand.count = Math.min(
      MAX_LINKS,
      Math.max(2, Math.ceil(curve.getLength() / (CHAIN_SIZE * 0.3))),
    )
    strand.visible = true
    tips[options.stage].visible = true
    for (let index = 0; index < strand.count; index++) {
      const at = (index + 0.5) / strand.count
      curve.getPointAt(at, point)
      curve.getTangentAt(at, tangent)
      rotation.setFromUnitVectors(up, tangent)
      if (index % 2) rotation.multiply(twist)
      matrix.compose(point, rotation, unitScale)
      strand.setMatrixAt(index, matrix)
    }
    strand.instanceMatrix.needsUpdate = true
    const tip = tips[options.stage]
    tip.position.copy(options.points[options.points.length - 1])
    orientTip(tip, options.direction)
  }

  function orientTip(tip: import('three').Object3D, direction: Vector3) {
    const z = direction.clone().normalize()
    const y = new THREE.Vector3(0, 0, 1).addScaledVector(z, -z.z)
    if (y.lengthSq() < 0.001) y.set(0, 1, 0)
    y.normalize()
    const x = new THREE.Vector3().crossVectors(y, z).normalize()
    tip.quaternion.setFromRotationMatrix(matrix.makeBasis(x, y, z))
  }

  return {
    root,
    links,
    tips,
    seal,
    reaches,
    draw,
    hide: () => {
      links.forEach((mesh) => (mesh.visible = false))
      tips.forEach((tip) => (tip.visible = false))
    },
    dispose: () => {
      root.removeFromParent()
      const geometries = new Set<import('three').BufferGeometry>()
      root.traverse((node) => {
        if (node instanceof THREE.Mesh) geometries.add(node.geometry)
      })
      links.forEach((mesh) => mesh.dispose())
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
    },
  }
}
