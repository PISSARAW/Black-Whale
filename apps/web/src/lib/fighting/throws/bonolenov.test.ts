import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { prepareBonolenovThrow, tick } from '../../../../ui-tests/bonolenov-throws/state'
import { confirmedThrow, createThrowCinematic, throwVictoryDelay } from '../throwCinematic'
import { createVictoryPlayback } from '../victory/playback'
import { buildFightFigure } from '../fighterFigure'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import { introBodyMotion } from '../presentation/introMotion'
import { throwBodyPosition, thrownVisualFighter } from '../throwCinematicMotion'
import { applyThrowCamera } from '../throwCinematicCamera'
import { createBonolenovThrowScene } from './bonolenovScene'
import { beginFight, createFight, performThrow } from '../engine'
import { attackData } from '../frameData'
import { SUPER_THROW_COST } from '../superThrow'
import { performTrainingAction } from '../trainingAction'
import { applyReplayCommand } from '../fightReplayCommands'
import { applyPvpCommand } from '../pvp/commands'
import { packReplayInput } from '../fightReplayInput'
import { fightReplayHash } from '../fightReplayHash'
import { EMPTY_INPUT, type FightSide, type FightState } from '../types'

const contact = (options: Parameters<typeof prepareBonolenovThrow>[0] = {}) => {
  const run = prepareBonolenovThrow(options)
  const state = run.tape.find((state) => confirmedThrow(state))!
  expect(state).toBeDefined()
  return { ...run, state, frame: confirmedThrow(state)! }
}
const position = (node: THREE.Object3D) => node.getWorldPosition(new THREE.Vector3())

describe('Bonolenov cinematic throw integration', () => {
  it.each(['player', 'opponent'] as const)(
    'confirms both paid and physical throws with native ticks (%s)',
    (side) => {
      for (const powered of [false, true])
        for (const armed of [false, true]) {
          const { state, frame, before, tape } = contact({ side, powered, armed })
          expect(frame.performance).toBe(powered ? 'bonolenov-prologue' : 'bonolenov-waltz')
          expect(frame.duration).toBe(powered ? 84 : 55)
          expect(tape[0][side].aura).toBeCloseTo(
            before[side].aura - (powered ? SUPER_THROW_COST : 0),
          )
          expect(tape[0][side].attack?.auraCharged).toBe(false)
          expect(Boolean(state[side].battleCantabile?.prologue)).toBe(armed)
          expect(state.projectiles).toHaveLength(0)
        }
    },
  )

  it('refuses Nen or resource failures without spending; failed grabs and throw techs never authorize a film', () => {
    for (const options of [
      { powered: true, aura: 24 },
      { powered: true, zetsu: true },
    ]) {
      const run = prepareBonolenovThrow(options)
      expect(run.tape[0]).toEqual(run.before)
      expect(run.tape.some((state) => confirmedThrow(state))).toBe(false)
    }
    for (const options of [
      { miss: true },
      { tech: true },
      { powered: true, miss: true },
      { powered: true, tech: true },
    ]) {
      const run = prepareBonolenovThrow(options)
      expect(run.tape.some((state) => confirmedThrow(state))).toBe(false)
      expect(run.tape[0].player.aura).toBe(
        run.before.player.aura - (options.powered ? SUPER_THROW_COST : 0),
      )
    }
  })

  it('freezes on repeated state, resets on rewind or interruption and respects reduced motion', () => {
    const { state, frame } = contact()
    const film = createThrowCinematic()
    film.observe(state, 0, { enabled: true })
    const first = { ...film.current()! }
    film.observe(state, 100, { enabled: true })
    expect(film.current()).toEqual(first)
    const late = tick(tick(tick(state)))
    film.observe(late, 100, { enabled: true })
    expect(film.current()!.age).toBeGreaterThanOrEqual(frame.age)
    film.observe(state, 0, { enabled: false })
    expect(film.current()).toBeNull()
    film.observe(state, 1, { enabled: true })
    film.observe({ ...state, impact: null }, 2, { enabled: true })
    expect(film.current()).toBeNull()
  })

  it('finishes a KO throw before the victory film while keeping the authoritative verdict untouched', () => {
    const { state, frame } = contact({ powered: true, armed: true, ko: true })
    const snapshot = structuredClone(state)
    const victory = createVictoryPlayback()
    victory.sceneReady()
    victory.observe(state)
    expect(state.phase).toBe('finished')
    expect(get(victory)!.active).toBe(false)
    expect(get(victory)!.pendingThrow).toBe(throwVictoryDelay(state))
    victory.advance(0.3, true)
    expect(get(victory)!.pendingThrow).toBe(throwVictoryDelay(state))
    victory.advance(frame.duration / 60 + 0.01)
    expect(get(victory)!.active).toBe(true)
    expect(state).toEqual(snapshot)
  })

  it.each(['player', 'opponent'] as const)(
    'poses the real right-hand spear and lands rigid bodies in both camera formats (%s)',
    (side) => {
      const { state, frame } = contact({ side, armed: true, powered: true })
      const before = structuredClone(state)
      const scene = new THREE.Scene()
      const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
      const figures = {
        player: buildFightFigure({ THREE, glow, fighter: state.player }),
        opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
      }
      for (const model of Object.values(figures)) scene.add(model.root)
      const effects = createBonolenovThrowScene({
        THREE,
        scene,
        worldX: fightWorldX,
        worldY: fightWorldY,
        figureOf: (seat) => figures[seat].turns,
        throwFrame: () => frame,
      })
      for (const progress of [0, 0.2, 0.4, 0.58, 0.8, 0.98]) {
        frame.age = frame.duration * progress
        drawPair(state, frame, figures)
        effects.sync(state, progress)
        const spear = figures[side].root.getObjectByName('bonolenov-prologue-spear')!
        expect(spear.parent?.name).toBe('hand-right')
        const axis = spear
          .localToWorld(new THREE.Vector3(0, 1.59, 0))
          .sub(position(spear))
          .normalize()
        expect(axis.dot(new THREE.Vector3(frame.facing, -0.12, 0.15).normalize())).toBeGreaterThan(
          0.99,
        )
        for (const model of Object.values(figures)) {
          const human = humanAnimationRig(model.turns)!
          expect(lowestBodyHeight(human)).toBeGreaterThanOrEqual(0.011)
          for (const knee of human.knees) {
            expect(knee.rotation.x).toBeGreaterThanOrEqual(0)
            expect(Math.abs(knee.rotation.y)).toBeLessThanOrEqual(0.101)
            expect(knee.scale.toArray()).toEqual([1, 1, 1])
          }
        }
        for (const aspect of [16 / 9, 320 / 720]) {
          const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100)
          camera.position.set(0, 3, 8)
          expect(
            applyThrowCamera(camera, {
              state,
              frame,
              models: {
                player: { model: figures.player },
                opponent: { model: figures.opponent },
              },
              intensity: 1,
            }),
          ).toBe(true)
          expect(camera.position.toArray().every(Number.isFinite)).toBe(true)
        }
      }
      expect(state).toEqual(before)
      effects.dispose()
      expect(scene.getObjectByName('throw-signature:rhythm')).toBeUndefined()
    },
  )

  it('never enables the cinematic or changes throw recovery for another character', () => {
    const initial = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    let state = performThrow(
      {
        ...initial,
        player: { ...initial.player, x: 46 },
        opponent: { ...initial.opponent, x: 51 },
      },
      'player',
    )
    expect(attackData('heavy', state.player).recovery).toBeLessThan(54)
    for (let i = 0; i < 12; i++) state = tick(state)
    expect(state.impact?.knockdown).toBe(true)
    expect(confirmedThrow(state)).toBeNull()
  })

  it.each(['player', 'opponent'] as const)(
    'shares the paid intent between local, training, replay and online commands (%s)',
    (side) => {
      const { before: state } = prepareBonolenovThrow({ side })
      const input = { ...EMPTY_INPUT, aura: true }
      const packed = packReplayInput(input)
      const training = performTrainingAction({ state, side, action: 'throw', input })
      const replay = applyReplayCommand(state, {
        kind: 'move',
        side,
        action: 'throw',
        input: packed,
      })
      const online = applyPvpCommand(state, side, { kind: 'move', action: 'throw', input: packed })
      expect(training[side].attack?.superThrow).toBe(true)
      expect(fightReplayHash(replay)).toBe(fightReplayHash(training))
      expect(fightReplayHash(online)).toBe(fightReplayHash(training))
    },
  )

  it('buffers the chosen variant without payment until its actual start', () => {
    const run = prepareBonolenovThrow()
    const state = {
      ...run.before,
      player: { ...run.before.player, hitStun: 2, pose: 'hit' as const },
    }
    let queued = performThrow(state, 'player', { ...EMPTY_INPUT, aura: true })
    expect(queued.player.bufferedAttack?.superThrow).toBe(true)
    expect(queued.player.aura).toBe(state.player.aura)
    for (let i = 0; i < 4 && !queued.player.attack; i++) queued = tick(queued)
    expect(queued.player.attack?.superThrow).toBe(true)
    expect(queued.player.aura).toBeGreaterThanOrEqual(state.player.aura - SUPER_THROW_COST)
    expect(queued.player.aura).toBeLessThan(state.player.aura - SUPER_THROW_COST + 1)
  })
})

function drawPair(
  state: FightState,
  frame: NonNullable<ReturnType<typeof confirmedThrow>>,
  figures: Record<FightSide, ReturnType<typeof buildFightFigure>>,
) {
  for (const side of ['player', 'opponent'] as const) {
    const actual = state[side]
    const where = throwBodyPosition({ state, side, frame, fallback: actual })
    const fighter = side === frame.victim ? thrownVisualFighter(actual, where) : actual
    const model = figures[side]
    model.root.position.set(fightWorldX(where.x), fightWorldY(where.y), where.z ?? 0)
    model.root.rotation.set(0, (fighter.facing * Math.PI) / 2, 0)
    model.animate(0, 'idle', {
      transitionSeconds: 0,
      motion: introBodyMotion({
        fighter,
        side,
        seconds: 0,
        progress: 0,
        introFrame: null,
        throwFrame: frame,
      }),
      afterMotion: fightGroundContact(fighter),
    })
  }
}
