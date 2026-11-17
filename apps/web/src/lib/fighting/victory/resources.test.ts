import { expect, it, vi } from 'vitest'
import {
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Texture,
} from 'three'
import { createCinematicCrater } from './crater'
import { disposeVictoryObject } from './resources'

it('releases crater cracks, instanced slabs and shared card textures exactly once', () => {
  const { root } = createCinematicCrater()
  const parent = new Group()
  parent.add(root)
  const released = vi.fn()
  root.traverse((node) => {
    if (!(node instanceof Mesh) && !(node instanceof LineSegments)) return
    node.geometry.addEventListener('dispose', released)
  })
  const texture = new Texture(),
    geometry = new BufferGeometry()
  const material = new MeshBasicMaterial({ map: texture })
  const disposeGeometry = vi.spyOn(geometry, 'dispose'),
    disposeTexture = vi.spyOn(texture, 'dispose'),
    disposeMaterial = vi.spyOn(material, 'dispose')
  const crack = new LineSegments(new BufferGeometry(), new LineBasicMaterial())
  const disposeCrack = vi.spyOn(crack.geometry, 'dispose')
  root.add(new Mesh(geometry, material), new Mesh(geometry, material), crack)
  disposeVictoryObject(root)
  expect(parent.children).toHaveLength(0)
  expect(released).toHaveBeenCalledTimes(4)
  expect(disposeGeometry).toHaveBeenCalledOnce()
  expect(disposeTexture).toHaveBeenCalledOnce()
  expect(disposeMaterial).toHaveBeenCalledOnce()
  expect(disposeCrack).toHaveBeenCalledOnce()
})
