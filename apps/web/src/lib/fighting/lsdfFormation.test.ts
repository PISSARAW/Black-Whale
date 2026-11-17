import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildLsdfGuard } from '$lib/tour/apparitionLsdfView'
import { buildFightLsdfFormation } from './lsdfFormation'

function context() {
  const materials = new Map<number, THREE.MeshBasicMaterial>()
  return {
    THREE,
    root: new THREE.Group(),
    skin: new THREE.MeshBasicMaterial(),
    glow(colour: number) {
      const material = materials.get(colour) ?? new THREE.MeshBasicMaterial({ color: colour })
      materials.set(colour, material)
      return material
    },
  }
}

describe('complete LSDF formation batching', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
    'preserves all guard surfaces and seven positions at level %i',
    (level) => {
      const c = context()
      const template = buildLsdfGuard(c, { level, scale: 0.55, at: [0, 0, 0] })
      template.updateMatrixWorld(true)
      const expected = new Map<THREE.Material, number[]>()
      template.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld)
        const positions = expected.get(node.material) ?? []
        positions.push(...geometry.attributes.position.array)
        expected.set(node.material, positions)
        geometry.dispose()
      })
      const root = buildFightLsdfFormation(c, level)
      expect(root.children).toHaveLength(4)
      for (const child of root.children) {
        const batch = child as THREE.InstancedMesh
        expect(batch.count).toBe(7)
        expect([...batch.geometry.attributes.position.array]).toEqual(
          expected.get(batch.material as THREE.Material),
        )
        for (let index = 0; index < 7; index++) {
          const matrix = new THREE.Matrix4()
          batch.getMatrixAt(index, matrix)
          const position = new THREE.Vector3().setFromMatrixPosition(matrix)
          expect(position.x).toBeCloseTo(index === 0 ? 0 : (index % 2 ? -1 : 1) * 0.55)
          expect(position.z).toBeCloseTo(-Math.floor((index + 1) / 2) * 0.55)
        }
      }
    },
  )
})
