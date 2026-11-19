import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  performAuraAttack,
  performMove,
  performThrow,
  tickFight,
} from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow } from '../throwCinematic'
import { buildFightFigure } from '../fighterFigure'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { commandMary } from '../bloodyMaryAction'
import { beginPredatorAnalysis, launchPredator, predatorReady } from '../predator'
import { createPredatorScene } from '../predatorScene'
import { createCamillaCatScene } from '../camillaCatScene'
import { createCinematicPropsScene } from '../cinematicPropsScene'
import { createMelodyFluteScene } from '../melodyFluteScene'
import { createThrowFifthScene } from './fifthScene'
import { directedThrowShot } from './camera'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '../types'

const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })
function advance(state: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
function duel(id: FighterId, side: FightSide = 'player') {
  const state = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}
function grabbed(options: {
  id: FighterId
  side?: FightSide
  powered?: boolean
  bleed?: boolean
  poem?: boolean
  seed?: FightState
}) {
  const side = options.side ?? 'player'
  let state = options.seed ?? duel(options.id, side)
  if (options.bleed) state = commandMary({ state, side, command: 'bleed' }, performAuraAttack)
  if (options.poem) state = advance(performMove({ state, side, action: 'special' }), 61)
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: Boolean(options.powered) })
  const actor = state[side]
  expect(actor.attack?.variant).toBe('throw')
  return resolveFightImpacts(
    {
      ...state,
      [side]: { ...actor, attack: { ...actor.attack!, frame: attackData('heavy', actor).startup } },
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
  const options = {
    THREE,
    scene,
    glow,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (side: FightSide) => figures[side].turns,
  }
  const native = [
    createPredatorScene(options),
    createCamillaCatScene(options),
    createCinematicPropsScene(options),
    createMelodyFluteScene(options),
  ]
  const film = createThrowFifthScene(options)
  return {
    scene,
    figures,
    sync(next = state, t = 0.37) {
      const frame = confirmedThrow(next)!
      frame.age = t * frame.duration
      native.forEach((effect) => effect.sync(next, 0))
      film.hide(next)
      film.sync(next, frame)
    },
    clear(next = state) {
      native.forEach((effect) => effect.sync(next, 0))
      film.hide(next)
    },
    dispose() {
      film.dispose()
      native.forEach((effect) => effect.dispose())
    },
  }
}

describe('fifth batch: conditioned abilities and personality stay faithful to real resources', () => {
  it('keeps Melody’s opening close-up on her actual instrument beside a taller opponent', () => {
    const state = grabbed({ id: 'melody', powered: true }),
      view = renderer(state)
    view.sync(state, 0.1)
    const frame = confirmedThrow(state)!
    frame.age = frame.duration * 0.1
    const shot = directedThrowShot({
      frame,
      bounds: { left: -1, right: 1, bottom: 0.02, top: 2, near: -0.5, far: 0.5 },
      baseRadius: 6,
      models: {
        player: { model: { turns: view.figures.player.turns } },
        opponent: { model: { turns: view.figures.opponent.turns } },
      },
    })
    const flute = view.scene.getObjectByName('throw-signature:flute')!
    expect(shot.focus.distanceTo(flute.getWorldPosition(new THREE.Vector3()))).toBeLessThan(0.01)
    view.dispose()
  })
  it.each(['rihan', 'zakuro', 'melody', 'basho', 'camilla'] as const)(
    '%s presentation adds no gameplay effect or projectile',
    (id) => {
      for (const powered of [false, true]) {
        const state = grabbed({ id, powered }),
          before = structuredClone(state)
        const view = renderer(state)
        for (const t of [0.08, 0.37, 0.62, 0.9]) view.sync(state, t)
        expect(state).toEqual(before)
        expect(state.projectiles).toHaveLength(0)
        expect(state.catsName).toBeFalsy()
        expect(state.opponent.maryCapture).toBeUndefined()
        expect(state.opponent.hatsuEffects.entrancedFrames).toBe(0)
        expect(state.opponent.bashoBurn).toBeUndefined()
        view.dispose()
        expect(view.scene.children.some((node) => node.name.startsWith('throw-signature:'))).toBe(
          false,
        )
      }
    },
  )

  it.each(['player', 'opponent'] as const)(
    'Zakuro needs an opened wound, his real supply and usable Nen (%s)',
    (side) => {
      const dry = grabbed({ id: 'zakuro', side, powered: true }),
        dryView = renderer(dry)
      dryView.sync()
      expect(dryView.scene.getObjectByName('throw-signature:blood')!.visible).toBe(false)
      dryView.dispose()
      const state = grabbed({ id: 'zakuro', side, powered: true, bleed: true }),
        before = structuredClone(state)
      expect(state[side].openWounds).toBeGreaterThan(0)
      const view = renderer(state)
      view.sync()
      const blood = view.scene.getObjectByName('throw-signature:blood')!
      expect(blood.visible).toBe(true)
      const exhausted = {
        ...state,
        [side]: { ...state[side], bloodyMary: { ...state[side].bloodyMary!, available: 0 } },
      }
      view.sync(exhausted)
      expect(blood.visible).toBe(false)
      const stolen = {
        ...state,
        [side]: { ...state[side], hatsuEffects: { ...state[side].hatsuEffects, hatsuStolen: 1 } },
      }
      view.sync(stolen)
      expect(blood.visible).toBe(false)
      expect(state).toEqual(before)
      view.dispose()
    },
  )

  it('Melody uses the equipped flute and restores the native prop without granting entrancement', () => {
    const state = grabbed({ id: 'melody', powered: true }),
      view = renderer(state)
    const flute = view.figures.player.root.getObjectByName('signature-flute')!
    const parent = flute.parent,
      position = flute.position.clone()
    view.sync(state, 0.1)
    expect(view.scene.getObjectByName('throw-signature:flute')!.visible).toBe(true)
    expect(flute.visible).toBe(false)
    view.clear()
    expect(flute.visible).toBe(true)
    expect(flute.parent).toBe(parent)
    expect(flute.position).toEqual(position)
    const absent = { ...state, player: { ...state.player, melodyFlute: false, equipment: [] } }
    view.sync(absent, 0.1)
    expect(view.scene.getObjectByName('throw-signature:flute')!.visible).toBe(false)
    expect(flute.visible).toBe(false)
    const deaf = { ...state, opponent: { ...state.opponent, coveringEars: true } }
    view.sync(deaf, 0.1)
    expect(view.scene.getObjectByName('throw-signature:flute-sound')!.visible).toBe(false)
    view.dispose()
  })

  it('Basho borrows only a genuinely completed poem and does not ignite a grabbed target', () => {
    for (const poem of [false, true]) {
      const state = grabbed({ id: 'basho', powered: true, poem }),
        view = renderer(state)
      expect(Boolean(state.player.bashoPoem?.ready)).toBe(poem)
      view.sync()
      expect(view.scene.getObjectByName('throw-signature:poet')!.visible).toBe(poem)
      expect(state.opponent.bashoBurn).toBeUndefined()
      view.dispose()
    }
  })

  it('Rihan keeps Predator on its real Nen prey after studying and launching it', () => {
    let state = duel('rihan')
    state = { ...state, opponent: { ...state.opponent, x: 56 } }
    state = advance(
      performAuraAttack({
        state,
        side: 'opponent',
        kind: 'special',
        moveId: 'hisoka:neutralSpecial',
        auraCharged: false,
      }),
      35,
    )
    expect(state.bungeeGum).toBeTruthy()
    state = advance(beginPredatorAnalysis(state, 'player'), 260)
    expect(
      predatorReady(state, 'player'),
      JSON.stringify({
        predator: state.player.predator,
        gum: state.bungeeGum,
        aura: state.player.aura,
        x: state.player.x,
        enemyX: state.opponent.x,
        facing: state.player.facing,
      }),
    ).toBe(true)
    state = launchPredator(state, 'player')
    state = { ...state, opponent: { ...state.opponent, x: state.player.x + 5 } }
    state = grabbed({ id: 'rihan', powered: true, seed: state })
    const before = structuredClone(state),
      view = renderer(state)
    view.sync()
    const hunt = state.player.predator!.hunt!
    const predator = view.scene.getObjectByName('predator:player')!
    expect(predator.position.x).toBe(fightWorldX(hunt.x))
    expect(predator.position.y).toBe(fightWorldY(hunt.y))
    expect(view.scene.getObjectByName('throw-signature:hunter')!.visible).toBe(true)
    expect(hunt.preyId).toBe('bungee-gum')
    expect(state).toEqual(before)
    view.dispose()
  })

  it('Camilla uses her pistol as a physical prop without spending a round or summoning a living cat', () => {
    const base = grabbed({ id: 'camilla', powered: true })
    const state = { ...base, player: { ...base.player, camillaRounds: 0 } },
      view = renderer(state)
    view.sync()
    expect(view.scene.getObjectByName('throw-signature:royal')!.visible).toBe(true)
    expect(view.scene.getObjectByName('cats-name-feline')!.visible).toBe(false)
    expect(state.player.camillaRounds).toBe(0)
    view.sync({ ...state, player: { ...state.player, weaponsConfiscated: true } })
    expect(view.scene.getObjectByName('throw-signature:royal')!.visible).toBe(false)
    view.clear()
    expect(
      view.scene.children
        .filter((node) => node.name === 'camilla-pistol')
        .every((node) => !node.visible),
    ).toBe(true)
    view.dispose()
  })
})
