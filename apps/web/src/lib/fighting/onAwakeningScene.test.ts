import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createOnAwakeningScene } from './onAwakeningScene'
import { createFight } from './engine'
import { defaultFightComfort } from './fightComfort'
import { resolveCameraAnchor } from './cinematicFocus'

describe('On awakening scene lifecycle', () => {
  it('frames the visible animated head instead of an unposed hidden LOD', () => {
    const scene = new THREE.Scene()
    const actor = new THREE.Group()
    const head = new THREE.Group()
    head.name = 'manga-head:hisoka'
    head.position.y = 1.8
    const hidden = new THREE.Group()
    hidden.visible = false
    const otherHead = head.clone()
    otherHead.position.y = 12
    hidden.add(otherHead)
    actor.add(head, hidden)
    scene.add(actor)
    const focus = resolveCameraAnchor(
      { type: 'rig', side: 'player', part: 'head' },
      {
        scene,
        figureOf: () => actor,
      },
      createFight('hisoka', 'kurapika'),
    )!
    expect(focus.head).toBe(head)
    expect(focus.box.getCenter(new THREE.Vector3()).y).toBeCloseTo(1.8)
  })
  it('follows replacement rigs, pauses its shaders with simulation time and respects comfort', () => {
    const scene = new THREE.Scene()
    let figure = new THREE.Group()
    figure.position.set(2, 0, 0)
    scene.add(figure)
    let reduced = false
    const comfort = defaultFightComfort()
    const effect = createOnAwakeningScene({
      THREE,
      scene,
      figureOf: () => figure,
      comfort: () => comfort,
      reducedMotion: () => reduced,
    })
    const initial = createFight('hisoka', 'kurapika')
    const state = {
      ...initial,
      frame: 42,
      player: { ...initial.player, nen: { ...initial.player.nen, on: true } },
    }
    const saved = structuredClone(state)
    effect.sync(state, { player: 42, opponent: null })
    const root = scene.getObjectByName('on-awakening:player')!
    const opponent = scene.getObjectByName('on-awakening:opponent')!
    const strand = root.getObjectByName('on-rising-shadow:0') as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >
    const wave = root.getObjectByName('on-release-wave')!
    expect(root.visible).toBe(true)
    expect(opponent.visible).toBe(false)
    expect(root.position.x).toBe(2)
    expect(wave.visible).toBe(true)
    expect(strand.material.uniforms.u_time.value).toBe(0.7)
    effect.sync(state, { player: 42, opponent: null })
    expect(strand.material.uniforms.u_time.value).toBe(0.7)
    figure = new THREE.Group()
    figure.position.x = -3
    figure.scale.setScalar(1.8)
    scene.add(figure)
    effect.sync(state, { player: 42, opponent: null })
    expect(root.position.x).toBe(-3)
    expect(root.scale.x).toBe(1.8)
    comfort.flashes = false
    effect.sync(state, { player: 42, opponent: null })
    expect(wave.visible).toBe(false)
    reduced = true
    effect.sync(state, { player: 42, opponent: null })
    expect(strand.material.uniforms.u_time.value).toBe(0)
    expect(strand.material.uniforms.u_rise.value).toBe(1)
    expect(root.userData.entryFrame).toBeNull()
    effect.sync(initial, { player: null, opponent: null })
    expect(root.visible).toBe(false)
    expect(state).toEqual(saved)
    const geometryDispose = vi.spyOn(strand.geometry, 'dispose')
    const materialDispose = vi.spyOn(strand.material, 'dispose')
    effect.dispose()
    expect(scene.getObjectByName('on-awakening:player')).toBeUndefined()
    expect(scene.getObjectByName('on-awakening:opponent')).toBeUndefined()
    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })
})
