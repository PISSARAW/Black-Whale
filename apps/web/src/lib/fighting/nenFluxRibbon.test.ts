import { expect, it } from 'vitest'
import * as THREE from 'three'
import { fluxPathPoint, fluxRibbonGeometry, drawFluxRibbon } from './nenFluxRibbon'

it('travels by actual distance along unequal bone segments', () => {
  const path = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(3, 1, 0)]
  expect(fluxPathPoint(path, 0.25).toArray()).toEqual([0, 1, 0])
  expect(fluxPathPoint(path, 0.5).toArray()).toEqual([1, 1, 0])
})
it('draws a connected tapering ribbon on the posed body, with no sphere particles', () => {
  const geometry = fluxRibbonGeometry(THREE)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x8b4fd3 }))
  const path = [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()]
  path[1].position.set(0, 1, 0)
  path[2].position.set(1, 1, 0)
  drawFluxRibbon(mesh, path, 0.7)
  expect(mesh.visible).toBe(true)
  expect(geometry.index!.count).toBe(72)
  expect(geometry.getAttribute('position').count).toBe(26)
  const first = [...geometry.getAttribute('position').array]
  drawFluxRibbon(mesh, path, 0.7)
  expect([...geometry.getAttribute('position').array]).toEqual(first)
  path[1].position.x = -0.25
  drawFluxRibbon(mesh, path, 0.7)
  expect([...geometry.getAttribute('position').array]).not.toEqual(first)
  expect(mesh.material.color.getHex()).toBe(0x8b4fd3)
  expect([...geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true)
})
