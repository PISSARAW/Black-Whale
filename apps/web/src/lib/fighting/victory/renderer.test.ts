import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { createFeitanScene } from '../feitanScene'
import { defaultFightComfort } from '../fightComfort'
import { VICTORY_FIGHTERS, selectVictory } from './catalogue'
import { createVictoryRenderer } from './renderer'
import { drawVictoryFrame } from './draw'
import type { FighterId, FightSide, FightState } from '../types'

// The card's canvas printing is covered by the real browser fixture.
vi.mock('./card', () => ({ createVictoryCard: () => new THREE.Group() }))

function snapshot(root: THREE.Object3D) {
  const nodes: unknown[] = []
  root.traverse((node) =>
    nodes.push({
      id: node.uuid,
      p: node.position.toArray(),
      q: node.quaternion.toArray(),
      s: node.scale.toArray(),
      v: node.visible,
      materials:
        node instanceof THREE.Mesh
          ? (Array.isArray(node.material) ? node.material : [node.material]).map((m) => m.uuid)
          : null,
    }),
  )
  return nodes
}
function setup(winner: FighterId, side: FightSide) {
  const target = winner === 'franklin' ? 'marayam' : 'franklin'
  const state: FightState = {
    ...createFight(side === 'player' ? winner : target, side === 'player' ? target : winner),
    phase: 'finished',
    winner: side,
  }
  const glow = (color: number, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }).root,
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }).root,
  }
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 100),
    scenery = new THREE.Group()
  scenery.add(
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0xabcdef })),
  )
  scene.add(scenery, models.player, models.opponent)
  camera.position.set(1, 2, 8)
  models.player.position.set(-4, 0, 0)
  models.opponent.position.set(4, 0, 0)
  const armour = createFeitanScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (s) => models[s],
  })
  armour.sync(state, 0)
  const renderer = createVictoryRenderer({ scene, camera, scenery })
  return { renderer, state, models, camera, scene, armour }
}
describe('live victory renderer', () => {
  for (const fighter of VICTORY_FIGHTERS)
    for (const side of ['player', 'opponent'] as const) {
      it(`${fighter} uses the actual ${side} winner and restores the native scene after every shot`, () => {
        const fixture = setup(fighter, side)
        const { state, scene, models, camera, renderer } = fixture
        const before = snapshot(scene),
          initialState = JSON.stringify(state)
        const initialCamera = [...camera.position.toArray(), ...camera.quaternion.toArray()]
        try {
          for (const elapsed of [0, 1.6, 2.6, 3.5, 4.5, 5.7, 8, 9.99]) {
            const restore = renderer.apply({
              state,
              models,
              comfort: defaultFightComfort(),
              frame: { ...selectVictory(state)!, active: true, elapsed },
            })!
            expect(scene.userData.victory.target).toBe(
              state[side === 'player' ? 'opponent' : 'player'].id,
            )
            expect(scene.userData.victory.stage).toBe(state.environment.stageId)
            expect(Number.isFinite(camera.position.length())).toBe(true)
            expect(models[side].visible).toBe(true)
            restore()
            expect(snapshot(scene)).toEqual(before)
            expect([...camera.position.toArray(), ...camera.quaternion.toArray()]).toEqual(
              initialCamera,
            )
            expect(JSON.stringify(state)).toBe(initialState)
          }
          const restore = renderer.apply({
            state,
            models,
            comfort: { ...defaultFightComfort(), camera: 0, flashes: false },
            frame: { ...selectVictory(state)!, active: true, elapsed: 4.7 },
          })!
          scene.traverse((node) => {
            if (!(node instanceof THREE.Mesh) || node.parent === null) return
            const materials = Array.isArray(node.material) ? node.material : [node.material]
            const cinematic = scene.children.find(
              (root) => root === node || root.getObjectById(node.id) === node,
            )
            if (
              !cinematic ||
              [models.player, models.opponent, scene.children[0]].includes(cinematic)
            )
              return
            if (materials.some((material) => material.blending === THREE.AdditiveBlending)) {
              let ancestor: THREE.Object3D | null = node,
                hidden = false
              while (ancestor) {
                hidden ||= !ancestor.visible
                ancestor = ancestor.parent
              }
              expect(hidden).toBe(true)
            }
          })
          restore()
          expect(snapshot(scene)).toEqual(before)
        } finally {
          renderer.dispose()
          fixture.armour.dispose()
        }
      })
    }
  it('restores a partially staged scene when an asset fails, then still draws the result', () => {
    const fixture = setup('franklin', 'player')
    const { scene, renderer, models, state, camera } = fixture
    models.player.getObjectByName('hand-right')!.removeFromParent()
    const before = snapshot(scene),
      failed = vi.fn(),
      draw = vi.fn()
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      drawVictoryFrame({
        victory: renderer,
        input: {
          state,
          models,
          frame: { ...selectVictory(state)!, active: true, elapsed: 3 },
          comfort: defaultFightComfort(),
        },
        draw,
        failed,
      })
      expect(failed).toHaveBeenCalledOnce()
      expect(draw).toHaveBeenCalledOnce()
      expect(snapshot(scene)).toEqual(before)
      expect(camera.position.toArray()).toEqual([1, 2, 8])
    } finally {
      silence.mockRestore()
      renderer.dispose()
      fixture.armour.dispose()
    }
  })
})
