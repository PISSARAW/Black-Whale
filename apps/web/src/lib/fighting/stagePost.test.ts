import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createStagePost } from './stagePost'

const observed = vi.hoisted(() => ({
  target: null as THREE.WebGLRenderTarget | null,
  passes: [] as Pass[],
  order: [] as string[],
  dispose: vi.fn(),
}))
vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
  EffectComposer: class {
    constructor(_renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
      observed.target = target
    }
    addPass(pass: Pass) {
      observed.passes.push(pass)
    }
    setPixelRatio() {}
    setSize() {}
    render() {
      observed.order.push('post')
    }
    dispose() {
      observed.dispose()
    }
  },
}))
function rendererOf() {
  const previous = new THREE.WebGLRenderTarget(2, 2)
  const renderer = {
    autoClear: true,
    autoClearColor: true,
    autoClearDepth: true,
    autoClearStencil: false,
    getRenderTarget: () => previous,
    setRenderTarget: vi.fn((_target: THREE.WebGLRenderTarget | null) => {}),
    clear: vi.fn((_colour: boolean, _depth: boolean, _stencil: boolean) => {}),
    render: vi.fn((_scene: THREE.Scene, _camera: THREE.Camera) => observed.order.push('scene')),
  }
  return { renderer, previous }
}
async function setup() {
  const { renderer, previous } = rendererOf()
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const post = await createStagePost({
    THREE,
    renderer: renderer as unknown as THREE.WebGLRenderer,
    scene,
    camera,
  })
  return { renderer, previous, scene, camera, post }
}
beforeEach(() => {
  observed.target = null
  observed.passes = []
  observed.order = []
  observed.dispose.mockClear()
})
describe('scene-only multisample antialiasing', () => {
  it('keeps scene MSAA and HDR, resolves before post, and preserves the output chain', async () => {
    const { renderer, previous, scene, camera, post } = await setup()
    post.render()
    const input = renderer.setRenderTarget.mock.calls[0][0] as THREE.WebGLRenderTarget
    expect(input.samples).toBe(4)
    expect(input.texture.type).toBe(THREE.HalfFloatType)
    expect(observed.target!.samples).toBe(0)
    expect(observed.target!.texture.type).toBe(THREE.HalfFloatType)
    expect(input.depthBuffer).toBe(true)
    expect(observed.target!.depthBuffer).toBe(false)
    const bloom = observed.passes[1] as UnrealBloomPass
    const buffers = [
      bloom.renderTargetBright,
      ...bloom.renderTargetsHorizontal,
      ...bloom.renderTargetsVertical,
    ]
    expect(buffers).toHaveLength(11)
    expect(buffers.every((buffer) => !buffer.depthBuffer)).toBe(true)
    expect([bloom.strength, bloom.radius, bloom.threshold]).toEqual([0.42, 0.55, 0.96])
    const sanitise = observed.passes[0] as ShaderPass
    expect(sanitise.uniforms.tDiffuse.value).toBe(input.texture)
    expect(sanitise.textureID).toBe('composerInput')
    expect(observed.passes.map((pass) => pass.constructor.name)).toEqual([
      'ShaderPass',
      'UnrealBloomPass',
      'ShaderPass',
      'OutputPass',
    ])
    expect(observed.order).toEqual(['scene', 'post'])
    expect(renderer.render).toHaveBeenCalledWith(scene, camera)
    expect(renderer.clear).toHaveBeenCalledWith(true, true, false)
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previous)
    expect(renderer.autoClear).toBe(true)
    post.dispose()
  })

  it('resizes and releases the extra scene target', async () => {
    const { renderer, post } = await setup()
    post.resize(1260, 560, 1.75)
    post.render()
    const input = renderer.setRenderTarget.mock.calls[0][0] as THREE.WebGLRenderTarget
    expect([input.width, input.height]).toEqual([2205, 980])
    const disposed = vi.spyOn(input, 'dispose')
    post.dispose()
    expect(disposed).toHaveBeenCalledOnce()
    expect(observed.dispose).toHaveBeenCalledOnce()
  })

  it('restores the render target and clear policy even if the scene fails', async () => {
    const { renderer, previous, post } = await setup()
    renderer.autoClear = false
    renderer.render.mockImplementationOnce(() => {
      throw Error('lost context')
    })
    expect(() => post.render()).toThrow('lost context')
    expect(renderer.autoClear).toBe(false)
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(previous)
    expect(observed.order).toEqual([])
    post.dispose()
  })
})
