import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFight } from '../engine'
import { applyAuraContext } from '../nen'
import { createNenFieldScene } from '../nenFieldScene'
import { createBungeeGumScene } from '../bungeeGumScene'
import { EMPTY_INPUT, type FightSide } from '../types'
import { MAX_EN_CONTACTS } from './contacts'

function setup() {
  const state = createFight('hinrigh', 'hinrigh')
  state.player = { ...applyAuraContext(state.player, { ...EMPTY_INPUT, en: true }), x: 40 }
  state.opponent = {
    ...applyAuraContext(state.opponent, { ...EMPTY_INPUT, en: true, conceal: true }),
    x: 50,
  }
  const scene = new THREE.Scene()
  let viewer: FightSide = 'player'
  const fields = createNenFieldScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    viewer: () => viewer,
  })
  return {
    state,
    scene,
    fields,
    view: (side: FightSide) => {
      viewer = side
    },
  }
}

describe('neutral En contact rendering', () => {
  it('uses the selected observer without revealing an In-concealed field or a technique model', () => {
    const { state, scene, fields, view } = setup()
    fields.sync(state)
    expect(scene.children[0].visible).toBe(true)
    expect(scene.children[1].visible).toBe(false)
    const point = scene.getObjectByName('en-contact') as THREE.Mesh
    expect(point.visible).toBe(true)
    expect(point.geometry.type).toBe('BoxGeometry')
    expect(point.position.x).toBe(50)
    expect((point.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0xc6f4fa)
    expect(point.children).toHaveLength(0)
    view('opponent')
    fields.sync(state)
    expect(scene.children[1].visible).toBe(true)
    expect(point.position.x).toBe(40)
    state.opponent.nen.en = null
    fields.sync(state)
    expect(point.visible).toBe(false)
    fields.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('never exposes P1’s hidden gum model to P2’s En-only view', () => {
    const state = createFight('hisoka', 'hinrigh')
    state.player.nen.in = true
    state.opponent = applyAuraContext(state.opponent, { ...EMPTY_INPUT, en: true })
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: true, retracting: false }
    const scene = new THREE.Scene()
    let viewer: FightSide = 'opponent'
    const gum = createBungeeGumScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      viewer: () => viewer,
    })
    gum.sync(state, 0)
    const model = scene.getObjectByName('hisoka-bungee-gum')!
    expect(model.visible).toBe(false)
    state.opponent = applyAuraContext(state.opponent, { ...EMPTY_INPUT, gyo: true })
    gum.sync(state, 0)
    expect(model.visible).toBe(true)
    state.opponent = applyAuraContext(state.opponent, EMPTY_INPUT)
    viewer = 'player'
    gum.sync(state, 0)
    expect(model.visible).toBe(true)
    gum.dispose()
  })
  it('bounds private readings, reuses geometry and disposes the pool', () => {
    const { state, scene, fields } = setup()
    state.pvpSeat = 'player'
    state.enReadings = Array.from({ length: MAX_EN_CONTACTS + 100 }, () => ({ x: 45, y: 0 }))
    fields.sync(state)
    const points = scene.children.filter((mesh) => mesh.name === 'en-contact') as THREE.Mesh[]
    expect(points).toHaveLength(MAX_EN_CONTACTS)
    expect(new Set(points.map((point) => point.geometry)).size).toBe(1)
    expect(new Set(points.map((point) => point.material)).size).toBe(1)
    fields.sync(state)
    expect(scene.children).toHaveLength(MAX_EN_CONTACTS * 2 + 2)
    state.enReadings = []
    fields.sync(state)
    expect(points.every((point) => !point.visible)).toBe(true)
    fields.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
