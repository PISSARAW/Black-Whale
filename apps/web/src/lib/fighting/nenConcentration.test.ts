import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { auraConcentration, concentrationShare } from './nenConcentration'
import { createNenConcentrationScene } from './nenConcentrationScene'
import { createFightState } from './fightState'
import { focusNenZone } from './nenAdvanced'
import { applyAuraContext } from './nen'
import { performAuraAttack, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { defaultFightComfort } from './fightComfort'
import { fighterAuraHex } from './auraColours'
import { EMPTY_INPUT, type ArcadeFighter, type FightState, type FighterId } from './types'

function fresh(id: FighterId = 'kurapika'): FightState {
  const state = createFightState(id, 'shizuku', { mode: 'versus-local' })
  return { ...state, phase: 'fighting', player: { ...state.player, aura: 100 } }
}
const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function fixture(id: FighterId = 'kurapika') {
  let state = fresh(id)
  let model = buildFightFigure({ THREE, glow, fighter: state.player })
  let comfort = defaultFightComfort()
  let seconds = 0
  const scene = new THREE.Scene()
  scene.add(model.root)
  const effects = createNenConcentrationScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (side) => (side === 'player' ? model.turns : undefined),
    comfort: () => comfort,
    viewer: () => 'opponent',
  })
  const sync = (next: FightState, rebuild = false) => {
    state = next
    if (rebuild) {
      model.root.removeFromParent()
      model = buildFightFigure({ THREE, glow, fighter: state.player })
      scene.add(model.root)
    }
    if (!state.hitstop) seconds = state.frame / 60
    model.animate(seconds, 'idle', {
      transitionSeconds: 0,
      motion: fightBodyMotion({ fighter: state.player, seconds, progress: 0 }),
    })
    effects.sync(state)
  }
  sync(state)
  const shells = () => {
    const found: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = []
    model.root.traverse((node) => {
      if (node.name.startsWith('nen-concentration:')) found.push(node as (typeof found)[number])
    })
    return found
  }
  const flux = () =>
    scene.children.filter((node) => node.name === 'nen-redistribution-flow' && node.visible)
  return {
    sync,
    shells,
    flux,
    effects,
    model: () => model,
    reduced: () => {
      comfort = { ...comfort, camera: 0, flashes: false }
    },
  }
}

describe('localized Ryu and Ko aura', () => {
  it.each(['kurapika', 'shizuku', 'franklin'] as const)(
    'keeps %s’s declared aura colour in the skin and travelling flux',
    (id) => {
      const f = fixture(id),
        state = fresh(id)
      state.player = focusNenZone(state.player, 'hands')
      f.sync({ ...state, frame: 1 }, true)
      f.sync({ ...state, frame: 5 })
      expect(f.flux().length).toBeGreaterThan(0)
      for (const shell of f.shells())
        expect(shell.material.uniforms.u_colour.value.getHex()).toBe(fighterAuraHex(id))
      for (const node of f.flux())
        expect(
          (
            node as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
          ).material.color.getHex(),
        ).toBe(fighterAuraHex(id))
      f.effects.dispose()
    },
  )
  it('keeps the spent Ko visible at contact through hitstop, then dissipates without extending the gameplay focus', () => {
    const f = fixture()
    let state = fresh()
    state.player.x = 44
    state.opponent.x = 50
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'heavy',
      moveId: 'kurapika:standingHeavy',
      auraCharged: true,
    })
    state = { ...state, player: applyAuraContext(state.player, EMPTY_INPUT) }
    f.sync(state, true)
    for (let i = 0; i < 30 && !state.impact; i++) {
      const wasKo = state.player.nen.ko
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      f.sync(state, wasKo !== state.player.nen.ko)
    }
    expect(state.impact?.attacker).toBe('player')
    expect(state.player.nen.ko).toBeNull()
    const discharge = () =>
      f.shells().find((node) => node.visible && node.name === 'nen-concentration:hands:left')
    expect(discharge()?.material.uniforms.u_strength.value).toBe(1)
    while (state.hitstop > 1) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      f.sync(state)
      expect(discharge()?.material.uniforms.u_strength.value).toBe(1)
    }
    for (let i = 0; i < 9; i++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      f.sync(state)
    }
    expect(discharge()).toBeUndefined()
    expect(state.player.nen.ko).toBeNull()
    f.effects.dispose()
  })
  it.each(['head', 'torso', 'feet'] as const)(
    'wraps the actual %s region rather than an approximate world-space marker',
    (zone) => {
      const f = fixture(),
        state = fresh()
      state.player = focusNenZone(state.player, zone)
      f.sync({ ...state, frame: 1 }, true)
      const shown = f
        .shells()
        .filter((node) => node.name.startsWith(`nen-concentration:${zone}:`) && node.visible)
      expect(shown.length).toBeGreaterThan(0)
      expect(shown.every((node) => node.material.uniforms.u_share.value === 0.76)).toBe(true)
      f.effects.dispose()
    },
  )
  it('uses the committed distribution, keeps Ten plain, and leaves the body bare under Ko', () => {
    const state = fresh()
    expect(auraConcentration(state.player)).toBeNull()
    const ryu = auraConcentration(focusNenZone(state.player, 'feet'))!
    expect(ryu.shares.feet).toBe(0.76)
    expect(ryu.shares.hands).toBe(0.08)
    const started = performAuraAttack({
      state,
      side: 'player',
      kind: 'heavy',
      moveId: 'kurapika:standingHeavy',
      auraCharged: true,
    })
    const ko = applyAuraContext(started.player, EMPTY_INPUT)
    expect(ko.nen.ko).toBeTruthy()
    const concentrated = auraConcentration(ko)!
    expect(concentrated.technique).toBe('ko')
    expect(concentrationShare(concentrated, { zone: 'hands', limb: 'left' })).toBe(1)
    expect(concentrationShare(concentrated, { zone: 'hands', limb: 'right' })).toBe(0)
    expect(concentrated.shares.torso).toBe(0)
    expect(concentrated.shares.feet).toBe(0)
  })

  it.each([1, -1] as const)(
    'wraps the actual chain hand facing %s, without owning its geometry',
    (facing) => {
      const f = fixture()
      let state = fresh()
      state.player = { ...focusNenZone(state.player, 'hands'), facing }
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'light',
        moveId: 'kurapika:standingLight',
        auraCharged: false,
      })
      f.sync({ ...state, frame: 1 }, true)
      const hand = f.model().root.getObjectByName('hand-right') as THREE.Mesh
      const shell = hand.children.find(
        (node) => node.name === 'nen-concentration:hands:right',
      ) as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
      expect(shell.geometry).toBe(hand.geometry)
      expect(shell.material.uniforms.u_share.value).toBe(0.76)
      const left = f.shells().find((node) => node.name === 'nen-concentration:hands:left')!
      expect(left.material.uniforms.u_thickness.value).toBeLessThan(
        shell.material.uniforms.u_thickness.value / 2,
      )
      const dispose = vi.spyOn(hand.geometry, 'dispose')
      f.effects.dispose()
      expect(dispose).not.toHaveBeenCalled()
      expect(hand.children.some((node) => node.name.startsWith('nen-concentration:'))).toBe(false)
    },
  )

  it('moves flux along posed limbs, freezes in hitstop and survives an aura rig rebuild', () => {
    const f = fixture(),
      state = fresh()
    state.player = focusNenZone(state.player, 'feet')
    f.sync({ ...state, frame: 1 }, true)
    f.sync({ ...state, frame: 5 })
    expect(f.flux().length).toBeGreaterThan(0)
    const positions = f.flux().map((node) => node.position.toArray())
    f.sync({ ...state, frame: 6, hitstop: 3 })
    expect(f.flux().map((node) => node.position.toArray())).toEqual(positions)
    f.sync({ ...state, frame: 6, hitstop: 3 }, true)
    expect(f.flux().map((node) => node.position.toArray())).toEqual(positions)
    f.sync({ ...state, frame: 25 })
    expect(f.flux()).toHaveLength(0)
    expect(f.shells().some((node) => node.visible && node.name.includes('feet'))).toBe(true)
    f.effects.dispose()
  })

  it('conceals redistribution with In, restores it under Gyo, and suppresses flow in reduced motion', () => {
    const f = fixture(),
      state = fresh()
    state.player = focusNenZone(state.player, 'hands')
    state.player.nen = { ...state.player.nen, in: true }
    f.sync({ ...state, frame: 2 }, true)
    expect(f.shells().some((node) => node.visible)).toBe(false)
    state.opponent.nen.gyo = true
    f.sync({ ...state, frame: 3 })
    expect(f.shells().some((node) => node.visible)).toBe(true)
    f.sync({ ...state, frame: 6 })
    expect(f.flux().length).toBeGreaterThan(0)
    f.reduced()
    f.sync({ ...state, frame: 7 })
    expect(f.flux()).toHaveLength(0)
    state.player = { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } } as ArcadeFighter
    f.sync({ ...state, frame: 8 })
    expect(f.shells().some((node) => node.visible)).toBe(false)
    f.effects.dispose()
  })
})
