import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  performMove,
  performThrow,
  tickFight,
  performAuraAttack,
} from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { createFightEnvironment } from '../fightEnvironment'
import { createPreparationScene } from '../preparationScene'
import { createLuiniPassageScene } from '../luiniPassageScene'
import { performLuiniCommand } from '../luiniArsenal'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf } from '../fightRig'
import { buildFightFigure } from '../fighterFigure'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { confirmedThrow } from '../throwCinematic'
import { askLynchQuestion } from '../lynchAction'
import { privateLynchReplies } from '../lynchInterrogation'
import { throwCohortReady, gelThrowNenAvailable } from './sixthConditions'
import { createThrowSixthScene } from './sixthScene'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '../types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function advance(state: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
function duel(id: FighterId, prepared = false) {
  const state = beginFight(
    createFight(id, 'hisoka', {
      mode: 'versus-local',
      environment: createFightEnvironment({
        preparation: {
          mode: prepared ? 'scenario' : 'duel',
          resources: id === 'luini' ? ['rooms'] : ['plants'],
          cohorts: ['player'],
        },
      }),
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: prepared ? 25 : 46, aura: 100 },
    opponent: { ...state.opponent, x: prepared ? 30 : 51, aura: 100 },
  }
}
function grab(state: FightState, powered = false) {
  state = performThrow(state, 'player', { ...EMPTY_INPUT, aura: powered })
  const actor = state.player
  expect(actor.attack?.variant).toBe('throw')
  return resolveFightImpacts(
    {
      ...state,
      player: { ...actor, attack: { ...actor.attack!, frame: attackData('heavy', actor).startup } },
    },
    [],
  )
}
function renderer(state: FightState) {
  const scene = new THREE.Scene()
  const figures = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  scene.add(figures.player.root, figures.opponent.root)
  Object.values(figures).forEach((figure) => fightRigOf(humanAnimationRig(figure.turns)!))
  const options = {
    THREE,
    scene,
    glow,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (side: FightSide) => figures[side].turns,
  }
  const native = createPreparationScene(options),
    passage = createLuiniPassageScene(options),
    film = createThrowSixthScene(options)
  return {
    scene,
    figures,
    sync(next = state, t = 0.37) {
      const frame = confirmedThrow(next)!
      frame.age = t * frame.duration
      native.sync(next, 0)
      passage.sync(next, 0)
      film.hide()
      film.sync(next, frame)
    },
    clear: () => film.hide(),
    dispose() {
      film.dispose()
      passage.dispose()
      native.dispose()
    },
  }
}

describe('sixth batch: real resources and physical personality', () => {
  it.each(['halkenburg', 'gel', 'lynch', 'luini', 'bill'] as const)(
    '%s adds no gameplay mutation through its presentation',
    (id) => {
      for (const powered of [false, true]) {
        const state = grab(duel(id), powered),
          before = structuredClone(state),
          view = renderer(state)
        for (const t of [0.08, 0.37, 0.62, 0.9]) view.sync(state, t)
        expect(state).toEqual(before)
        expect(state.projectiles).toHaveLength(0)
        view.dispose()
        expect(view.scene.getObjectByName('throw-signature:serpent')).toBeUndefined()
        expect(view.scene.getObjectByName('throw-signature:archer')).toBeUndefined()
      }
    },
  )
  it.each([false, true])(
    'Gel wraps the real target and restores hand meshes (super=%s)',
    (powered) => {
      const state = grab(duel('gel'), powered),
        view = renderer(state)
      const hand = view.figures.player.root.getObjectByName('hand-right')!
      const materials = new Map<THREE.Mesh, THREE.Mesh['material']>()
      hand.traverse((node) => {
        const mesh = node as THREE.Mesh
        if (mesh.isMesh && mesh.visible) materials.set(mesh, mesh.material)
      })
      expect(materials.size).toBeGreaterThan(0)
      view.sync()
      const serpent = view.scene.getObjectByName('throw-signature:serpent')!
      expect(serpent.visible).toBe(true)
      expect(serpent.position.length()).toBeGreaterThan(0.1)
      expect(hand.visible).toBe(true)
      for (const mesh of materials.keys())
        expect((mesh.material as THREE.Material).visible).toBe(false)
      view.clear()
      for (const [mesh, material] of materials) expect(mesh.material).toBe(material)
      // A later native special retains ownership of the parent hand visibility.
      hand.visible = false
      view.sync(state, 0.9)
      expect(hand.visible).toBe(false)
      view.dispose()
    },
  )
  it('Gel requires her own usable Nen, including after the confirmed grip', () => {
    const state = grab(duel('gel')),
      view = renderer(state)
    for (const player of [
      { ...state.player, aura: 0 },
      { ...state.player, nenOwner: 'hisoka' as const },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    ]) {
      expect(gelThrowNenAvailable(player)).toBe(false)
      view.sync({ ...state, player })
      expect(view.scene.getObjectByName('throw-signature:serpent')!.visible).toBe(false)
    }
    const sealed = {
      ...state,
      player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    }
    expect(
      confirmedThrow(grab({ ...sealed, player: { ...sealed.player, attack: null } }))?.performance,
    ).toBeUndefined()
    view.dispose()
  })
  it('Halkenburg borrows only a charged, real cohort without firing or transferring a soul', () => {
    const unprepared = grab(duel('halkenburg'), true),
      bare = renderer(unprepared)
    bare.sync()
    expect(bare.scene.getObjectByName('throw-signature:archer')!.visible).toBe(false)
    bare.dispose()
    const prepared = advance(duel('halkenburg', true), 480)
    expect(throwCohortReady(prepared, 'player')).toBe(true)
    const state = grab(prepared, true),
      view = renderer(state),
      before = structuredClone(state)
    view.sync()
    expect(view.scene.getObjectByName('throw-signature:archer')!.visible).toBe(true)
    expect(state.player.hatsuEffects.cohortWillFrames).toBe(480)
    expect(state.player.hatsuEffects.arrowNocked).toBeFalsy()
    expect(state).toEqual(before)
    view.dispose()
  })
  it('Bill frames a genuinely grown seed and leaves its life and growth untouched', () => {
    const bare = renderer(grab(duel('bill'), true))
    bare.sync()
    expect(bare.scene.getObjectByName('throw-signature:growth')!.visible).toBe(false)
    bare.dispose()
    const prepared = advance(
      performMove({ state: duel('bill', true), side: 'player', action: 'special' }),
      20,
    )
    expect(prepared.battlefield!.entities.find((entry) => entry.id === 'player:seed')?.growth).toBe(
      1,
    )
    const state = grab(prepared, true),
      before = structuredClone(state),
      view = renderer(state)
    view.sync()
    expect(view.scene.getObjectByName('throw-signature:growth')!.visible).toBe(true)
    expect(state).toEqual(before)
    view.dispose()
  })
  it('Lynch’s throw does not answer a previously spoken Body and Soul question', () => {
    const asked = askLynchQuestion(
      { state: duel('lynch'), side: 'player', question: 'identity' },
      performAuraAttack,
    )
    expect(asked.player.lynchQuestion).toBeTruthy()
    const state = grab(asked, true),
      view = renderer(state),
      before = structuredClone(state)
    view.sync()
    expect(state.player.lynchQuestion).toEqual(asked.player.lynchQuestion)
    expect(privateLynchReplies(state, 'player')).toHaveLength(0)
    expect(state).toEqual(before)
    view.dispose()
  })
  it('Luini creates no passage or anchor when none was prepared', () => {
    const state = grab(duel('luini'), true),
      view = renderer(state)
    view.sync()
    expect(view.scene.getObjectByName('throw-signature:passage')).toBeUndefined()
    expect(state.player.luiniPassage).toBeUndefined()
    expect(state.battlefield?.luiniAnchors).toBeUndefined()
    view.dispose()
  })
  it('Luini must emerge from a partial passage before grabbing, while retaining his real anchor', () => {
    let prepared = advance(
      performMove({ state: duel('luini', true), side: 'player', action: 'special' }),
      20,
    )
    expect(prepared.battlefield?.luiniAnchors?.player).toBe('player:room')
    prepared = performLuiniCommand(
      {
        state: prepared,
        side: 'player',
        command: { action: 'luini-select', target: 'door:player:destination' },
      },
      performAuraAttack,
    )
    prepared = advance(performMove({ state: prepared, side: 'player', action: 'special' }), 20)
    expect(prepared.player.luiniPassage?.mode).toBe('door')
    expect(
      performThrow(prepared, 'player', { ...EMPTY_INPUT, aura: true }).player.attack,
    ).toBeNull()
    prepared = advance(
      performLuiniCommand(
        { state: prepared, side: 'player', command: { action: 'luini-emerge' } },
        performAuraAttack,
      ),
      20,
    )
    expect(prepared.player.luiniPassage).toBeUndefined()
    prepared = {
      ...prepared,
      player: { ...prepared.player, facing: 1 },
      opponent: { ...prepared.opponent, x: prepared.player.x + 5 },
    }
    const state = grab(prepared, true),
      before = structuredClone(state),
      view = renderer(state)
    view.sync()
    expect(state.battlefield?.luiniAnchors?.player).toBe('player:room')
    expect(view.scene.getObjectByName('throw-signature:passage')).toBeUndefined()
    expect(state).toEqual(before)
    view.dispose()
  })
})
