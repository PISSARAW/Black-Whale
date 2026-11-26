import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { ApparitionView } from './ApparitionView'
import type { PortalRenderer } from './PortalRenderer'

function setup() {
  const scene = new THREE.Scene()
  const view = new ApparitionView(scene, { drop: vi.fn() } as unknown as PortalRenderer)
  const build = vi.fn(() => ({ key: '', root: new THREE.Group() }))
  const sync = (key: string) =>
    view.sync([{ key }], {
      idOf: () => 'visitor',
      keyOf: (seen) => seen.key,
      build,
      update: vi.fn(),
      preserve: vi.fn(),
      restore: vi.fn(),
      leaving: () => false,
      sweep: vi.fn(),
    })
  return { scene, view, build, sync }
}

describe('prepared apparitions', () => {
  it('keeps a prepared actor out of the scene until its matching appearance is used', () => {
    const { scene, view, build, sync } = setup()
    const actor = view.prepare('visitor', 'ten', build)!
    expect(actor.root.parent).toBeNull()
    expect(view.prepare('visitor', 'ten', build)).toBeNull()
    sync('ten')
    expect(build).toHaveBeenCalledTimes(1)
    expect(actor.root.parent).toBe(scene)
    expect(view.items.visitor).toBe(actor)
  })

  it('disposes a prediction superseded by a different appearance', () => {
    const { scene, view, build, sync } = setup()
    const mesh = new THREE.Mesh()
    const dispose = vi.spyOn(mesh.geometry, 'dispose')
    const actor = view.prepare('visitor', 'ten', build)!
    actor.root.add(mesh)
    sync('ren')
    expect(dispose).toHaveBeenCalledOnce()
    expect(build).toHaveBeenCalledTimes(2)
    expect(actor.root.parent).toBeNull()
    expect(view.items.visitor?.root.parent).toBe(scene)
  })
})
