import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { createFeitanScene } from '../feitanScene'
import { defaultFightComfort } from '../fightComfort'
import { VICTORY_FIGHTERS, selectVictory } from './catalogue'
import { createVictoryRenderer } from './renderer'
import { drawVictoryFrame } from './draw'
import { fightBodyMotion } from '../fightBodyMotion'
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
function setup(winner: FighterId, side: FightSide, targetOverride?: FighterId) {
  const target = targetOverride ?? (winner === 'franklin' ? 'biscuit' : 'franklin')
  const state: FightState = {
    ...createFight(side === 'player' ? winner : target, side === 'player' ? target : winner),
    phase: 'finished',
    winner: side,
  }
  const glow = (color: number, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
  const build = (fighter: FightState['player']) => {
    const model = buildFightFigure({ THREE, glow, fighter })
    if (fighter.id === 'leorio')
      model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
    return model.root
  }
  const models = { player: build(state.player), opponent: build(state.opponent) }

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
  it('keeps Camilla’s wide camera still when camera movement is disabled', () => {
    const fixture = setup('camilla', 'player')
    let first: number[] | undefined
    try {
      for (const age of [130, 270, 330, 420, 500]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: { ...defaultFightComfort(), camera: 0 },
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const pose = [...fixture.camera.position.toArray(), ...fixture.camera.quaternion.toArray()]
        first ??= pose
        expect(pose).toEqual(first)
        restore()
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('adapts Camilla’s paws and preserves the fixed portrait across the eye opening', () => {
    const fixture = setup('camilla', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    let portrait: unknown
    try {
      for (const age of [170, 250, 330, 420, 510, 553, 558, 590]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.camillaVictory
        if (age >= 153 && age < 357)
          audit.contacts.forEach((paw: { error: number }) =>
            expect(paw.error).toBeLessThan(0.04 * audit.ratio),
          )
        if (age === 170 || age === 250) expect(audit.energyVisible).toBe(false)
        if (age === 330) expect(audit.energyVisible).toBe(true)
        if (age >= 357) expect(fixture.models.player.visible).toBe(false)
        if (age >= 510) {
          const current = {
            head: audit.head,
            camera: [...fixture.camera.position.toArray(), ...fixture.camera.quaternion.toArray()],
          }
          portrait ??= current
          expect(current).toEqual(portrait)
          expect(
            fixture.scene.getObjectByName('camilla-cats-name-victory')!.children[0].visible,
          ).toBe(false)
        }
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('anchors Grimmel to the real hands and contacts the target on the release timeline', () => {
    const fixture = setup('halkenburg', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [132, 258, 300, 324, 372, 430]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.halkenburgVictory
        expect(audit.supporters).toBe(3)
        expect(audit.grip).toEqual(
          fixture.models.opponent
            .getObjectByName('hand-left')!
            .getWorldPosition(new THREE.Vector3())
            .toArray(),
        )
        expect(audit.nock).toEqual(
          fixture.models.opponent
            .getObjectByName('hand-right')!
            .getWorldPosition(new THREE.Vector3())
            .toArray(),
        )
        if (age === 324) expect(audit.contactError).toBeLessThan(1e-6)
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('plants Leorio’s floor strike and carries the victim into the ceiling with all state restored', () => {
    const fixture = setup('leorio', 'opponent', 'biscuit')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [102, 330, 348, 386, 420, 465]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.leorioVictory
        if (age === 330) expect(audit.floorHand[1]).toBeLessThan(0.2)
        if (age === 420) {
          expect(audit.progress).toBe(1)
          expect(Math.abs(audit.head[1] - audit.roofHeight)).toBeLessThan(0.2)
          expect(fixture.scene.getObjectByName('leorio-ceiling-impact')!.visible).toBe(true)
        }
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('converges the two fish brands exactly when the book closes, then removes the victim', () => {
    const fixture = setup('chrollo', 'player', 'hisoka')
    const before = snapshot(fixture.scene),
      state = JSON.stringify(fixture.state)
    try {
      for (const age of [218, 330, 389, 390, 410]) {
        const restore = fixture.renderer.apply({
          state: fixture.state,
          models: fixture.models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(fixture.state)!, active: true, elapsed: age / 60 },
        })!
        const audit = fixture.scene.userData.chrolloFishVictory
        expect(audit.fishCount).toBe(2)
        expect(audit.brands).toEqual(['sun', 'moon'])
        if (age === 390) {
          expect(
            new THREE.Vector3(...audit.brandsWorld[0]).distanceTo(
              new THREE.Vector3(...audit.brandsWorld[1]),
            ),
          ).toBeLessThan(0.00001)
          expect(audit.bookClosed).toBe(true)
          expect(fixture.scene.getObjectByName('indoor-fish-sun')!.visible).toBe(false)
          const leaf = fixture.models.player.getObjectByName('book-leaf:1:combat-joint')!
          expect(leaf.rotation.z).toBeCloseTo(Math.PI / 2)
        }
        if (age === 410) expect(fixture.models.opponent.visible).toBe(false)
        restore()
        expect(snapshot(fixture.scene)).toEqual(before)
        expect(JSON.stringify(fixture.state)).toBe(state)
      }
    } finally {
      fixture.renderer.dispose()
      fixture.armour.dispose()
    }
  })
  it('releases temporal copies without disposing the real fighter geometry or material', () => {
    const fixture = setup('tserriednich', 'player')
    let original: THREE.Mesh | undefined
    fixture.models.player.traverse((node) => {
      if (!original && node instanceof THREE.Mesh) original = node
    })
    const geometry = vi.spyOn(original!.geometry, 'dispose')
    const material = Array.isArray(original!.material) ? original!.material[0] : original!.material
    const disposeMaterial = vi.spyOn(material, 'dispose')
    try {
      const restore = fixture.renderer.apply({
        state: fixture.state,
        models: fixture.models,
        comfort: defaultFightComfort(),
        frame: { ...selectVictory(fixture.state)!, active: true, elapsed: 2.2 },
      })!
      expect(fixture.scene.getObjectByName('tserriednich-two-bodies')).toBeDefined()
      restore()
      fixture.renderer.dispose()
      expect(geometry).not.toHaveBeenCalled()
      expect(disposeMaterial).not.toHaveBeenCalled()
    } finally {
      geometry.mockRestore()
      disposeMaterial.mockRestore()
      fixture.armour.dispose()
    }
  })
  for (const fighter of VICTORY_FIGHTERS)
    for (const side of ['player', 'opponent'] as const) {
      it(`${fighter} uses the actual ${side} winner and restores the native scene after every shot`, () => {
        const fixture = setup(fighter, side)
        const { state, scene, models, camera, renderer } = fixture
        const before = snapshot(scene),
          initialState = JSON.stringify(state)
        const initialCamera = [...camera.position.toArray(), ...camera.quaternion.toArray()]
        try {
          for (const elapsed of [0, 1.6, 2.6, 3.5, 4.5, 5.15, 5.7, 6.95, 8, 9.99]) {
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
            if (fighter === 'tserriednich') {
              const future = scene.userData.futureVictory
              expect(future.forecastSeconds).toBe(10)
              expect(future.physicalDivergence).toBe(true)
              if (elapsed >= 7.2) expect(future.actual[0]).not.toBe(future.perceived[0])
              if (elapsed === 6.95) {
                const body = scene.getObjectByName('tserriednich-perceived-body')!
                expect(body.visible).toBe(true)
                expect(body.position.distanceTo(models[side].position)).toBeGreaterThan(0.5)
                body.traverse((node) => {
                  if (!(node instanceof THREE.Mesh)) return
                  const materials = Array.isArray(node.material) ? node.material : [node.material]
                  materials.forEach((material) => {
                    expect(material.opacity).toBe(1)
                    expect(material.transparent).toBe(false)
                    expect(material.depthWrite).toBe(true)
                  })
                })
              }
            }
            if (fighter === 'benjamin') {
              const audit = scene.userData.benjaminVictory
              const palm = models[side]
                .getObjectByName('hand-left')!
                .getWorldPosition(new THREE.Vector3())
              expect(audit.anatomicalHand).toBe('left')
              expect(audit.palm).toEqual(palm.toArray())
              const charge = scene.getObjectByName('benjamin-air-blow-pressure')!.children[0]
              expect(charge.position.distanceTo(palm)).toBeLessThan(1e-6)
              if (elapsed >= 8) expect(audit.salute).toBe(1)
              if (elapsed >= 4.5 && elapsed < 5.6) {
                const victimHead = models[side === 'player' ? 'opponent' : 'player']
                  .getObjectByName('manga-head:franklin-bordeau')!
                  .getWorldPosition(new THREE.Vector3())
                  .project(camera)
                expect(Math.abs(victimHead.x)).toBeLessThan(0.95)
                expect(Math.abs(victimHead.y)).toBeLessThan(0.95)
              }
            }
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
