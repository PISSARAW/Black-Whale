import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { theShip } from './blueprint'
import { DINING_VISIT_SPACES } from './diningVisit'
import { prepareStairLandings } from './stairLandingWarmup'
import type { BuiltTierView, TierRoomView } from './TierView'
import type { SceneRuntime } from './TourRenderer'

const ship = theShip()

function room(spaceId: string): TierRoomView {
  return {
    spaceId,
    mesh: new THREE.Mesh(),
    edges: new THREE.LineSegments(),
    seams: new THREE.LineSegments(),
    patterns: new THREE.LineSegments(),
    fittings: new THREE.Mesh(),
    panes: null,
    motes: null,
    dust: null,
    details: null,
    doors: null,
  }
}

function deck(spaceId: string, outside: string): BuiltTierView {
  const root = new THREE.Group()
  const rooms = [room(spaceId), room(outside)]
  root.add(...rooms.map(({ mesh }) => mesh))
  return { root, rooms, lampAir: null }
}

function fixture() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const originalTarget = new THREE.WebGLRenderTarget()
  const render = vi.fn()
  const renderer = {
    render,
    getRenderTarget: () => originalTarget,
    setRenderTarget: vi.fn(),
  }
  const runtime = {
    scene,
    camera,
    renderer,
    composer: { readBuffer: originalTarget },
    quality: { viewDepth: 1 },
  } as unknown as SceneRuntime
  const upper = deck(DINING_VISIT_SPACES.passage, 'other')
  const lower = deck(DINING_VISIT_SPACES.landing, 'other')
  scene.add(lower.root, new THREE.PointLight())
  lower.rooms[0].mesh.visible = false
  const decks = new Map([['tier-5', lower]])
  const buildSteps = vi.fn(function* (_tier: string) {
    yield
    yield
    return upper
  })
  const warmup = prepareStairLandings({
    THREE,
    runtime,
    ship,
    buildSteps,
    readDeck: (id) => decks.get(id),
    cacheDeck: (id, built) => decks.set(id, built),
    canPrepare: () => true,
    readPlan: (id) => ship.plans.get(id)!,
  })
  return { warmup, render, renderer, originalTarget, buildSteps, scene, upper, lower }
}

describe('deck 4–5 stair warmup', () => {
  it('leaves the first frames clear, draws both landings incrementally, and restores the scene', () => {
    const f = fixture()
    const draws: unknown[] = []
    f.render.mockImplementation((scene: THREE.Scene) => {
      const rendered = [f.upper, f.lower].find(({ rooms }) => rooms[0].mesh.parent === scene)
      draws.push({
        separated: scene !== f.scene,
        light: scene.children.some((child) => child instanceof THREE.PointLight),
        visible: rendered?.rooms[0].mesh.visible,
        landingCulled: rendered?.rooms[0].mesh.frustumCulled,
      })
    })

    f.warmup.frame('tier-3', performance.now())
    f.warmup.frame('tier-5', performance.now())
    expect(f.buildSteps).not.toHaveBeenCalled()
    expect(f.render).not.toHaveBeenCalled()

    for (let i = 0; i < 5; i++) f.warmup.frame('tier-5', performance.now() + 400)
    expect(f.buildSteps.mock.calls).toEqual([['tier-4']])
    const warmDraw = { separated: true, light: true, visible: true, landingCulled: false }
    expect(draws).toEqual([warmDraw, warmDraw])
    expect(f.renderer.setRenderTarget).toHaveBeenLastCalledWith(f.originalTarget)
    expect(f.lower.root.parent).toBe(f.scene)
    expect(f.lower.rooms[0].mesh.parent).toBe(f.lower.root)
    expect(f.lower.rooms[0].mesh.visible).toBe(false)
    expect(f.lower.rooms[0].mesh.frustumCulled).toBe(true)
  })

  it('queues an early crossing until the destination is ready', () => {
    const f = fixture()
    const arrive = vi.fn()
    const valid = vi.fn(() => true)
    const crossing = {
      from: DINING_VISIT_SPACES.landing,
      to: DINING_VISIT_SPACES.passage,
      valid,
      arrive,
    }
    expect(f.warmup.cross(crossing)).toBe(true)
    expect(f.buildSteps).not.toHaveBeenCalled()
    expect(arrive).not.toHaveBeenCalled()
    for (let i = 0; i < 4; i++) f.warmup.frame('tier-5', performance.now() + 400)
    expect(arrive).toHaveBeenCalledTimes(1)
    expect(f.warmup.cross(crossing)).toBe(false)
  })

  it('discards an early crossing if the visitor moves away', () => {
    const f = fixture()
    const arrive = vi.fn()
    const valid = vi.fn(() => false)
    expect(
      f.warmup.cross({
        from: DINING_VISIT_SPACES.landing,
        to: DINING_VISIT_SPACES.passage,
        valid,
        arrive,
      }),
    ).toBe(true)
    for (let i = 0; i < 4; i++) f.warmup.frame('tier-5', performance.now() + 400 * i)
    expect(arrive).not.toHaveBeenCalled()
  })
})
