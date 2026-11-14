import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip } from './blueprint'
import { ConcertStageView } from './ConcertStageView'
import { ConcertDreamView, CONCERT_DREAM_LAYER } from './ConcertDreamView'
import type { SceneRuntime } from './TourRenderer'
import { ConcertLandscapeWalk, concertLandscapeHeight } from './concertLandscapeWalk'
import { buildConcertLandscape, MANGA_MOUNTAIN_PROFILES } from './concertLandscape'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { CONCERT_REFERENCE, concertReferencePosition } from './concertReference'

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

  it('anchors the chapter composition at Melody’s double-page scale', () => {
    expect(concertReferencePosition(spec)).toEqual([-1, 20.05])
    expect(CONCERT_REFERENCE.fov).toBe(52)
    expect(CONCERT_REFERENCE.melodyScreenHeight).toBeCloseTo(0.23)
    expect(CONCERT_REFERENCE.horizonScreenHeight).toBeCloseTo(0.47)
  })

  it('uses that composition for a requested manga concert', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera()
    const view = new ConcertStageView(THREE, scene, theShip())
    const performance = { ...playing, presentation: 'manga' as const }
    for (let frame = 0; frame < 12; frame++)
      view.move(performance, { ...context, at: [-1, 22.5], velocity: [0, 0], delta: 0.1 })
    view.render({ camera, actors: {}, seconds: 2, yaw: 0 }, performance)
    expect(camera.position.x).toBeCloseTo(-1)
    expect(camera.position.z).toBeCloseTo(20.05)
    expect(camera.fov).toBe(52)
    const direction = camera.getWorldDirection(new THREE.Vector3())
    expect(direction.z).toBeGreaterThan(0.99)
    view.move(performance, {
      ...context,
      at: [-1, 22.5],
      velocity: [2, 0],
      delta: 1,
    })
    view.render({ camera, actors: {}, seconds: 3, yaw: 0 }, performance)
    expect(camera.position.x).toBeCloseTo(1)
    const recentered = { ...performance, referenceRequest: 1 }
    view.move(recentered, {
      ...context,
      at: [-1, 22.5],
      velocity: [0, 0],
      delta: 0.1,
    })
    view.render({ camera, actors: {}, seconds: 4, yaw: 0 }, recentered)
    expect(camera.position.x).toBeCloseTo(-1)
    view.dispose()
    expect(camera.fov).toBe(50)
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
    for (let frame = 0; frame < 12; frame++)
      view.move(playing, { ...context, at, velocity: [0, 3], delta: 0.1 })
    view.render(
      { camera, actors: { 'cast:melody': { root: melody } }, seconds: 3, yaw: 0 },
      playing,
    )
    expect(camera.position.z).toBeCloseTo(z + 3.6)
    expect(camera.layers.mask).toBe(1 << CONCERT_DREAM_LAYER)
    expect(camera.layers.test(furniture.layers)).toBe(false)
    expect(camera.layers.test(child.layers)).toBe(true)
    expect(camera.far).toBe(420)
    expect(scene.fog).not.toBe(fog)
    expect(furniture.visible).toBe(true)
    for (let frame = 0; frame < 8; frame++)
      view.move({ ...playing, playing: false }, { ...context, at, velocity: [0, 3], delta: 0.1 })
    expect(camera.layers.mask).toBe(mask)
    expect(camera.far).toBe(220)
    expect(child.layers.mask).toBe(1 << 3)
    expect(scene.fog).toBe(fog)
    expect(scene.background).toBe(background)
    view.move(playing, { ...context, at, velocity: [0, 0], delta: 1 })
    view.render({ camera, actors: { 'cast:melody': undefined }, seconds: 4, yaw: 0 }, playing)
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
    expect(flowers).toBeGreaterThan(16000)
    expect(triangles).toBeLessThan(220000)
    expect(root.getObjectByName('concert-open-sky')).toBeDefined()
    expect(root.getObjectByName('concert-sky-radial-ink')).toBeDefined()
    expect(root.getObjectByName('concert-veiled-sun')).toBeUndefined()
    expect(root.getObjectByName('concert-melody-heart-glow')).toBeDefined()
    expect(root.getObjectByName('concert-airborne-petals')).toBeDefined()
    expect(root.getObjectByName('concert-alpine-ridge-3')).toBeDefined()
    expect(root.getObjectByName('concert-landmark-summit-4')).toBeDefined()
    expect(root.getObjectByName('concert-valley-left-2')).toBeDefined()
    expect(root.getObjectByName('concert-valley-ink-right-2')).toBeDefined()
    expect(root.getObjectByName('concert-valley-hatching-right-2')).toBeDefined()
    expect(root.getObjectByName('concert-panorama-ridge-1')).toBeDefined()
    expect(root.getObjectByName('concert-mixed-wildflowers')).toBeDefined()
    expect(root.getObjectByName('concert-varied-grass')).toBeDefined()
    expect(root.getObjectByName('concert-hero-flowers')).toBeDefined()
    expect(root.getObjectByName('concert-butterflies')).toBeDefined()
    expect(
      (
        (root.getObjectByName('concert-varied-grass') as THREE.InstancedMesh)
          .material as THREE.Material
      ).customProgramCacheKey(),
    ).toBe('concert-meadow-wind-v1')
    disposeBanquetDetails(root)
  })

  it('uses asymmetric authored mountain silhouettes instead of mirrored noise', () => {
    expect(MANGA_MOUNTAIN_PROFILES.left).toHaveLength(4)
    expect(MANGA_MOUNTAIN_PROFILES.right).toHaveLength(4)
    expect(MANGA_MOUNTAIN_PROFILES.left[3]).not.toEqual(MANGA_MOUNTAIN_PROFILES.right[3])
    expect(Math.max(...MANGA_MOUNTAIN_PROFILES.right[3])).toBeGreaterThan(
      Math.max(...MANGA_MOUNTAIN_PROFILES.left[3]),
    )
  })

  it('closes the alpine horizon across all four quadrants for free navigation', () => {
    const root = buildConcertLandscape(THREE, spec)
    const ridge = root.getObjectByName('concert-panorama-ridge-0') as THREE.Mesh
    const positions = ridge.geometry.getAttribute('position')
    let left = false
    let right = false
    let front = false
    let rear = false
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index) - spec.origin[0]
      const z = positions.getZ(index) - spec.origin[1]
      left ||= x < -80
      right ||= x > 80
      front ||= z > 80
      rear ||= z < -80
    }
    expect({ left, right, front, rear }).toEqual({
      left: true,
      right: true,
      front: true,
      rear: true,
    })
    disposeBanquetDetails(root)
  })

  it('builds readable butterflies and pointed tumbling petals instead of round particles', () => {
    const root = buildConcertLandscape(THREE, spec)
    const butterflies = root.getObjectByName('concert-butterflies') as THREE.InstancedMesh
    const petals = root.getObjectByName('concert-airborne-petals') as THREE.InstancedMesh

    expect(butterflies).toBeInstanceOf(THREE.InstancedMesh)
    expect(butterflies.count).toBe(64)
    expect(butterflies.geometry.getAttribute('aWing')).toBeDefined()
    expect(butterflies.geometry.getAttribute('aSeed')).toBeInstanceOf(
      THREE.InstancedBufferAttribute,
    )
    const wings = butterflies.geometry.getAttribute('aWing')
    expect(Array.from({ length: wings.count }, (_, index) => wings.getX(index))).toContain(-1)
    expect(Array.from({ length: wings.count }, (_, index) => wings.getX(index))).toContain(1)
    expect(Array.from({ length: wings.count }, (_, index) => wings.getX(index))).toContain(0)

    expect(petals).toBeInstanceOf(THREE.InstancedMesh)
    expect(petals.count).toBe(900)
    expect(petals.geometry.getAttribute('aDrift')).toBeInstanceOf(THREE.InstancedBufferAttribute)
    petals.geometry.computeBoundingBox()
    const bounds = petals.geometry.boundingBox!
    expect(bounds.max.y).toBeGreaterThan(Math.abs(bounds.min.y))
    expect(bounds.max.x).not.toBeCloseTo(Math.abs(bounds.min.x))
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

  it('holds the audience in a listening reaction during the opening dissolve', () => {
    const scene = new THREE.Scene()
    const dream = new ConcertDreamView(THREE, scene)
    const camera = new THREE.PerspectiveCamera()
    const melody = new THREE.Group()
    const listener = new THREE.Group()
    listener.rotation.x = 0.1
    const walk = new ConcertLandscapeWalk(spec, spec.origin)
    const actors = { 'cast:melody': { root: melody }, 'cast:listener': { root: listener } }
    dream.apply({ camera, actors, seconds: 1, yaw: 0, blend: 0.4 }, walk, playing)
    expect(listener.rotation.x).toBeGreaterThan(0.1)
    expect(camera.layers.test(listener.layers)).toBe(true)
    dream.apply({ camera, actors, seconds: 2, yaw: 0, blend: 1 }, walk, playing)
    expect(listener.rotation.x).toBeCloseTo(0.1)
    expect(camera.layers.test(listener.layers)).toBe(false)
    dream.restore()
  })

  it('replaces Melody’s broad Ten shell with the chapter’s small heart light', () => {
    const scene = new THREE.Scene()
    const dream = new ConcertDreamView(THREE, scene)
    const camera = new THREE.PerspectiveCamera(68, 1.6, 0.1, 220)
    const melody = new THREE.Group()
    const aura = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial())
    aura.name = 'nen-aura-glass'
    melody.add(aura)
    const walk = new ConcertLandscapeWalk(spec, concertReferencePosition(spec))
    const manga = { ...playing, presentation: 'manga' as const }
    dream.apply({ camera, actors: { 'cast:melody': { root: melody } }, seconds: 1, yaw: 0 }, walk, manga)
    expect(aura.visible).toBe(false)
    dream.restore()
    expect(aura.visible).toBe(true)
  })
})
