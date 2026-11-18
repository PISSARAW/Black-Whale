import { describe, expect, it, vi } from 'vitest'
import { fightGraphics, fightPixelRatio, FIGHT_GRAPHICS } from './fightGraphics'
import { createFightPost } from './fightRenderer'
import { createFightRenderResources } from './fightRenderer'
import * as THREE from 'three'
import { readFightComfort, saveFightComfort, defaultFightComfort } from './fightComfort'
import { resizeFightCanvas } from './fightSceneResize'

describe('graphics profiles leave gameplay information intact', () => {
  it('preserves the previous render settings for old or invalid preferences', () => {
    for (const value of [undefined, null, 'unknown', {}, 0])
      expect(fightGraphics(value)).toEqual({
        pixelRatio: 1.75,
        samples: 4,
        bloom: true,
        antialias: true,
      })
    const legacy = { ...defaultFightComfort(), shake: 0.5 }
    expect(readFightComfort({ getItem: () => JSON.stringify(legacy) })).toEqual(legacy)
    expect(
      readFightComfort({ getItem: () => JSON.stringify({ ...legacy, graphics: 'invalid' }) }),
    ).toEqual(legacy)
  })
  it.each(FIGHT_GRAPHICS)('saves the selected %s profile with comfort preferences', (graphics) => {
    const settings = { ...defaultFightComfort(), graphics }
    const setItem = vi.fn()
    saveFightComfort(settings, { setItem })
    expect(readFightComfort({ getItem: () => setItem.mock.calls[0][1] })).toEqual(settings)
  })
  it('caps high-DPI resolution without upscaling lower-DPI screens', () => {
    expect(FIGHT_GRAPHICS.map((id) => fightPixelRatio(3, id))).toEqual([1, 1.25, 1.75])
    expect(FIGHT_GRAPHICS.map((id) => fightPixelRatio(1, id))).toEqual([1, 1, 1])
    for (const ratio of [NaN, Infinity, -1, 0]) expect(fightPixelRatio(ratio)).toBe(1)
  })
  it('keeps canvas, post targets and camera aspect in agreement', () => {
    vi.stubGlobal('window', { devicePixelRatio: 3 })
    const renderer = { setPixelRatio: vi.fn(), setSize: vi.fn() }
    const camera = { aspect: 0, updateProjectionMatrix: vi.fn() }
    const post = { resize: vi.fn() }
    resizeFightCanvas({
      canvas: { clientWidth: 800, clientHeight: 400 },
      renderer,
      camera,
      post,
      graphics: 'performance',
    } as never)
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(1)
    expect(renderer.setSize).toHaveBeenCalledWith(800, 400, false)
    expect(post.resize).toHaveBeenCalledWith(800, 400, 1)
    expect(camera.aspect).toBe(2)
    vi.unstubAllGlobals()
  })
  it('skips decorative post-processing in performance mode without replacing the scene', async () => {
    const scene = Object.freeze({ marker: 'unchanged' })
    expect(
      await createFightPost({ bloom: true, graphics: 'performance', scene } as never),
    ).toBeNull()
    expect(await createFightPost({ bloom: false, graphics: 'quality', scene } as never)).toBeNull()
    expect(scene.marker).toBe('unchanged')
  })
  it('releases cancelled scene resources and any pools completed after cancellation', () => {
    const dispose = vi.fn(),
      forceContextLoss = vi.fn()
    class Renderer {
      setClearColor() {}
      render = vi.fn()
      dispose = dispose
      forceContextLoss = forceContextLoss
    }
    const resources = createFightRenderResources(
      { ...THREE, WebGLRenderer: Renderer } as never,
      {} as HTMLCanvasElement,
      'performance',
    )
    const first = resources.geometry(new THREE.BoxGeometry())
    const firstDispose = vi.spyOn(first, 'dispose')
    const material = resources.glow(0xffffff, 1)
    const materialDispose = vi.spyOn(material, 'dispose')
    expect(resources.glow(0xffffff, 1)).toBe(material)
    resources.dispose()
    const late = resources.geometry(new THREE.SphereGeometry())
    const lateDispose = vi.spyOn(late, 'dispose')
    resources.dispose()
    expect(dispose).toHaveBeenCalledOnce()
    expect(forceContextLoss).toHaveBeenCalledOnce()
    expect(firstDispose).toHaveBeenCalledOnce()
    expect(lateDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })
})
