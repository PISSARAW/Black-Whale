import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'
import { createCareerProfile, fighterMastery } from './profile'
import { readCareer, cleanCareerName } from './storage'
import { CAREER_STORAGE, emptyCareer, type CareerMatch } from './types'
import { createCareerTracker } from './runtime'
import { createMatchPractice } from './practice'
import { createFightMatchRuntime } from '../fightMatchRuntime'
import { beginFight, createFight } from '../engine'
import { EMPTY_INPUT, type FightState } from '../types'
import { createReplayRecorder } from '../fightReplayRecorder'
import { executeReplayPacket } from '../fightReplayCommands'
import { fightReplayHash } from '../fightReplayHash'

const memory = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}
function result(id = 'match-1'): CareerMatch {
  return {
    id,
    at: 100,
    source: 'versus-ai',
    player: 'kurapika',
    opponent: 'hisoka',
    stage: 'whale-hold',
    format: 'knockout',
    winner: 'player',
    rounds: { player: 2, opponent: 1 },
    ruleset: 'test',
    practice: {
      frames: 600,
      player: { bestCombo: 3, bestComboDamage: 24, healthLost: 10 },
      opponent: { bestCombo: 1, bestComboDamage: 10, healthLost: 300 },
    },
  }
}
describe('persistent local Clash career', () => {
  it('starts empty, bounds text and sanitizes names without interpreting markup', () => {
    expect(readCareer()).toEqual(emptyCareer())
    expect(cleanCareerName('\u0000 A\nB\u007f ')).toBe('AB')
    expect(cleanCareerName('x'.repeat(40))).toHaveLength(24)
    const storage = memory()
    for (const text of ['{', 'x'.repeat(400001), '{}', 'null']) {
      storage.setItem(CAREER_STORAGE, text)
      expect(readCareer(storage)).toEqual(emptyCareer())
    }
  })
  it('persists results and cosmetic choices while deduplicating finished matches', () => {
    const storage = memory(),
      profile = createCareerProfile(() => storage)
    profile.load()
    profile.configure('Hunter', { theme: 'nocturne', intro: 'brief', victory: 'ready' })
    profile.record(result())
    profile.record(result())
    const restored = readCareer(storage)
    expect(restored.history).toHaveLength(1)
    expect(restored.appearance.theme).toBe('nocturne')
    expect(fighterMastery(restored, 'kurapika')).toMatchObject({
      matches: 1,
      wins: 1,
      points: 36,
      bestCombo: 3,
      frames: 600,
    })
    profile.consumeMorale('match-1')
    profile.consumeMorale('match-1')
    expect(readCareer(storage).moraleSeen).toEqual(['match-1'])
  })
  it('retains lifetime mastery when the bounded match history evicts old results', () => {
    const profile = createCareerProfile(() => undefined)
    for (let index = 0; index < 240; index++)
      profile.record({ ...result(String(index)), at: index })
    expect(get(profile).history).toHaveLength(200)
    expect(fighterMastery(get(profile), 'kurapika').matches).toBe(240)
    profile.record(result('0'))
    expect(fighterMastery(get(profile), 'kurapika').matches).toBe(240)
  })
  it('merges a second tab’s completed results and works for the session when storage is blocked', () => {
    const storage = memory(),
      a = createCareerProfile(() => storage),
      b = createCareerProfile(() => storage)
    a.load()
    b.load()
    a.record(result('a'))
    b.record(result('b'))
    a.record(result('c'))
    expect(readCareer(storage).history).toHaveLength(3)
    const blocked = createCareerProfile(() => ({
      getItem() {
        throw Error('blocked')
      },
      setItem() {
        throw Error('blocked')
      },
      removeItem() {},
    }))
    blocked.load()
    blocked.record(result())
    expect(get(blocked).history).toHaveLength(1)
    blocked.clear()
    expect(get(blocked)).toMatchObject({ history: [], totals: {}, name: 'Hunter' })
  })
  it('drops malformed or unfinished historical results and resets invalid preferences', () => {
    const storage = memory()
    storage.setItem(
      CAREER_STORAGE,
      JSON.stringify({
        ...emptyCareer(),
        appearance: { theme: 'evil', intro: 'slow', victory: 'kill' },
        history: [result(), { ...result('bad'), rounds: { player: 1, opponent: 0 } }],
      }),
    )
    expect(readCareer(storage).history).toHaveLength(1)
    expect(readCareer(storage).appearance).toEqual(emptyCareer().appearance)
  })
})
describe('career observes actual referee states', () => {
  it('never grants career progress while playing a recorded match', async () => {
    const observed: CareerMatch[] = []
    const initial = createFight('hisoka', 'theta', { mode: 'versus-local', formatId: 'knockout' })
    const recorder = createReplayRecorder(initial)!
    const packet = [1 / 60, 0, 0, [{ kind: 'start' }]] as const
    const mutable = structuredClone(packet) as unknown as import('../fightReplayTypes').ReplayPacket
    const after = executeReplayPacket(initial, mutable)
    recorder.append(initial, mutable, after)
    const runtime = createFightMatchRuntime(undefined, {
      career: createCareerTracker((match) => observed.push(match)),
    })
    runtime.begin(initial)
    await runtime.replays.import(JSON.stringify(recorder.snapshot()))
    const replay = get(runtime.replays).library[0]
    expect(replay).toBeDefined()
    let state = runtime.replays.open(replay.id, initial)!
    state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60 })
    expect(state.phase).toBe('fighting')
    expect(runtime.replays.active).toBe(true)
    expect(observed).toEqual([])
  })
  it('records once after a real finishing strike, without changing the state hash or RNG', () => {
    const entries: CareerMatch[] = [],
      observer = createCareerTracker(
        (entry) => entries.push(entry),
        () => 100,
      )
    const runtime = createFightMatchRuntime(undefined, { career: observer, record: false })
    let state = beginFight(
      createFight('hisoka', 'theta', { mode: 'versus-local', formatId: 'knockout' }),
    )
    state = {
      ...state,
      roundsWon: { player: 1, opponent: 0 },
      roundNumber: 2,
      player: { ...state.player, x: 44 },
      opponent: { ...state.opponent, x: 50, health: 1 },
    }
    runtime.begin(state)
    const reference = createFightMatchRuntime(undefined, { record: false })
    let control = structuredClone(state)
    reference.begin(control)
    reference.enqueue(control, { kind: 'move', side: 'player', action: 'heavy', input: 0 })
    runtime.enqueue(state, { kind: 'move', side: 'player', action: 'heavy', input: 0 })
    for (let frame = 0; frame < 50; frame++) {
      state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      control = reference.advance(control, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    }
    expect(fightReplayHash(state)).toBe(fightReplayHash(control))
    expect(state.matchWinner).toBe('player')
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      at: 100,
      player: 'hisoka',
      rounds: { player: 2, opponent: 0 },
    })
    expect(entries[0].practice.opponent.healthLost).toBeGreaterThan(0)
    expect(entries[0].practice.player.bestCombo).toBeGreaterThan(0)
  })
  it('does not award training, unfinished matches, or forecast frames', () => {
    const entries: CareerMatch[] = [],
      observer = createCareerTracker((entry) => entries.push(entry))
    const lab = beginFight(createFight('hisoka', 'theta', { mode: 'training' }))
    observer.begin(lab)
    observer.observe(lab, { ...lab, phase: 'finished', matchWinner: 'player' })
    const duel = beginFight(createFight('hisoka', 'theta', { mode: 'versus-local' }))
    observer.begin(duel)
    observer.observe(duel, { ...duel, winner: 'player' })
    expect(entries).toEqual([])
    const stats = createMatchPractice()
    stats.observe(duel, {
      ...duel,
      forecastSimulation: true,
      opponent: { ...duel.opponent, health: 1 },
    })
    expect(stats.snapshot().opponent.healthLost).toBe(0)
  })
  it('measures both bodies in a trade, keeps resurrection recovery separate, and excludes round resets', () => {
    const stats = createMatchPractice(),
      before = beginFight(createFight('hisoka', 'camilla', { mode: 'versus-local' }))
    const after: FightState = {
      ...before,
      player: { ...before.player, health: 280 },
      opponent: { ...before.opponent, health: 270 },
      remainingFrames: before.remainingFrames - 1,
    }
    stats.observe(before, after)
    stats.observe(after, { ...before, roundNumber: 2 })
    expect(stats.snapshot()).toMatchObject({
      frames: 1,
      player: { healthLost: 20 },
      opponent: { healthLost: 30 },
    })
  })
})
