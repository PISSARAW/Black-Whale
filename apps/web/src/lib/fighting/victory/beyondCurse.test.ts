import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { buildFightFigure } from '../fighterFigure'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { selectVictory } from './catalogue'
import { createVictoryPlayback } from './playback'
import { get } from 'svelte/store'
import { createVictoryRenderer } from './renderer'
import { BEYOND_CURSE_CARRIERS, BEYOND_CURSE_PRINCES } from './beyondCurseSelection'
import type { FighterId, FightSide, FightState } from '../types'
import { createBeyondCurseFilm } from '../../../../demos/fighting-showcase/beyondCurseFilm'
import { visibleVictoryBounds } from './bodyBounds'

function result(prince: FighterId, carrier: FighterId, side: FightSide = 'player'): FightState {
  const state = createFight(
    side === 'player' ? prince : carrier,
    side === 'player' ? carrier : prince,
  )
  const loser = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    phase: 'finished',
    winner: side,
    finishReason: 'knockout',
    [loser]: { ...state[loser], health: 0 },
  }
}

function snapshot(root: THREE.Object3D) {
  const nodes: unknown[] = []
  root.traverse((node) =>
    nodes.push([
      node.uuid,
      node.position.toArray(),
      node.quaternion.toArray(),
      node.scale.toArray(),
      node.visible,
      node instanceof THREE.Mesh
        ? [
            node.geometry.uuid,
            ...(Array.isArray(node.material) ? node.material : [node.material]).map((m) => m.uuid),
          ]
        : null,
    ]),
  )
  return JSON.stringify(nodes)
}

function expectBodyInFrame(root: THREE.Object3D, camera: THREE.PerspectiveCamera) {
  const box = visibleVictoryBounds(root)
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const p = new THREE.Vector3(x, y, z).project(camera)
        expect(Math.abs(p.x)).toBeLessThan(0.99)
        expect(Math.abs(p.y)).toBeLessThan(0.86)
      }
}

describe('Beyond post-mortem cinematic selection', () => {
  it('prioritizes the carrier death branch only for princes, for either match side', () => {
    for (const carrier of BEYOND_CURSE_CARRIERS)
      for (const prince of FIGHTING_ROSTER)
        for (const side of ['player', 'opponent'] as const) {
          const state = result(prince.id, carrier, side)
          const selected = selectVictory(state)
          const eligible = (BEYOND_CURSE_PRINCES as readonly string[]).includes(prince.id)
          expect(selected?.variant?.startsWith('beyond-curse-') ?? false).toBe(eligible)
          if (eligible) {
            expect(selected?.fighter).toBe(prince.id)
            expect(selected?.winner).toBe(side)
            expect(selected?.variant).toBe(`beyond-curse-${carrier}`)
          }
        }
  })
  it('does not equate every lost match, simulation or points decision with a death', () => {
    const state = result('benjamin', 'longhi')
    for (const reason of ['hits', 'time', 'technical-knockout', 'expulsion', null] as const)
      expect(selectVictory({ ...state, finishReason: reason })?.variant).toBeUndefined()
    expect(
      selectVictory({ ...state, opponent: { ...state.opponent, health: 1 } })?.variant,
    ).toBeUndefined()
    expect(selectVictory({ ...state, mode: 'training' })).toBeNull()
    expect(selectVictory({ ...state, forecastSimulation: true })).toBeNull()
    expect(selectVictory({ ...state, winner: 'draw' })).toBeNull()
    expect(selectVictory(result('longhi', 'benjamin'))?.variant).toBeUndefined()
    expect(selectVictory(result('furykov', 'benjamin'))?.variant).toBeUndefined()
    expect(selectVictory(result('benjamin', 'bill'))?.variant).toBeUndefined()
  })
  it('keeps the prince as the winner across pause, skip and rematch', () => {
    const state = result('halkenburg', 'furykov', 'opponent')
    const playback = createVictoryPlayback(),
      source = JSON.stringify(state)
    playback.observe(state)
    playback.sceneReady()
    playback.advance(3)
    playback.advance(3, true)
    expect(get(playback)?.elapsed).toBe(3)
    expect(get(playback)?.winner).toBe('opponent')
    playback.skip()
    expect(get(playback)?.active).toBe(false)
    playback.observe({ ...state, phase: 'ready' })
    playback.observe(state)
    expect(get(playback)?.elapsed).toBe(0)
    expect(get(playback)?.variant).toBe('beyond-curse-furykov')
    expect(JSON.stringify(state)).toBe(source)
  })
})

describe('Beyond post-mortem staging', () => {
  it.each(BEYOND_CURSE_CARRIERS)(
    'keeps %s dead, uses native falls for both bodies and restores everything',
    (carrier) => {
      for (const prince of BEYOND_CURSE_PRINCES) {
        const state = result(prince, carrier, prince === 'benjamin' ? 'opponent' : 'player')
        const scene = new THREE.Scene(),
          scenery = new THREE.Group()
        const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 50)
        const build = (fighter: typeof state.player) => {
          const model = buildFightFigure({
            THREE,
            fighter,
            glow: (color, opacity = 1) =>
              new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
          })
          model.animate(0, 'idle', {
            motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }),
          })
          return model.root
        }
        const models = { player: build(state.player), opponent: build(state.opponent) }
        scene.add(scenery, models.player, models.opponent)
        const before = snapshot(scene),
          source = JSON.stringify(state)
        const geometry = new Set<THREE.BufferGeometry>()
        scene.traverse((node) => {
          if (node instanceof THREE.Mesh) geometry.add(node.geometry)
        })
        const disposed = [...geometry].map((g) => vi.spyOn(g, 'dispose'))
        const renderer = createVictoryRenderer({ scene, scenery, camera })
        const frame = selectVictory(state)!
        try {
          for (const age of [
            0, 45, 60, 72, 120, 156, 180, 222, 234, 270, 306, 348, 390, 431, 432, 480, 570,
          ]) {
            const restore = renderer.apply({
              state,
              models,
              comfort: defaultFightComfort(),
              frame: { ...frame, active: true, elapsed: age / 60 },
            })!
            const audit = scene.userData.beyondCurseVictory
            expect(audit.carrierDead).toBe(age >= 72)
            expect(audit.princeDead).toBe(age >= 432)
            expect(audit.active).toBe(age >= 234)
            if (age === 60) expect(audit.impactError, `${prince} / ${carrier}`).toBeLessThan(0.01)
            audit.errors.forEach((error: number) => expect(error).toBeLessThan(0.06))
            if (age >= 120) {
              expect(audit.carrierFall.floor).toBeCloseTo(0.012, 5)
              expect(Math.abs(audit.carrierFall.upY)).toBeLessThan(0.15)
              expect(Math.abs(audit.carrierFall.roll)).toBeLessThan(0.05)
            }
            if (age >= 480) {
              expect(audit.princeFall.floor).toBeCloseTo(0.012, 5)
              expect(Math.abs(audit.princeFall.upY)).toBeLessThan(0.15)
              expect(Math.abs(audit.princeFall.roll)).toBeLessThan(0.05)
            }
            expect(models.player.visible && models.opponent.visible).toBe(true)
            if (age < 144 || age >= 432) {
              expectBodyInFrame(models.player, camera)
              expectBodyInFrame(models.opponent, camera)
            }
            restore()
            expect(snapshot(scene), `${prince}, ${carrier}, age ${age}`).toBe(before)
            expect(JSON.stringify(state)).toBe(source)
          }
          let fixedCamera: string | undefined
          camera.aspect = 390 / 844
          camera.updateProjectionMatrix()
          for (const age of [0, 180, 270, 390, 480, 570]) {
            const restore = renderer.apply({
              state,
              models,
              comfort: { ...defaultFightComfort(), camera: 0, flashes: false },
              frame: { ...frame, active: true, elapsed: age / 60 },
            })!
            const pose = JSON.stringify([camera.position.toArray(), camera.quaternion.toArray()])
            fixedCamera ??= pose
            expect(pose).toBe(fixedCamera)
            expectBodyInFrame(models.player, camera)
            expectBodyInFrame(models.opponent, camera)
            restore()
            expect(snapshot(scene)).toBe(before)
          }
        } finally {
          renderer.dispose()
        }
        disposed.forEach((spy) => expect(spy).not.toHaveBeenCalled())
      }
    },
  )
  it.each(BEYOND_CURSE_CARRIERS)(
    'validates a native princely knockout for %s without triggering a simulation curse',
    (carrier) => {
      for (const side of ['player', 'opponent'] as const) {
        const film = createBeyondCurseFilm({ carrier, side })
        expect(film.report.physicalKnockout).toBe(true)
        expect(film.state[side].health).toBeGreaterThan(0)
        expect(selectVictory(film.state)?.variant).toBe(`beyond-curse-${carrier}`)
        expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
      }
    },
  )
})
