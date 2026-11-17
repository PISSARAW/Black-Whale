import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { DETAIL_TAGS_KEY } from '$lib/tour/detailTag'
import { pruneStaticRoomCut } from './stageStaticCut'

function fixture() {
  // Clipped foreground, visible background, floor and a triangle crossing the cut.
  const positions = Array.from({ length: 100 }, () => [
    -1, 1, 1, 1, 1, 1, 0, 2, 1, -1, 1, -1, 1, 1, -1, 0, 2, -1, -1, 0, 1, 1, 0, 1, 0, 0, 2, -1, 1,
    -1, 1, 1, 1, 0, 2, 1,
  ]).flat()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.MeshBasicMaterial({
    clippingPlanes: [
      new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.004),
    ],
    clipIntersection: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  const root = new THREE.Group()
  root.add(mesh)
  return { root, mesh, geometry, material, positions }
}

describe('static room clipping prepass', () => {
  it('removes only whole triangles already discarded by the intersection shader', () => {
    const f = fixture()
    pruneStaticRoomCut(THREE, f.root)
    expect(f.geometry.userData.fightStaticCut).toEqual({ before: 400, after: 300 })
    expect([...f.geometry.attributes.position.array]).toEqual(f.positions)
    expect([...f.geometry.index!.array].slice(0, 9)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(f.material.clippingPlanes).toHaveLength(2)
    expect(f.material.clipIntersection).toBe(true)
  })

  it('uses world clipping planes correctly after placing and rotating the room', () => {
    const f = fixture()
    f.root.position.set(8, 2, -4)
    f.root.rotation.y = 0.8
    f.root.updateMatrixWorld(true)
    f.material.clippingPlanes!.forEach((plane) => plane.applyMatrix4(f.root.matrixWorld))
    pruneStaticRoomCut(THREE, f.root)
    expect(f.geometry.userData.fightStaticCut.after).toBe(300)
  })

  it('retains the correct provenance on the surviving faces', () => {
    const f = fixture()
    const tag = { id: 'first-surface' }
    f.mesh.userData[DETAIL_TAGS_KEY] = [{ start: 0, count: 4, tag }]
    pruneStaticRoomCut(THREE, f.root)
    expect(f.mesh.userData[DETAIL_TAGS_KEY]).toEqual([{ start: 0, count: 3, tag }])
  })

  it('leaves transparent or antialiased clipping surfaces on their original path', () => {
    const f = fixture()
    f.material.transparent = true
    pruneStaticRoomCut(THREE, f.root)
    expect(f.geometry.index).toBeNull()
    f.material.transparent = false
    f.material.alphaToCoverage = true
    pruneStaticRoomCut(THREE, f.root)
    expect(f.geometry.index).toBeNull()
  })
})
