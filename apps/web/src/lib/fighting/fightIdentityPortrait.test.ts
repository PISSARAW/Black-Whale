import { afterEach, expect, it, vi } from 'vitest'
import type { Scene } from 'three'

const probe = vi.hoisted(() => ({ active: 0, peak: 0, draws: 0, releases: 0, fail: false }))
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    WebGLRenderer: class {
      outputColorSpace = ''
      constructor() {
        if (probe.fail) throw Error('Context unavailable')
        probe.active++
        probe.peak = Math.max(probe.peak, probe.active)
      }
      setSize() {}
      setClearColor() {}
      render(scene: Scene) {
        expect(scene.children).toHaveLength(1)
        expect(scene.children[0].getObjectByName('face-eye-left')).toBeDefined()
        probe.draws++
      }
      dispose() {
        probe.active--
        probe.releases++
      }
      forceContextLoss() {}
    },
  }
})
// The cache test needs a head, not the simulation and all forty Hatsu graphs.
// Full model geometry and poses are covered by fightFaceReadability.test.ts.
vi.mock('./fighterFigure', async () => {
  const { Group, Mesh, BoxGeometry, MeshBasicMaterial } = await import('three')
  return {
    buildFightFigure: () => {
      const root = new Group(),
        head = new Group()
      const eye = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshBasicMaterial())
      eye.name = 'face-eye-left'
      head.add(eye)
      root.add(head)
      return { root }
    },
  }
})
vi.mock('./fightState', () => ({ createFightState: () => ({ player: {} }) }))
import { fightIdentityPortrait, fightLivingPortraits } from './fightIdentityPortrait'
afterEach(() => vi.unstubAllGlobals())

it('caches all living portrait moods per identity, draws serially and releases every context', async () => {
  vi.stubGlobal('document', {
    createElement: () => ({ toDataURL: () => 'data:image/webp;base64,portrait' }),
  })
  const first = fightLivingPortraits('kurapika')
  expect(fightLivingPortraits('kurapika')).toBe(first)
  const second = fightLivingPortraits('hisoka')
  const portrait = 'data:image/webp;base64,portrait'
  const expected = { calm: portrait, strained: portrait, critical: portrait }
  expect(await Promise.all([first, second])).toEqual([expected, expected])
  expect(probe.peak).toBe(1)
  expect(probe.active).toBe(0)
  expect(probe.draws).toBe(6)
  expect(probe.releases).toBe(2)
  expect(await fightIdentityPortrait('kurapika')).toBe(portrait)
  expect(probe.draws).toBe(6)
})

it('keeps the HUD usable if WebGL portraits are unavailable', async () => {
  vi.stubGlobal('document', { createElement: () => ({}) })
  probe.fail = true
  expect(await fightIdentityPortrait('benjamin')).toBeNull()
  expect(probe.active).toBe(0)
})
