import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip } from './blueprint'
import { ConcertStageView } from './ConcertStageView'
import { ConcertDreamView, CONCERT_DREAM_LAYER } from './ConcertDreamView'
import type { SceneRuntime } from './TourRenderer'
import { ConcertLandscapeWalk, concertLandscapeHeight } from './concertLandscapeWalk'
import { buildConcertLandscape } from './concertLandscape'
import { disposeBanquetDetails } from './banquetDetailBuilder'

const spec = { origin: [-1, 27.25] as const, floor: 127.4, stageRise: 1.4 }
const playing = { mode: 'melody', playing: true } as const
const context = { tierId: 'tier-1', reveal: false }

describe('the three-minute flowered listening landscape', () => {
  it('supports Melody and the audience, then offers a bounded walk beyond the physical hall', () => {
    expect(concertLandscapeHeight(spec, spec.origin)).toBeCloseTo(128.8)
    expect(concertLandscapeHeight(spec, [-1, 22.5])).toBeCloseTo(127.4)
    const body = [-1, 22.5] as const
    const walk = new ConcertLandscapeWalk(spec, body)
    walk.move([0, 3], 10)
    expect(walk.at).toEqual([-1, 52.5])
    expect(body).toEqual([-1, 22.5])
    expect(Number.isFinite(walk.floor)).toBe(true)
    walk.move([1000, 1000], 10)
    expect(Math.hypot(walk.at[0] + 1, walk.at[1] - 27.25)).toBeCloseTo(64)
  })

  it.each([
    [-1, 0],
    [-1, 22.5],
  ])('replaces both banquet spaces from %j without mutating the ship', (x, z) => {
    const scene = new THREE.Scene()
    const fog = new THREE.FogExp2(0x151515, 0.04)
    const background = new THREE.Color(0x101010)
    scene.fog = fog
    scene.background = background
    const camera = new THREE.PerspectiveCamera(68, 1.6, 0.1, 220)
    camera.layers.enable(2)
    const mask = camera.layers.mask
    const furniture = new THREE.Object3D()
    const melody = new THREE.Group()
    const child = new THREE.Object3D()
    child.layers.set(3)
    melody.add(child)
    scene.add(furniture, melody)
    const view = new ConcertStageView(THREE, scene, theShip())
    const at = [x, z] as const
    view.move(playing, { ...context, at, velocity: [0, 3], delta: 2 })
    view.render(
      { camera, actors: { 'cast:melody': { root: melody } }, seconds: 3, yaw: 0 },
      playing,
    )
    expect(camera.position.z).toBe(z + 6)
    expect(camera.layers.mask).toBe(1 << CONCERT_DREAM_LAYER)
    expect(camera.layers.test(furniture.layers)).toBe(false)
    expect(camera.layers.test(child.layers)).toBe(true)
    expect(camera.far).toBe(420)
    expect(scene.fog).not.toBe(fog)
    expect(furniture.visible).toBe(true)
    expect(
      view.move(
        { ...playing, playing: false },
        {
          ...context,
          at,
          velocity: [0, 3],
          delta: 1,
        },
      ),
    ).toEqual([0, 0])
    expect(camera.layers.mask).toBe(mask)
    expect(camera.far).toBe(220)
    expect(child.layers.mask).toBe(1 << 3)
    expect(scene.fog).toBe(fog)
    expect(scene.background).toBe(background)
    view.move(playing, { ...context, at, velocity: [0, 0], delta: 1 })
    view.render({ camera, actors: {}, seconds: 4, yaw: 0 }, playing)
    expect(camera.position.z).toBe(z)
    view.dispose()
    expect(camera.layers.mask).toBe(mask)
    expect(scene.fog).toBe(fog)
  })

  it('draws thousands of daisies, an open sky and mountain ridges within a fixed geometry budget', () => {
    const root = buildConcertLandscape(THREE, spec)
    let triangles = 0
    let flowers = 0
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const count = object instanceof THREE.InstancedMesh ? object.count : 1
      if (object instanceof THREE.InstancedMesh) flowers += count
      const geometry = object.geometry
      triangles += ((geometry.index?.count ?? geometry.attributes.position.count) / 3) * count
      geometry.computeBoundingBox()
      const bounds = geometry.boundingBox!
      expect(Number.isFinite(bounds.min.y)).toBe(true)
      expect(Number.isFinite(bounds.max.y)).toBe(true)
    })
    expect(flowers).toBeGreaterThan(12000)
    expect(triangles).toBeLessThan(220000)
    expect(root.getObjectByName('concert-open-sky')).toBeDefined()
    expect(root.getObjectByName('concert-alpine-ridge-3')).toBeDefined()
    disposeBanquetDetails(root)
  })

  it('keeps the carried flute with the walking viewpoint and restores the ship’s optical passes', () => {
    const scene = new THREE.Scene()
    const dream = new ConcertDreamView(THREE, scene)
    const camera = new THREE.PerspectiveCamera()
    const flute = new THREE.Group()
    const pass = { enabled: true }
    const runtime = {
      renderer: { toneMappingExposure: 0.3 },
      grade: null,
      shafts: pass,
      depthOfField: null,
      motionBlur: null,
      ssr: null,
      refraction: { uniforms: { uAmount: { value: 0.5 } } },
    } as unknown as SceneRuntime
    const walk = new ConcertLandscapeWalk(spec, spec.origin)
    walk.move([2, 0], 6)
    dream.apply({ camera, actors: { flute: { root: flute } }, seconds: 3, yaw: 0, runtime }, walk, {
      mode: 'self',
      playing: true,
    })
    expect(flute.position.distanceTo(camera.position)).toBeLessThan(0.7)
    expect(flute.position.x).toBeGreaterThan(10)
    expect(pass.enabled).toBe(false)
    expect(runtime.renderer.toneMappingExposure).toBe(1)
    expect(runtime.refraction!.uniforms.uAmount.value).toBe(0)
    dream.restore()
    expect(pass.enabled).toBe(true)
    expect(flute.layers.mask).toBe(1)
  })
})
