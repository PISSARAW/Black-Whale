import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { beginFight, createFight, performThrow } from '../engine'
import { createFightEnvironment } from '../fightEnvironment'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow } from '../throwCinematic'
import { buildFightFigure } from '../fighterFigure'
import { introBodyMotion } from '../presentation/introMotion'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import { throwBodyPosition, thrownVisualFighter } from '../throwCinematicMotion'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { createPreparationScene } from '../preparationScene'
import { createCinematicPropsScene } from '../cinematicPropsScene'
import { createMoonlightScene } from '../moonlightScene'
import { createSecretWindowScene } from '../secretWindowScene'
import { createThrowSignatureScene } from './scene'
import { prepareSeventh } from '../../../../ui-tests/fighting-throws/seventhPreparation'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '../types'

const ids = ['furykov', 'cluck', 'beyond', 'longhi', 'musse'] as const
const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function duel(id: FighterId, side: FightSide = 'player') {
  const state = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      environment: createFightEnvironment({
        preparation: { mode: 'scenario', resources: ['birds'], cohorts: [] },
      }),
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
}
function grab(state: FightState, side: FightSide, powered: boolean) {
  const before = state[side].aura
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: powered })
  expect(state[side].aura).toBe(before - (powered ? 25 : 0))
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
function prepared(id: FighterId, side: FightSide = 'player') {
  return prepareSeventh(duel(id, side), {
    side,
    bird: id === 'cluck',
    console: id === 'furykov',
    offer: id === 'longhi',
    owl: id === 'musse',
  })
}
function renderer(state: FightState, viewer: FightSide = 'player') {
  const scene = new THREE.Scene()
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  scene.add(models.player.root, models.opponent.root)
  let frame = confirmedThrow(state)!
  const options = {
    THREE,
    scene,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (side: FightSide) => models[side].turns,
    viewer: () => viewer,
    throwFrame: () => frame,
  }
  const native = [
    createPreparationScene(options),
    createCinematicPropsScene(options),
    createMoonlightScene(options),
    createSecretWindowScene(options),
  ]
  const film = createThrowSignatureScene(options)
  return {
    scene,
    models,
    draw(t = 0.24, next = state) {
      frame = { ...confirmedThrow(next)!, age: frame.duration * t }
      for (const side of ['player', 'opponent'] as const) {
        const position = throwBodyPosition({ state: next, side, frame, fallback: next[side] })
        const fighter =
          side === frame.victim ? thrownVisualFighter(next[side], position) : next[side]
        const model = models[side]
        model.root.position.set(fightWorldX(position.x), fightWorldY(position.y), position.z ?? 0)
        model.root.rotation.y = fighter.facing * 1.25
        model.animate(t, 'idle', {
          motion: introBodyMotion({
            fighter,
            seconds: t,
            side,
            introFrame: null,
            throwFrame: frame,
            progress: t,
          }),
          afterMotion: fightGroundContact(fighter),
        })
      }
      native.forEach((effect) => effect.sync(next, 0))
      film.sync(next, 0)
    },
    setViewer(side: FightSide) {
      viewer = side
    },
    marker(effect: string) {
      return scene.getObjectByName(`throw-signature:${effect}`)!.visible
    },
    clear() {
      frame = { ...frame, active: false }
      film.sync(state, 0)
    },
    dispose() {
      film.dispose()
      native.forEach((effect) => effect.dispose())
    },
  }
}

describe('seventh batch on the corrected cinematic physics', () => {
  it.each(ids)(
    '%s uses moving supports, rigid bones, free flight and a complete floor landing in either seat',
    (id) => {
      for (const side of ['player', 'opponent'] as const)
        for (const powered of [false, true]) {
          const state = grab(duel(id, side), side, powered),
            before = structuredClone(state),
            view = renderer(state)
          const legs = Object.values(view.models).flatMap(
            (model) => humanAnimationRig(model.turns)!.knees,
          )
          const lengths = legs.map((knee) => knee.position.length())
          for (const t of [0.08, 0.24, 0.4, 0.6, 0.75, 0.9]) {
            view.draw(t)
            expect(legs.map((knee) => knee.position.length())).toEqual(lengths)
            for (const model of Object.values(view.models))
              expect(lowestBodyHeight(humanAnimationRig(model.turns)!)).toBeGreaterThanOrEqual(
                -0.015,
              )
            if (t === 0.24 && !(id === 'cluck' && powered)) {
              const human = humanAnimationRig(view.models[side].turns)!
              const soles = human.knees.map(
                (knee) => new THREE.Box3().setFromObject(knee.children[1]).min.y,
              )
              expect(Math.max(...soles) - Math.min(...soles)).toBeGreaterThan(0.025)
              expect(Math.min(...soles)).toBeLessThan(0.1)
            }
            if (t === 0.9) {
              const victim = side === 'player' ? 'opponent' : 'player'
              expect(lowestBodyHeight(humanAnimationRig(view.models[victim].turns)!)).toBeCloseTo(
                0.012,
                2,
              )
            }
          }
          expect(state).toEqual(before)
          expect(state.projectiles).toHaveLength(0)
          expect(state.moonlight).toBeUndefined()
          expect(state[side].comboMaster).toBeUndefined()
          expect(state[side].secretWindow).toBeUndefined()
          view.clear()
          expect(
            view.scene.children.filter(
              (node) => node.name.startsWith('throw-signature:') && node.visible,
            ),
          ).toHaveLength(0)
          view.dispose()
        }
    },
  )
  it('Furykov witnesses a console opened by a real action, privately, without creating a new alert', () => {
    const ready = prepared('furykov')
    expect(ready.player.comboMaster).toBeTruthy()
    expect(ready.player.aura).toBeLessThan(100)
    const state = grab(ready, 'player', true),
      before = structuredClone(state),
      view = renderer(state)
    view.draw()
    expect(view.marker('analyst')).toBe(true)
    view.setViewer('opponent')
    view.draw()
    expect(view.marker('analyst')).toBe(false)
    expect(state).toEqual(before)
    view.dispose()
  })
  it('Cluck borrows only the actual live, controlled bird and never moves it for the throw', () => {
    const ready = prepared('cluck'),
      bird = ready.battlefield!.entities.find((entry) => entry.controller?.source === 'cluck')
    expect(bird).toBeTruthy()
    const state = grab(ready, 'player', true),
      before = structuredClone(state),
      view = renderer(state)
    view.draw()
    expect(view.marker('aviary')).toBe(true)
    const lost = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === bird!.id ? { ...entry, health: 0 } : entry,
        ),
      },
    }
    view.draw(0.24, lost)
    expect(view.marker('aviary')).toBe(false)
    expect(state).toEqual(before)
    view.dispose()
  })
  it('Longhi uses the genuinely offered sheet without obtaining a signature, loan or Zetsu penalty', () => {
    const ready = prepared('longhi')
    expect(ready.moonlight?.offer).toBeTruthy()
    const state = grab(ready, 'player', true),
      before = structuredClone(state),
      view = renderer(state)
    view.draw()
    expect(view.marker('agreement')).toBe(true)
    expect(state.moonlight?.active).toBeUndefined()
    expect(state.opponent.moonlightZetsu).toBeUndefined()
    expect(state.opponent.moonlightLoan).toBeFalsy()
    expect(state).toEqual(before)
    view.dispose()
  })
  it('Musse retains the real listening owl’s privacy and feed, and never fires his handgun', () => {
    const ready = prepared('musse')
    expect(ready.player.secretWindow?.mode).toBe('listening')
    const state = grab(ready, 'player', true),
      before = structuredClone(state),
      view = renderer(state)
    view.draw()
    expect(view.marker('spy')).toBe(true)
    view.setViewer('opponent')
    view.draw()
    expect(view.marker('spy')).toBe(false)
    expect(state.projectiles).toHaveLength(0)
    expect(state).toEqual(before)
    view.dispose()
  })
})
