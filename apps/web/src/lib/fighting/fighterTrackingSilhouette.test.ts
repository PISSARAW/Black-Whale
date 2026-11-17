import { describe, expect, it } from 'vitest'
import { Group, Mesh, MeshBasicMaterial, BoxGeometry } from 'three'
import { createFighterTrackingSilhouettes } from './fighterTrackingSilhouette'
import { createFight } from './engine'

describe('optional fighter tracking silhouettes', () => {
  it('keeps an absorbed actor visible as a translucent marker without changing the engine snapshot', () => {
    const state = { ...createFight('camilla', 'hisoka'), catsNameConsumed: 'opponent' as const }
    const snapshot = structuredClone(state)
    const root = new Group(),
      material = new MeshBasicMaterial({ opacity: 1 })
    const mesh = new Mesh(new BoxGeometry(), material)
    root.add(mesh)
    const tracking = createFighterTrackingSilhouettes()
    tracking.sync(root, { state, side: 'opponent', keep: false })
    expect(root.visible).toBe(false)
    expect(mesh.material).toBe(material)
    tracking.sync(root, { state, side: 'opponent', keep: true })
    expect(root.visible).toBe(true)
    expect(mesh.material).not.toBe(material)
    expect(mesh.material.opacity).toBe(0.38)
    expect(material.opacity).toBe(1)
    expect(state).toEqual(snapshot)
    tracking.dispose()
    expect(mesh.material).toBe(material)
    mesh.geometry.dispose()
    material.dispose()
  })
})
