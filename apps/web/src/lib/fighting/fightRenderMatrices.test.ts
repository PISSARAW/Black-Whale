import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { reuseFightRenderMatrices } from './fightRenderMatrices'

function fixture() {
  const scene = new THREE.Scene()
  scene.userData.fightView = 'primary'
  const actor = new THREE.Group()
  scene.add(actor)
  const camera = new THREE.PerspectiveCamera()
  const reflection = new THREE.PerspectiveCamera()
  let inspect = (_scene: THREE.Object3D, _camera: THREE.Camera) => {}
  const renderer = {
    render: (root: THREE.Object3D, lens: THREE.Camera) => {
      if (root.matrixWorldAutoUpdate) root.updateMatrixWorld(true)
      inspect(root, lens)
    },
  }
  reuseFightRenderMatrices(renderer as unknown as THREE.WebGLRenderer)
  return {
    scene,
    actor,
    camera,
    reflection,
    renderer,
    during: (fn: typeof inspect) => {
      inspect = fn
    },
  }
}

describe('reflection pose reuse', () => {
  it('reflects the current complete pose and still updates the next animation frame', () => {
    const f = fixture()
    const update = vi.spyOn(f.scene, 'updateMatrixWorld')
    f.during((_, lens) => {
      expect(f.actor.matrixWorld.elements[12]).toBe(f.actor.position.x)
      if (lens === f.camera) f.renderer.render(f.scene, f.reflection)
    })
    f.actor.position.x = 2
    f.renderer.render(f.scene, f.camera)
    f.actor.position.x = 5
    f.renderer.render(f.scene, f.camera)
    expect(update).toHaveBeenCalledTimes(2)
    expect(f.scene.matrixWorldAutoUpdate).toBe(true)
  })

  it('restores update flags after a reflection render throws', () => {
    const f = fixture()
    f.during((_, lens) => {
      if (lens === f.camera) f.renderer.render(f.scene, f.reflection)
      else throw Error('context lost')
    })
    expect(() => f.renderer.render(f.scene, f.camera)).toThrow('context lost')
    expect(f.scene.matrixWorldAutoUpdate).toBe(true)
    f.during(() => {})
    f.actor.position.x = 7
    f.renderer.render(f.scene, f.camera)
    expect(f.actor.matrixWorld.elements[12]).toBe(7)
  })

  it('continues updating independent scenes rendered inside a fight pass', () => {
    const f = fixture()
    const effect = new THREE.Scene()
    const particle = new THREE.Group()
    effect.add(particle)
    f.during((root) => {
      if (root !== f.scene) return
      particle.position.y = 18
      f.renderer.render(effect, f.reflection)
    })
    f.renderer.render(f.scene, f.camera)
    expect(particle.matrixWorld.elements[13]).toBe(18)
  })
})
