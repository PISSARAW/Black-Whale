import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { beginFight, createFight, performThrow, tickFight } from '../engine'
import { createFightEnvironment } from '../fightEnvironment'
import { confirmedThrow } from '../throwCinematic'
import { buildFightFigure } from '../fighterFigure'
import { introBodyMotion } from '../presentation/introMotion'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import { throwBodyPosition, thrownVisualFighter } from '../throwCinematicMotion'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { createPreparationScene } from '../preparationScene'
import { createVoconteDoorScene } from '../voconteDoorScene'
import { createLsdfScene } from '../lsdfScene'
import { createThrowSignatureScene } from './scene'
import { prepareEighth } from '../../../../ui-tests/fighting-throws/eighthPreparation'
import type { PadailleTool } from '../padailleWeapon'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '../types'

const ids = ['padaille', 'sayird', 'terebellum', 'voconte', 'yokotani'] as const
const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })
function duel(id: FighterId, side: FightSide = 'player', prepared = false) {
  const state = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      environment: createFightEnvironment({
        ...(prepared && id === 'yokotani'
          ? {
              stageId: 'heilly-hideout' as const,
              morenaPresent: true,
              unlawfulIntruders: { player: side !== 'player', opponent: side !== 'opponent' },
            }
          : {}),
        preparation: {
          mode: 'scenario',
          resources: prepared ? ['animals', 'objects'] : [],
          cohorts: [],
        },
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
  const aura = state[side].aura
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: powered })
  expect(state[side].aura).toBe(aura - (powered ? 25 : 0))
  expect(state[side].attack?.variant).toBe('throw')
  // Let the native startup and input-tech window expire before freezing the rendered pose.
  for (let frame = 0; frame < 180; frame++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    if (confirmedThrow(state) && !state[side].throwTechFrames) break
  }
  expect(confirmedThrow(state)).toBeTruthy()
  return state
}
function prepared(id: FighterId, side: FightSide = 'player', tool: PadailleTool = 'hammer') {
  return prepareEighth(duel(id, side, true), {
    side,
    tool: id === 'padaille' ? tool : undefined,
    animal: id === 'sayird',
    relay: id === 'terebellum',
    threshold: id === 'voconte',
    door: id === 'voconte',
    guards: id === 'yokotani',
  })
}
function renderer(state: FightState) {
  const scene = new THREE.Scene()
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  scene.add(models.player.root, models.opponent.root)
  let frame = confirmedThrow(state)!,
    rightStayed = true
  const options = {
    THREE,
    glow,
    scene,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (side: FightSide) => models[side].turns,
    throwFrame: () => frame,
  }
  const native = [
    createPreparationScene(options),
    createVoconteDoorScene(options),
    createLsdfScene(options),
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
      const arm = humanAnimationRig(models[frame.attacker].turns)!.arms[1],
        before = arm.quaternion.clone()
      film.sync(next, 0)
      rightStayed = arm.quaternion.angleTo(before) < 1e-7
    },
    rightStayed: () => rightStayed,
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

describe('the final five pairs preserve corrected physics and native ability conditions', () => {
  it.each(ids)(
    '%s keeps moving feet, rigid bones and full-body landing in P1/P2, normal and super',
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
            if (t === 0.24) {
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
          expect(state[side].padailleTool).toBeUndefined()
          expect(state[side].sweetHomeObject).toBeUndefined()
          expect(state.voconteDoors).toBeUndefined()
          expect(state.lsdf?.[side]).toBeUndefined()
          expect(state.impact?.transfer).toBeFalsy()
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
  it.each(['hammer', 'drill', 'axe'] as const)(
    'Padaille grips with the left hand and retains his genuinely prepared right-hand %s',
    (tool) => {
      for (const side of ['player', 'opponent'] as const) {
        const ready = prepared('padaille', side, tool)
        expect(ready[side].padailleTool).toBe(tool)
        const victim = side === 'player' ? 'opponent' : 'player'
        expect(ready[victim].health).toBe(ready[victim].maxHealth)
        const state = grab(ready, side, true),
          before = structuredClone(state),
          view = renderer(state)
        view.draw()
        expect(view.marker('artisan')).toBe(true)
        expect(view.rightStayed()).toBe(true)
        const figure = view.models[side].root
        expect(figure.getObjectByName('hand-right')!.visible).toBe(false)
        expect(figure.getObjectByName(`padaille-${tool}-right-hand`)!.visible).toBe(true)
        expect(state).toEqual(before)
        const stolen = {
          ...state,
          [side]: { ...state[side], hatsuEffects: { ...state[side].hatsuEffects, hatsuStolen: 1 } },
        }
        view.draw(0.24, stolen)
        expect(view.marker('artisan')).toBe(false)
        expect(figure.getObjectByName('hand-right')!.visible).toBe(true)
        view.dispose()
      }
    },
  )
  it('Sayird borrows a real controlled animal without inventing or moving it', () => {
    const ready = prepared('sayird'),
      animal = ready.battlefield!.entities.find((entry) => entry.controller?.source === 'sayird')
    expect(animal).toBeTruthy()
    const state = grab(ready, 'player', true),
      before = structuredClone(state),
      view = renderer(state)
    view.draw()
    expect(view.marker('scout')).toBe(true)
    const lost = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === animal!.id ? { ...entry, present: false } : entry,
        ),
      },
    }
    view.draw(0.24, lost)
    expect(view.marker('scout')).toBe(false)
    expect(state).toEqual(before)
    view.dispose()
  })
  it.each(['player', 'opponent'] as const)(
    'Terebellum leaves the real selected recipient and all wounds unchanged while circling behind it (%s)',
    (side) => {
      const ready = prepared('terebellum', side)
      expect(ready[side].sweetHomeObject).toBeTruthy()
      const state = grab(ready, side, true),
        before = structuredClone(state),
        view = renderer(state),
        frame = confirmedThrow(state)!
      view.draw()
      expect(view.marker('relay')).toBe(true)
      expect(state.impact?.transfer).toBeFalsy()
      for (const seat of ['player', 'opponent'] as const) {
        const position = throwBodyPosition({
          state,
          side: seat,
          frame: { ...frame, age: frame.duration * 0.4 },
          fallback: state[seat],
        })
        expect(position.z).toBeLessThan(0)
      }
      expect(state).toEqual(before)
      view.dispose()
    },
  )
  it.each(['player', 'opponent'] as const)(
    'Voconte preserves a genuinely opened network and never fabricates a transit (%s)',
    (side) => {
      const ready = prepared('voconte', side)
      expect(ready.voconteDoors?.networks[side]?.active).toBe(true)
      const state = grab(ready, side, true),
        before = structuredClone(state),
        view = renderer(state)
      view.draw()
      expect(view.marker('gatekeeper')).toBe(true)
      expect(state.voconteDoors?.lastTransit).toBeUndefined()
      expect(state).toEqual(before)
      view.dispose()
    },
  )
  it.each(['player', 'opponent'] as const)(
    'Yokotani keeps a genuinely declared LSDF formation nonviolent and independent of the throw (%s)',
    (side) => {
      const ready = prepared('yokotani', side)
      expect(ready.lsdf?.[side]?.phase).toBe('approaching')
      const state = grab(ready, side, true),
        before = structuredClone(state),
        view = renderer(state)
      view.draw()
      expect(view.marker('bailiff')).toBe(true)
      expect(state.lsdf?.[side]?.phase).toBe('approaching')
      expect(state).toEqual(before)
      view.dispose()
      let current = state
      for (let i = 0; i < 80; i++)
        current = tickFight(current, EMPTY_INPUT, {
          dt: 1 / 60,
          opponentInput: EMPTY_INPUT,
          ai: false,
        })
      expect(current.lsdf?.[side]?.phase).toBe('approaching')
      expect(current.phase).toBe('fighting')
    },
  )
})
