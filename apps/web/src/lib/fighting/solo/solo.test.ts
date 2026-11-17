import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createSoloController } from './controller'
import { createSoloFight } from './setup'
import { newSoloRun, nextSoloRun, observeSoloRun } from './run'
import { SOLO_ROUTES, SURVIVAL_FIGHTERS } from './catalogue'
import { scoreSoloFrame, validSoloFrame } from './objectives'
import {
  emptySoloSave,
  completedSoloSave,
  loadSoloSave,
  saveSoloProgress,
  SOLO_STORAGE,
} from './storage'
import { readSoloSave } from './validation'
import { tickFight } from '../engine'
import { toggleEmperorTime } from '../kurapikaActions'
import { performTrainingAction } from '../trainingAction'
import { FIGHTING_ROSTER } from '../roster'
import { isCareerDuel } from '../career/eligibility'
import { EMPTY_INPUT, type FightInput, type MoveAction } from '../types'
import type { SoloMode, SoloRouteId, SoloRun } from './types'

function memory() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}
function session(route: SoloRouteId = 'reading') {
  const storage = memory(),
    controller = createSoloController({ storage })
  controller.start({ mode: 'story', route, fighter: 'kurapika', id: 'test', seed: 7 })
  const snapshot = () => get(controller).session!
  return {
    controller,
    storage,
    snapshot,
    frames(count: number, input: Partial<FightInput> = {}) {
      for (let i = 0; i < count; i++) controller.tick(1 / 60, { ...EMPTY_INPUT, ...input })
      return snapshot()
    },
    move(action: MoveAction) {
      controller.enqueue({ kind: 'move', side: 'player', action, input: 0 })
    },
  }
}
function reading(run: ReturnType<typeof session>) {
  run.controller.begin()
  run.frames(30, { gyo: true })
  expect(run.snapshot().run.status).toBe('won')
  expect(run.snapshot().state.bungeeGum?.hidden).toBe(true)
  run.controller.next()
  run.controller.begin()
  run.frames(14, { right: true })
  run.move('light')
  run.frames(15)
  expect(run.snapshot().run.status).toBe('won')
  expect(run.snapshot().state.opponent.cyclotronWindup).toBeUndefined()
  run.controller.next()
  run.controller.begin()
  run.move('special')
  run.frames(1)
  run.move('light')
  run.frames(30)
}
function duel(mode: SoloMode = 'story', fighter: SoloRun['fighter'] = 'kurapika') {
  let run = newSoloRun({ mode, route: 'duelist', fighter, id: 'duel', seed: 8 })
  let state = createSoloFight(run)
  function frame(input: Partial<FightInput> = {}) {
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      {
        ai: false,
        opponentInput: EMPTY_INPUT,
        dt: 1 / 60,
        onFrame: (before, after) => {
          run = observeSoloRun(run, before, after)
        },
      },
    )
  }
  return {
    get run() {
      return run
    },
    get state() {
      return state
    },
    frame,
    begin() {
      run = { ...run, status: 'playing' }
    },
    next() {
      run = nextSoloRun(run)
      state = createSoloFight(run)
    },
    win() {
      for (let i = 0; run.status === 'playing' && i < 4000; i++) {
        const gap = Math.abs(state.player.x - state.opponent.x)
        const input = { right: gap > 6, left: false }
        if (gap <= 7) state = performTrainingAction({ state, side: 'player', action: 'heavy' })
        frame(input)
      }
    },
    emperor() {
      state = toggleEmperorTime(state, 'player')
    },
    receiveHit() {
      for (let i = 0; i < 240 && state.player.health === state.player.maxHealth; i++) {
        if (Math.abs(state.player.x - state.opponent.x) <= 7)
          state = performTrainingAction({ state, side: 'opponent', action: 'light' })
        state = tickFight(state, EMPTY_INPUT, {
          ai: false,
          dt: 1 / 60,
          opponentInput: { ...EMPTY_INPUT, left: true },
          onFrame: (before, after) => {
            run = observeSoloRun(run, before, after)
          },
        })
      }
    },
  }
}

describe('solo story routes use actual Nen and physical outcomes', () => {
  it('plays the complete reading route and saves its original ending and local title', () => {
    const run = session()
    reading(run)
    expect(run.snapshot().run.status).toBe('complete')
    expect(run.snapshot().run.results).toHaveLength(3)
    expect(get(run.controller).save.routes).toEqual(['reading'])
    expect(loadSoloSave(run.storage).save.routes).toEqual(['reading'])
    expect(isCareerDuel(run.snapshot().state)).toBe(false)
  })
  it('plays crate interception, body return and holding the line with finite resources', () => {
    const run = session('escort')
    run.controller.begin()
    expect(run.snapshot().state.training).toBeUndefined()
    run.frames(600, { guard: true })
    expect(run.snapshot().run.status).toBe('won')
    expect(run.snapshot().run.objective.threat).toBe(true)
    expect(run.snapshot().state.battlefield?.entities[0].present).toBe(true)
    run.controller.next()
    run.controller.begin()
    const body = run.snapshot().state.player.hanzoProjection!.bodyX
    for (let i = 0; i < 30 && Math.abs(run.snapshot().state.player.x - body) > 3; i++)
      run.frames(1, { left: true })
    run.move('special')
    run.frames(1)
    run.frames(60, { guard: true, down: true })
    expect(run.snapshot().run.status).toBe('won')
    expect(run.snapshot().state.player.hanzoProjection).toBeUndefined()
    run.controller.next()
    run.controller.begin()
    run.frames(900, { guard: true })
    expect(run.snapshot().run.status).toBe('complete')
    expect(get(run.controller).save.routes).toEqual(['escort'])
  })
  it('does not reveal a tether by idling or answer a question without a fist strike', () => {
    const run = session()
    run.controller.begin()
    run.frames(100)
    expect(run.snapshot().run.status).toBe('playing')
    run.frames(30, { gyo: true })
    run.controller.next()
    run.controller.begin()
    run.frames(14, { right: true })
    run.move('light')
    run.frames(15)
    run.controller.next()
    run.controller.begin()
    run.move('special')
    run.frames(100)
    expect(run.snapshot().run.status).toBe('playing')
  })
  it('fails a genuinely unguarded body and permits a story retry', () => {
    const run = session('escort')
    run.controller.begin()
    run.frames(600, { guard: true })
    run.controller.next()
    run.controller.begin()
    run.frames(90)
    expect(run.snapshot().run.status).toBe('failed')
    expect(run.snapshot().run.failure).toBe('defeat')
    run.controller.retry()
    expect(run.snapshot().run.status).toBe('briefing')
    expect(run.snapshot().state.player.hanzoProjection).toBeDefined()
    expect(run.snapshot().run.results).toHaveLength(1)
  })
  it('has three distinct, bilingual routes, all with playable final encounters', () => {
    expect(SOLO_ROUTES).toHaveLength(3)
    expect(new Set(SOLO_ROUTES.flatMap((r) => r.encounters)).size).toBe(9)
    expect(SOLO_ROUTES.every((r) => r.ending.every((s) => s.length > 30))).toBe(true)
    const run = duel()
    run.begin()
    for (let i = 0; i < 3; i++) {
      run.win()
      expect(run.state.winner).toBe('player')
      if (i < 2) {
        expect(run.run.status).toBe('won')
        run.next()
        run.begin()
      }
    }
    expect(run.run.status).toBe('complete')
    expect(completedSoloSave(emptySoloSave(), run.run).routes).toEqual(['duelist'])
  })
})

describe('solo modes preserve ordinary fighters and round rules', () => {
  it('carries real remaining health and aura through the ordinary survival boundary', () => {
    const run = duel('survival')
    run.begin()
    run.emperor()
    run.receiveHit()
    expect(run.state.player.health).toBeLessThan(run.state.player.maxHealth)
    run.win()
    expect(run.run.status).toBe('won')
    const body = run.state.player
    expect(body.kurapika!.lifespanFrames).toBeGreaterThan(0)
    run.next()
    expect(run.state.player.health).toBe(body.health)
    expect(run.state.player.aura).toBe(body.aura)
    expect(run.state.player.auraExhausted).toBe(body.auraExhausted)
    expect(run.state.player.hitStun).toBe(0)
    expect(run.state.player.kurapika!.lifespanFrames).toBe(body.kurapika!.lifespanFrames)
    expect(run.state.bungeeGum).toBeNull()
    expect(run.state.opponent.id).toBe('phinks')
    expect(readSoloSave(JSON.stringify(completedSoloSave(emptySoloSave(), run.run))).run).toEqual(
      run.run,
    )
  })
  it.each(SURVIVAL_FIGHTERS)(
    'offers a finite personal body for qualified survivor %s',
    (fighter) => {
      const run = newSoloRun({ mode: 'survival', route: 'duelist', fighter })
      const state = createSoloFight(run)
      expect(state.player.id).toBe(fighter)
      expect(state.training).toBeUndefined()
      expect(state.player.aura).toBeLessThanOrEqual(100)
      expect(state.player.health).toBe(state.player.maxHealth)
    },
  )
  it.each(SURVIVAL_FIGHTERS)(
    'finishes five genuine survival rounds with %s',
    (fighter) => {
      const run = duel('survival', fighter)
      run.begin()
      for (let i = 0; i < 5; i++) {
        run.win()
        expect(run.state.winner).toBe('player')
        expect(run.run.status).toBe(i === 4 ? 'complete' : 'won')
        if (i < 4) {
          const health = run.state.player.health,
            aura = run.state.player.aura
          run.next()
          run.begin()
          expect(run.state.player.health).toBe(health)
          expect(run.state.player.aura).toBe(aura)
        }
      }
      expect(completedSoloSave(emptySoloSave(), run.run).records.survival?.cleared).toBe(true)
    },
    30000,
  )
  it.each(['time-attack', 'score-attack'] as const)(
    '%s offers all forty original fighters',
    (mode) => {
      expect(FIGHTING_ROSTER).toHaveLength(40)
      for (const { id: fighter } of FIGHTING_ROSTER) {
        const run = newSoloRun({ mode, route: 'duelist', fighter }),
          state = createSoloFight(run)
        expect(state.player.id).toBe(fighter)
        expect(isCareerDuel(state)).toBe(false)
      }
    },
  )
  it('scores actual damage once and never counts a repeated impact or idle frame', () => {
    const run = duel('score-attack')
    run.begin()
    let points = 0
    for (let i = 0; i < 90; i++) {
      const before = run.state
      run.frame({ right: true })
      points += scoreSoloFrame(before, run.state)
    }
    expect(points).toBe(0)
    run.win()
    expect(run.run.score).toBeGreaterThan(1000)
    expect(scoreSoloFrame(run.state, run.state)).toBe(0)
  })
  it.each(['time-attack', 'score-attack'] as const)(
    '%s uses simulated frames for its total budget',
    (mode) => {
      const run = newSoloRun({ mode, route: 'duelist', fighter: 'kurapika' }),
        state = createSoloFight(run)
      const playing = { ...run, status: 'playing' as const, elapsed: 10799 }
      expect(observeSoloRun(playing, state, state)).toBe(playing)
      const after = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false })
      const result = observeSoloRun(playing, state, after)
      expect(result.status).toBe(mode === 'time-attack' ? 'failed' : 'complete')
      expect(result.elapsed).toBe(10800)
      expect(result.results).toHaveLength(0)
    },
  )
})

describe('local solo persistence, command isolation and scheduling', () => {
  it('checkpoints entry, preserves cleared encounters and restarts only the in-progress encounter', () => {
    const run = session()
    run.controller.begin()
    run.frames(30, { gyo: true })
    run.controller.next()
    run.controller.begin()
    run.frames(5)
    const restored = createSoloController({ storage: run.storage })
    restored.load()
    restored.resume()
    expect(get(restored).session?.run.status).toBe('briefing')
    expect(get(restored).session?.run.index).toBe(1)
    expect(get(restored).session?.run.results).toHaveLength(1)
    expect(get(restored).session?.state.frame).toBe(
      createSoloFight(get(restored).session!.run).frame,
    )
  })
  it('pauses without time, rejects P2 commands and handles batched fixed steps', () => {
    const run = session()
    run.controller.begin()
    run.controller.pause(true)
    run.frames(60, { gyo: true })
    expect(run.snapshot().run.elapsed).toBe(0)
    run.controller.pause(false)
    const attack = run.snapshot().state.opponent.attack
    run.controller.enqueue({ kind: 'move', side: 'opponent', action: 'heavy', input: 0 })
    run.controller.tick(Number.NaN)
    run.controller.tick(-1)
    expect(run.snapshot().run.elapsed).toBe(0)
    for (let i = 0; i < 10; i++) run.controller.tick(0.05, { ...EMPTY_INPUT, gyo: true })
    expect(run.snapshot().run.status).toBe('won')
    expect(run.snapshot().run.elapsed).toBe(30)
    expect(run.snapshot().state.opponent.attack).toBe(attack)
  })
  it('rejects a foreign or training marker and never awards a scripted objective to PvP', () => {
    const run = newSoloRun({ mode: 'story', route: 'reading', fighter: 'kurapika' }),
      state = createSoloFight(run)
    expect(validSoloFrame(run, state)).toBe(true)
    expect(validSoloFrame({ ...run, id: 'foreign' }, state)).toBe(false)
    expect(validSoloFrame(run, { ...state, mode: 'training' })).toBe(false)
    expect(validSoloFrame(run, { ...state, forecastSimulation: true })).toBe(false)
    expect(
      observeSoloRun({ ...run, status: 'playing' }, state, { ...state, soloSession: undefined })
        .failure,
    ).toBe('invalid')
  })
  it('recovers damaged saves, preserves stories across rules changes and rejects forged carry', () => {
    const storage = memory()
    storage.setItem(SOLO_STORAGE, '{broken')
    expect(loadSoloSave(storage).issue).toBe('invalid')
    expect(storage.getItem(SOLO_STORAGE)).toBe('{broken')
    const old = { ...emptySoloSave(), ruleset: 'old', routes: ['reading'], run: { invalid: true } }
    storage.setItem(SOLO_STORAGE, JSON.stringify(old))
    expect(loadSoloSave(storage)).toMatchObject({
      issue: 'rules',
      save: { routes: ['reading'], run: null, records: {} },
    })
    const run = newSoloRun({ mode: 'survival', route: 'duelist', fighter: 'kurapika' })
    expect(() =>
      readSoloSave(
        JSON.stringify({ ...emptySoloSave(), run: { ...run, index: 1, carry: 'fake' } }),
      ),
    ).toThrow()
    expect(() => readSoloSave('x'.repeat(2000001))).toThrow()
  })
  it('merges titles and best records written by another tab', () => {
    const storage = memory(),
      save = emptySoloSave()
    saveSoloProgress(storage, {
      ...save,
      routes: ['reading'],
      records: { survival: { wins: 3, frames: 4000, score: 42, cleared: false } },
    })
    saveSoloProgress(storage, {
      ...save,
      routes: ['escort'],
      records: { survival: { wins: 1, frames: 900, score: 20, cleared: false } },
    })
    expect(loadSoloSave(storage).save.routes).toEqual(['reading', 'escort'])
    expect(loadSoloSave(storage).save.records.survival?.wins).toBe(3)
  })
  it('keeps play available when local storage is denied', () => {
    const controller = createSoloController({
      storage: {
        getItem: () => {
          throw Error('denied')
        },
        setItem: () => {
          throw Error('denied')
        },
      },
    })
    controller.load()
    expect(get(controller).issue).toBe('storage')
    controller.start({ mode: 'story', route: 'reading', fighter: 'kurapika' })
    controller.begin()
    for (let i = 0; i < 30; i++) controller.tick(1 / 60, { ...EMPTY_INPUT, gyo: true })
    expect(get(controller).session?.run.status).toBe('won')
    expect(get(controller).issue).toBe('storage')
  })
})
