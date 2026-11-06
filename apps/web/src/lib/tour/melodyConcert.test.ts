import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip } from './blueprint'
import { EMPTY_WORLD } from './hatsu'
import { castApparitions } from './cast/distribution'
import { buildHumanFigure } from './humanFigure'
import { ConcertStageView } from './ConcertStageView'
import { standingSurface } from './standingSurface'
import { SurfaceWalker } from './SurfaceWalker'
import { positionHeldFlute } from './heldFlute'
import { BANQUET_SERVICE } from './banquetView'
import {
  concertCast,
  concertWorld,
  beginPlayerConcert,
  endPlayerConcert,
  concertPosition,
  MELODY_CONCERT,
} from './melodyConcert'

const ship = theShip()
const plan = ship.plans.get('tier-1')!

describe('Melody’s requested concert and the visitor’s performance', () => {
  it('keeps the playing flute inside the first-person frame at every heading', () => {
    const camera = new THREE.PerspectiveCamera(68, 1.6, 0.1, 100)
    camera.position.set(-1, 130.5, 27.25)
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      camera.rotation.set(0, yaw, 0)
      camera.updateMatrixWorld(true)
      const flute = new THREE.Object3D()
      positionHeldFlute(flute, camera.position, { yaw, playing: true, seconds: 1 })
      const screen = flute.position.clone().project(camera)
      expect(Math.abs(screen.x)).toBeLessThan(1)
      expect(Math.abs(screen.y)).toBeLessThan(0.9)
      expect(screen.z).toBeLessThan(1)
    }
  })
  it('stages the named, source-backed performer even when the timeline is unavailable', () => {
    const posts = concertCast([], {
      ship,
      cap: null,
      performance: { mode: 'melody', playing: true },
    })
    expect(posts).toHaveLength(1)
    expect(posts[0]).toMatchObject({
      member: { characterId: 'melody', since: 'ch-383' },
      spaceId: BANQUET_SERVICE,
      pose: 'flute',
      costume: { dress: 'suit' },
    })
    const [seen] = castApparitions(ship, posts)
    expect(seen.y).toBeCloseTo(128.8)
    expect(standingSurface(plan, seen.at)).toBe(seen.y)
    const idle = concertCast(posts, {
      ship,
      cap: null,
      performance: { mode: 'melody', playing: false },
    })
    expect(idle).toHaveLength(1)
    expect(idle[0].pose).toBe('idle')
    expect(
      concertCast(posts, { ship, cap: null, performance: { mode: 'self', playing: true } }),
    ).toEqual([])
    expect(
      concertCast([], { ship, cap: 382, performance: { mode: 'melody', playing: true } }),
    ).toEqual([])
  })

  it('opens the flower effect across the entire continuous hall without changing the underlying world', () => {
    const projected = concertWorld(EMPTY_WORLD, { mode: 'melody', playing: true })
    expect(projected.flowered).toEqual(
      expect.arrayContaining(['tier-1-banquet-hall', BANQUET_SERVICE]),
    )
    expect(projected.holding).toBe(EMPTY_WORLD.holding)
    expect(EMPTY_WORLD.flowered).toEqual([])
    expect(concertWorld(EMPTY_WORLD, { mode: 'melody', playing: false })).toBe(EMPTY_WORLD)
    expect(MELODY_CONCERT.durationSeconds).toBe(180)
  })

  it('plays the visitor’s actual Melody Hatsu and restores only the effects that concert added', () => {
    const before = { ...EMPTY_WORLD, flowered: ['tier-1-banquet-hall'] }
    const playing = beginPlayerConcert(before, ship)
    expect(playing.world).toMatchObject({
      holding: 'melody',
      body: { playing: 'bloom', soothed: true },
    })
    expect(playing.world.flowered).toContain(BANQUET_SERVICE)
    const after = endPlayerConcert(playing.world, playing.restore)
    expect(after.flowered).toEqual(before.flowered)
    expect(after.body.playing).toBe(before.body.playing)
    const existing = beginPlayerConcert({ ...before, flowered: [BANQUET_SERVICE] }, ship)
    expect(endPlayerConcert(existing.world, existing.restore).flowered).toEqual([BANQUET_SERVICE])
  })

  it.each([-5, 3])(
    'walks from the tables up stage stair %s, across the plateau and back down',
    (x) => {
      const walker = new SurfaceWalker()
      let at: readonly [number, number] = [-1, 19.5]
      for (const to of [
        [-1, 22.5],
        [x, 23.8],
        [x, 27.1],
        [-1, 27.1],
      ] as const) {
        at = walker.move(plan, { from: at, to, extras: [], ghost: false })
        expect(at[0]).toBeCloseTo(to[0])
        expect(at[1]).toBeCloseTo(to[1])
      }
      expect(walker.floor(plan, at)).toBeCloseTo(128.8)
      for (const to of [
        [x, 27.1],
        [x, 23.8],
        [-1, 22.5],
        [-1, 19.5],
      ] as const) {
        at = walker.move(plan, { from: at, to, extras: [], ghost: false })
        expect(at[0]).toBeCloseTo(to[0])
        expect(at[1]).toBeCloseTo(to[1])
      }
      expect(walker.floor(plan, at)).toBe(128)
      expect(walker.reset(plan, concertPosition())).toBeCloseTo(128.8)
    },
  )

  it('holds the flute at mouth height with both hands while leaving ordinary poses unchanged', () => {
    const [seen] = castApparitions(
      ship,
      concertCast([], { ship, cap: null, performance: { mode: 'melody', playing: true } }),
    )
    expect(seen.kind).toBe('avatar')
    const human = buildHumanFigure({
      THREE,
      seen: { ...seen, kind: 'avatar' },
      glow: (colour, opacity) =>
        new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
    })
    const flute = human.root.getObjectByName('signature-flute')!
    expect(flute.position.y).toBeGreaterThan(1.5)
    expect(flute.scale.y).toBeGreaterThan(2)
    human.root.updateMatrixWorld(true)
    const tube = new THREE.Box3().setFromObject(flute)
    for (const name of ['hand-left', 'hand-right']) {
      const hand = human.root.getObjectByName(name)!
      const point = hand.getWorldPosition(new THREE.Vector3())
      expect(tube.distanceToPoint(point), name).toBeLessThan(0.09)
    }
  })

  it('opens the alpine vision only during the concert and releases its geometry', () => {
    const scene = new THREE.Scene()
    const view = new ConcertStageView(THREE, scene, ship)
    expect(view.root.visible).toBe(false)
    view.update({ mode: 'melody', playing: true }, { tierId: 'tier-1', reveal: false })
    expect(view.root.visible).toBe(true)
    const bounds = new THREE.Box3().setFromObject(view.root)
    expect(bounds.max.y).toBeGreaterThan(170)
    expect(view.root.getObjectByName('concert-open-sky')).toBeDefined()
    expect(view.root.getObjectByName('concert-flower-field')).toBeDefined()
    view.update({ mode: 'self', playing: true }, { tierId: 'tier-1', reveal: true })
    expect(view.root.visible).toBe(false)
    const disposed: ReturnType<typeof vi.spyOn>[] = []
    view.root.traverse((object) => {
      if (object instanceof THREE.Mesh) disposed.push(vi.spyOn(object.geometry, 'dispose'))
      if (object instanceof THREE.InstancedMesh) disposed.push(vi.spyOn(object, 'dispose'))
    })
    view.dispose()
    expect(view.root.parent).toBeNull()
    for (const spy of disposed) expect(spy).toHaveBeenCalledOnce()
  })

  it('leaves shared-renderer games without a banquet hall untouched', () => {
    const scene = new THREE.Scene()
    const view = new ConcertStageView(THREE, scene, { ...ship, spaces: new Map() })
    view.update({ mode: 'self', playing: true }, { tierId: 'tier-1', reveal: false })
    expect(view.root.visible).toBe(false)
    expect(scene.children).toHaveLength(0)
    view.dispose()
  })
})
